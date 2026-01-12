import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Sparkles,
  Reply,
  Trash2,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content_id: string;
  user_id: string | null;
  pk_user_id: string | null;
  parent_id: string | null;
  content: string;
  is_content_request: boolean;
  created_at: string;
  // Joined data
  user_display_name?: string;
  pk_user_display_name?: string;
}

interface CreatorCommentsProps {
  contentId: string;
  creatorId?: string;
}

export const CreatorComments = ({ contentId, creatorId }: CreatorCommentsProps) => {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isContentRequest, setIsContentRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoggedIn = !!user || !!privateKeyUser;

  const fetchComments = useCallback(async () => {
    try {
      // Fetch comments with user info
      const { data: commentsData, error } = await supabase
        .from('creator_comments')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user display names for comments
      const userIds = [...new Set(commentsData?.filter(c => c.user_id).map(c => c.user_id) || [])];
      const pkUserIds = [...new Set(commentsData?.filter(c => c.pk_user_id).map(c => c.pk_user_id) || [])];

      let userNames: Record<string, string> = {};
      let pkUserNames: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', userIds);
        profiles?.forEach(p => {
          if (p.id && p.display_name) userNames[p.id] = p.display_name;
        });
      }

      if (pkUserIds.length > 0) {
        const { data: pkProfiles } = await supabase
          .from('public_private_key_users')
          .select('id, display_name')
          .in('id', pkUserIds);
        pkProfiles?.forEach(p => {
          if (p.id && p.display_name) pkUserNames[p.id] = p.display_name;
        });
      }

      // Enrich comments with display names
      const enrichedComments = commentsData?.map(comment => ({
        ...comment,
        user_display_name: comment.user_id ? userNames[comment.user_id] : undefined,
        pk_user_display_name: comment.pk_user_id ? pkUserNames[comment.pk_user_id] : undefined,
      })) || [];

      setComments(enrichedComments);
    } catch (error) {
      console.error('[CreatorComments] Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_comments',
          filter: `content_id=eq.${contentId}`
        },
        () => {
          // Refetch on any change
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!user && !privateKeyUser) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData: any = {
        content_id: contentId,
        content: newComment.trim(),
        is_content_request: isContentRequest,
        parent_id: replyingTo || null,
      };

      if (user) {
        commentData.user_id = user.id;
      } else if (privateKeyUser) {
        commentData.pk_user_id = privateKeyUser.id;
      }

      const { error } = await supabase
        .from('creator_comments')
        .insert(commentData);

      if (error) throw error;

      setNewComment('');
      setIsContentRequest(false);
      setReplyingTo(null);
      toast.success(isContentRequest ? 'Content request submitted!' : 'Comment posted!');
    } catch (error) {
      console.error('[CreatorComments] Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('creator_comments')
        .delete()
        .eq('id', deleteCommentId);

      if (error) throw error;
      toast.success('Comment deleted');
    } catch (error) {
      console.error('[CreatorComments] Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
      setDeleteCommentId(null);
    }
  };

  const getDisplayName = (comment: Comment) => {
    return comment.user_display_name || comment.pk_user_display_name || 'Anonymous';
  };

  const canDelete = (comment: Comment) => {
    if (user && comment.user_id === user.id) return true;
    if (privateKeyUser && comment.pk_user_id === privateKeyUser.id) return true;
    return false;
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (parentId: string) => replies.filter(r => r.parent_id === parentId);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment form */}
        {isLoggedIn ? (
          <div className="space-y-3">
            {replyingTo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Reply className="w-4 h-4" />
                Replying to comment
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isContentRequest 
                ? "Describe the content you'd like to see..." 
                : "Write a comment..."
              }
              rows={3}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="content-request"
                  checked={isContentRequest}
                  onCheckedChange={setIsContentRequest}
                />
                <Label htmlFor="content-request" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-[#FF6600]" />
                  Content Request
                </Label>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {isContentRequest ? 'Submit Request' : 'Post'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Log in to join the conversation</p>
          </div>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t">
            {topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main comment */}
                <div className={`flex gap-3 ${comment.is_content_request ? 'p-3 rounded-lg bg-[#FF6600]/5 border border-[#FF6600]/20' : ''}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getDisplayName(comment)[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{getDisplayName(comment)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                      {comment.is_content_request && (
                        <Badge variant="outline" className="text-[#FF6600] border-[#FF6600]/50 gap-1">
                          <Sparkles className="w-3 h-3" />
                          Request
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                        className="h-7 px-2 text-xs"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      {canDelete(comment) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className={`flex gap-3 ml-11 ${reply.is_content_request ? 'p-3 rounded-lg bg-[#FF6600]/5 border border-[#FF6600]/20' : ''}`}>
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getDisplayName(reply)[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{getDisplayName(reply)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                        {reply.is_content_request && (
                          <Badge variant="outline" className="text-[#FF6600] border-[#FF6600]/50 gap-1 text-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            Request
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{reply.content}</p>
                      {canDelete(reply) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteCommentId(reply.id)}
                          className="h-6 px-2 text-xs text-destructive mt-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CreatorComments;
