import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Lock, 
  Play, 
  Pause,
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  Gift,
  Check,
  MoreVertical,
  Trash2,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { ContentItem, creatorApi, CreatorProfile } from '@/services/creatorApi';
import { TipModal } from './TipModal';
import { toast } from 'sonner';

interface ContentFeedItemProps {
  content: ContentItem;
  creator: CreatorProfile;
  isSubscribed?: boolean;
  isOwner?: boolean;
  onDelete?: (contentId: string) => void;
}

const TEASER_DURATION = 10; // 10 second teaser for paid content

// Simple localStorage-based likes (persistent per-browser)
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

export const ContentFeedItem = ({ 
  content, 
  creator, 
  isSubscribed = false,
  isOwner = false,
  onDelete 
}: ContentFeedItemProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTeaserOverlay, setShowTeaserOverlay] = useState(false);
  const [teaserTimeLeft, setTeaserTimeLeft] = useState(TEASER_DURATION);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Like state
  const [isLiked, setIsLiked] = useState(() => getLikedContentIds().has(content.id));
  const [likeCount, setLikeCount] = useState(content.unlock_count || 0);

  const isPaid = content.tier === 'paid';
  const isLocked = isPaid && !isSubscribed;
  const isVideo = content.media_type?.startsWith('video/') || content.media_hash?.match(/\.(mp4|webm|mov)$/i);
  
  // Format title - handle null/undefined/"null" cases
  const displayTitle = (() => {
    if (content.title && content.title !== 'null' && content.title.trim()) {
      return content.title;
    }
    try {
      const ts = content.created_at;
      const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
      if (isNaN(date.getTime())) return 'Untitled';
      return `Post from ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return 'Untitled';
    }
  })();

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
  
  // Teaser countdown for paid video content
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && isLocked && isVideo) {
      interval = setInterval(() => {
        setTeaserTimeLeft((prev) => {
          if (prev <= 1) {
            // Stop video after teaser ends
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
            setIsPlaying(false);
            setShowTeaserOverlay(true);
            return TEASER_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, isLocked, isVideo]);

  const handlePlayTeaser = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setShowTeaserOverlay(false);
      setTeaserTimeLeft(TEASER_DURATION);
    }
  };

  // Toggle inline video play/pause
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLocked) {
      if (!isPlaying && isVideo) {
        handlePlayTeaser();
      }
      return;
    }
    
    // For unlocked content - play/pause inline
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // For non-video content, navigate to detail
      navigate(`/content/${content.id}`);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await creatorApi.deleteContent(content.id);
      onDelete(content.id);
      toast.success('Content deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete content');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/content/${content.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/creator/${creator.id}/content/${content.id}`;
    const shareTitle = content.title 
      ? `${content.title} by ${creator.display_name}`
      : `Content by ${creator.display_name}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: content.description || `Check out this content on 0xNull Creators`,
          url: shareUrl,
        });
        return;
      }
    } catch (err) {
      // Share was cancelled or failed, fall back to clipboard
      console.warn('[ContentFeedItem] navigator.share failed:', err);
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ContentFeedItem] copy failed:', err);
      toast.error('Could not copy link');
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-[#FF6600]/30 transition-colors">
      {/* Header - Creator info */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Avatar 
          className="w-10 h-10 cursor-pointer" 
          onClick={() => navigate(`/creator/${creator.id}`)}
        >
          {creator.avatar_url ? (
            <AvatarImage src={creatorApi.getMediaUrl(creator.avatar_url)} />
          ) : null}
          <AvatarFallback className="bg-[#FF6600]/20 text-[#FF6600]">
            {(creator.display_name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p 
            className="font-semibold text-sm hover:text-[#FF6600] cursor-pointer transition-colors"
            onClick={() => navigate(`/creator/${creator.id}`)}
          >
            {creator.display_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(() => {
              try {
                // Handle Unix timestamp (seconds) or ISO string
                const ts = content.created_at;
                const date = typeof ts === 'number' 
                  ? new Date(ts * 1000) 
                  : new Date(ts);
                if (isNaN(date.getTime())) return 'Recently';
                return formatDistanceToNow(date, { addSuffix: true });
              } catch {
                return 'Recently';
              }
            })()}
          </p>
        </div>
        {isPaid && (
          <Badge variant="outline" className="border-[#FF6600]/50 text-[#FF6600]">
            {content.price_xmr} XMR
          </Badge>
        )}
        
        {/* Owner dropdown menu */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/content/${content.id}`)}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div 
        className="relative cursor-pointer"
        onClick={handleVideoClick}
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={creatorApi.getMediaUrl(content.media_hash!)}
              poster={content.thumbnail_url ? creatorApi.getMediaUrl(content.thumbnail_url) : undefined}
              className={`w-full aspect-video object-cover ${isLocked && !isPlaying ? 'blur-md' : ''}`}
              muted={isMuted}
              playsInline
              loop={!isLocked}
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Video controls */}
            {isPlaying && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 bg-background/80 hover:bg-background"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
            
            {/* Teaser countdown */}
            {isPlaying && isLocked && (
              <div className="absolute top-4 right-4 bg-background/90 rounded-full px-3 py-1">
                <span className="text-sm font-medium text-[#FF6600]">
                  Teaser: {teaserTimeLeft}s
                </span>
              </div>
            )}

            {/* Play/Pause button for video */}
            {!showTeaserOverlay && !isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:opacity-100 transition-opacity"
                   style={{ opacity: isPlaying ? 0 : 1 }}>
                <div className="w-16 h-16 rounded-full bg-[#FF6600] flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  )}
                </div>
              </div>
            )}
            
            {/* Play button for locked content */}
            {!isPlaying && !showTeaserOverlay && isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-[#FF6600] flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
            )}
          </>
        ) : content.media_hash ? (
          // For non-video content with media_hash, try to display it
          <img
            src={creatorApi.getMediaUrl(content.thumbnail_url || content.media_hash)}
            alt={content.title || 'Content'}
            className={`w-full aspect-video object-cover ${isLocked ? 'blur-md' : ''}`}
          />
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No preview</span>
          </div>
        )}

        {/* Locked overlay */}
        {(isLocked && (!isVideo || showTeaserOverlay || !isPlaying)) && (
          <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center">
            <Lock className="w-10 h-10 mb-3 text-[#FF6600]" />
            {isVideo && (
              <Button
                onClick={handlePlayTeaser}
                variant="outline"
                className="mb-3 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch {TEASER_DURATION}s Teaser
              </Button>
            )}
            <Button
              onClick={handleUnlock}
              className="bg-[#FF6600] hover:bg-[#FF6600]/90"
            >
              Unlock for {content.price_xmr} XMR
            </Button>
          </div>
        )}

        {/* Free badge */}
        {!isPaid && (
          <Badge className="absolute top-4 left-4 bg-green-600 text-white">
            Free
          </Badge>
        )}
      </div>

      {/* Footer - Engagement */}
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{displayTitle}</h3>
        {content.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {content.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <button 
            className={`flex items-center gap-1 hover:text-[#FF6600] transition-colors ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#FF6600] transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">0</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#FF6600] transition-colors">
            <Eye className="w-5 h-5" />
            <span className="text-sm">{content.view_count || 0}</span>
          </button>
          <TipModal 
            creator={creator} 
            contentId={content.id}
            trigger={
              <button className="flex items-center gap-1 hover:text-[#FF6600] transition-colors">
                <Gift className="w-5 h-5" />
                <span className="text-sm">Tip</span>
              </button>
            }
          />
          <button 
            className="ml-auto hover:text-[#FF6600] transition-colors flex items-center gap-1"
            onClick={handleShare}
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
            <span className="text-sm hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {content.tags.slice(0, 5).map((tag, i) => (
              <Badge key={tag || i} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{displayTitle}"? This action cannot be undone.
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
    </Card>
  );
};
