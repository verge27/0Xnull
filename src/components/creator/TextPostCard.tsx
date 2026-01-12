import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Pin, 
  Heart, 
  MessageCircle, 
  Share2,
  MoreVertical,
  Trash2,
  PinOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ContentItem, CreatorProfile, creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';

interface TextPostCardProps {
  content: ContentItem;
  creator: CreatorProfile;
  isOwner?: boolean;
  onDelete?: (contentId: string) => void;
  onTogglePin?: (contentId: string, isPinned: boolean) => void;
}

// Simple localStorage-based likes
const getLikedContentIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem('liked_content');
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const setLikedContentIds = (ids: Set<string>) => {
  localStorage.setItem('liked_content', JSON.stringify([...ids]));
};

export const TextPostCard = ({ 
  content, 
  creator, 
  isOwner = false,
  onDelete,
  onTogglePin
}: TextPostCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(() => getLikedContentIds().has(content.id));
  const [likeCount, setLikeCount] = useState(content.view_count || 0);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const likedIds = getLikedContentIds();
    
    if (isLiked) {
      likedIds.delete(content.id);
      setLikeCount(prev => Math.max(0, prev - 1));
      setIsLiked(false);
      toast.success('Removed from favorites');
    } else {
      likedIds.add(content.id);
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
      toast.success('Added to favorites');
    }
    
    setLikedContentIds(likedIds);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/content/${content.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await creatorApi.deleteContent(content.id);
      if (onDelete) {
        onDelete(content.id);
      }
      toast.success('Post deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTogglePin = () => {
    if (onTogglePin) {
      onTogglePin(content.id, !content.is_pinned);
      toast.success(content.is_pinned ? 'Post unpinned' : 'Post pinned to top');
    }
  };

  // Format created time
  const createdAt = (() => {
    try {
      const ts = content.created_at;
      const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
      if (isNaN(date.getTime())) return 'Recently';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <>
      <Card className={`overflow-hidden ${content.is_pinned ? 'border-[#FF6600]/50 bg-[#FF6600]/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={creator.avatar_url ? creatorApi.getMediaUrl(creator.avatar_url) : undefined} />
                <AvatarFallback>{creator.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{creator.display_name}</span>
                  {content.is_pinned && (
                    <Badge variant="outline" className="text-[#FF6600] border-[#FF6600]/50 gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{createdAt}</p>
              </div>
            </div>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {content.is_pinned ? (
                      <>
                        <PinOff className="w-4 h-4 mr-2" />
                        Unpin Post
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4 mr-2" />
                        Pin to Top
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Title as heading if present */}
          {content.title && content.title !== 'null' && content.title.trim() && (
            <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
          )}
          
          {/* Main text content */}
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {content.description || ''}
          </p>
          
          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {content.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1.5 ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{likeCount}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">0</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 ml-auto"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TextPostCard;
