import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Lock, 
  Play, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContentItem, creatorApi, CreatorProfile } from '@/services/creatorApi';
import { TipModal } from './TipModal';
import { toast } from 'sonner';

interface ContentFeedItemProps {
  content: ContentItem;
  creator: CreatorProfile;
  isSubscribed?: boolean;
}

const TEASER_DURATION = 10; // 10 second teaser for paid content

export const ContentFeedItem = ({ content, creator, isSubscribed = false }: ContentFeedItemProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTeaserOverlay, setShowTeaserOverlay] = useState(false);
  const [teaserTimeLeft, setTeaserTimeLeft] = useState(TEASER_DURATION);
  const [copied, setCopied] = useState(false);

  const isPaid = content.tier === 'paid';
  const isLocked = isPaid && !isSubscribed;
  const isVideo = content.media_hash?.match(/\.(mp4|webm|mov)$/i);
  
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

  const handleVideoClick = () => {
    if (isLocked) {
      if (!isPlaying && isVideo) {
        handlePlayTeaser();
      }
    } else {
      navigate(`/content/${content.id}`);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
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
            {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
          </p>
        </div>
        {isPaid && (
          <Badge variant="outline" className="border-[#FF6600]/50 text-[#FF6600]">
            {content.price_xmr} XMR
          </Badge>
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

            {/* Play button for video */}
            {!isPlaying && !showTeaserOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-[#FF6600] flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={content.thumbnail_url ? creatorApi.getMediaUrl(content.thumbnail_url) : '/placeholder.svg'}
            alt={content.title || 'Content'}
            className={`w-full aspect-video object-cover ${isLocked ? 'blur-md' : ''}`}
          />
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
        {content.title && (
          <h3 className="font-semibold mb-2">{content.title}</h3>
        )}
        {content.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {content.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-[#FF6600] transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{content.unlock_count || 0}</span>
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
    </Card>
  );
};
