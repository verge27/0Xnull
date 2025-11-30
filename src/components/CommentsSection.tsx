import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Reply } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

const SEED_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'CryptoTrader',
    content: 'Great insights on the marketplace trends! I\'ve been considering selling privacy hardware and this data confirms there\'s real demand.',
    timestamp: '2 days ago',
    likes: 12,
  },
  {
    id: '2',
    author: 'PrivacyFirst',
    content: 'The point about "seeing the unseen" really resonates. I noticed there aren\'t many VPN service providers on XMRBazaar yet - huge opportunity!',
    timestamp: '1 day ago',
    likes: 8,
    replies: [
      {
        id: '2-1',
        author: 'TechSeller',
        content: 'Good call! Also noticed a gap in privacy-focused email hosting services.',
        timestamp: '1 day ago',
        likes: 4,
      }
    ]
  },
  {
    id: '3',
    author: 'MoneroMerchant',
    content: 'The data on completed vs listed orders is eye-opening. Quality over quantity matters more than I thought in this marketplace.',
    timestamp: '18 hours ago',
    likes: 15,
  },
];

export const CommentsSection = () => {
  const [comments] = useState<Comment[]>(SEED_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [showReplyInput, setShowReplyInput] = useState<string | null>(null);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    // In a real app, this would submit to a backend
    console.log('New comment:', newComment);
    setNewComment('');
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <CardTitle>Community Discussion</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {comments.length} comments
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts on XMRBazaar marketplace trends..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setNewComment('')}
              disabled={!newComment.trim()}
            >
              Clear
            </Button>
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6 pt-4 border-t">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={comment.avatar} />
                  <AvatarFallback>{comment.author[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => setShowReplyInput(showReplyInput === comment.id ? null : comment.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Reply Input */}
                  {showReplyInput === comment.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder={`Reply to ${comment.author}...`}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReplyInput(null)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm">
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-border space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback>{reply.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{reply.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {reply.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {reply.content}
                            </p>
                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};