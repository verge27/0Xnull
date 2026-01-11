import { useState, useRef, useEffect, useCallback } from 'react';
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
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw
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
  const containerRef = useRef<HTMLDivElement>(null);
  const wasPlayingBeforeFullscreenRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTeaserOverlay, setShowTeaserOverlay] = useState(false);
  const [teaserTimeLeft, setTeaserTimeLeft] = useState(TEASER_DURATION);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<'forward' | 'backward' | null>(null);
  const [volume, setVolume] = useState(1);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const touchStartRef = useRef<{ y: number; volume: number } | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Seek video by amount in seconds
  const seekVideo = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + seconds
      ));
      setSeekIndicator(seconds > 0 ? 'forward' : 'backward');
      setTimeout(() => setSeekIndicator(null), 500);
    }
  }, []);

  // Haptic feedback for mobile
  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Short 10ms pulse
    }
  };

  const doTogglePlayPause = () => {
    hapticFeedback();
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Toggle play/pause via explicit button (never via tap)
  const togglePlayPause = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lastTapRef.current = null;
    doTogglePlayPause();
  };

  // Handle video area click - double-tap seek only, no pause on single tap
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If the click originated from player UI controls, ignore it completely.
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-video-control], [data-progress], button')) {
      return;
    }

    // Extra safety: check refs directly (Android touch event quirks)
    if (
      controlsRef.current?.contains(target) ||
      progressContainerRef.current?.contains(target)
    ) {
      return;
    }
    
    if (isLocked) {
      if (!isPlaying && isVideo) {
        handlePlayTeaser();
      }
      return;
    }

    // If video is not playing, start it on tap
    if (!isPlaying && isVideo && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      return;
    }

    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;

    // Check for double-tap (within 300ms) - seek only while playing
    if (lastTapRef.current && now - lastTapRef.current.time < 300 && isPlaying && isVideo) {
      if (isLeftSide) {
        seekVideo(-10);
      } else {
        seekVideo(10);
      }
      lastTapRef.current = null;
      return;
    }

    // Record this tap for double-tap detection
    lastTapRef.current = { time: now, x: clickX };

    // Single tap on playing video does nothing - use pause button instead
    if (!isVideo) {
      // For non-video content, navigate to detail
      navigate(`/content/${content.id}`);
    }
  };

  // Touch handlers for volume swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isPlaying || !isVideo || isLocked) return;
    
    const touch = e.touches[0];
    touchStartRef.current = { y: touch.clientY, volume };
  }, [isPlaying, isVideo, isLocked, volume]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !videoRef.current || !isPlaying) return;
    
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const sensitivity = 200; // pixels for full volume range
    
    // Calculate new volume based on swipe distance
    const volumeChange = deltaY / sensitivity;
    const newVolume = Math.max(0, Math.min(1, touchStartRef.current.volume + volumeChange));
    
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    // Unmute if adjusting volume
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    
    setShowVolumeIndicator(true);
  }, [isPlaying, isMuted]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    // Hide volume indicator after a delay
    setTimeout(() => setShowVolumeIndicator(false), 800);
  }, []);
  
  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await creatorApi.deleteContent(content.id);
      // Call the callback if provided
      if (onDelete) {
        onDelete(content.id);
      }
      toast.success('Content deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete content');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [isSeeking]);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Handle progress bar click/drag
  const handleProgressBarInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lastTapRef.current = null;
    if (!progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = position * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleProgressBarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSeeking(true);
    handleProgressBarInteraction(e);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current || !videoRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const newTime = position * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };
    
    const handleMouseUp = () => {
      setIsSeeking(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [duration, handleProgressBarInteraction]);

  const handleProgressBarTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
    handleProgressBarInteraction(e);
  }, [handleProgressBarInteraction]);

  const handleProgressBarTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!progressBarRef.current || !videoRef.current || !isSeeking) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
    const newTime = position * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, isSeeking]);

  const handleProgressBarTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSeeking(false);
  }, []);

  const doToggleMute = () => {
    hapticFeedback();
    const el = videoRef.current;
    if (!el) return;

    const wasPlaying = !el.paused && !el.ended;
    const newMuted = !isMuted;

    console.log('[ContentFeedItem] toggleMute', { wasPlaying, from: isMuted, to: newMuted });

    setIsMuted(newMuted);
    el.muted = newMuted;

    // Some browsers can briefly pause when toggling muted; ensure playback resumes.
    if (wasPlaying) {
      if (!newMuted && el.volume === 0) {
        el.volume = Math.max(0.2, volume);
        setVolume(el.volume);
      }

      queueMicrotask(() => {
        el.play().catch((err) => console.warn('[ContentFeedItem] play() after toggleMute failed', err));
      });
    }
  };

  const toggleMute = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lastTapRef.current = null;
    doToggleMute();
  };

  const doToggleFullscreen = async () => {
    hapticFeedback();
    const el = videoRef.current;
    const wasPlaying = !!el && !el.paused && !el.ended;
    wasPlayingBeforeFullscreenRef.current = wasPlaying;

    try {
      if (!document.fullscreenElement) {
        if (el) {
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if ((el as any).webkitEnterFullscreen) {
            (el as any).webkitEnterFullscreen();
          }
          setIsFullscreen(true);

          if (wasPlaying) {
            queueMicrotask(() => {
              el.play().then(() => setIsPlaying(true)).catch(() => {
                // ignore
              });
            });
          }
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const toggleFullscreen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lastTapRef.current = null;
    void doToggleFullscreen();
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      // Some Android browsers pause the element during the fullscreen transition.
      if (isFs && wasPlayingBeforeFullscreenRef.current && videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          // ignore
        });
      }

      if (!isFs) {
        wasPlayingBeforeFullscreenRef.current = false;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Diagnostics (mobile fullscreen/control pause issues)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const log = (event: string, extra: Record<string, unknown> = {}) => {
      console.log('[ContentFeedItem][video]', event, {
        paused: el.paused,
        ended: el.ended,
        currentTime: el.currentTime,
        readyState: el.readyState,
        networkState: el.networkState,
        muted: el.muted,
        volume: el.volume,
        fullscreen: !!document.fullscreenElement,
        visibility: document.visibilityState,
        ...extra,
      });
    };

    const onPause = () => log('pause');
    const onPlay = () => log('play');
    const onPlaying = () => log('playing');
    const onWaiting = () => log('waiting');
    const onStalled = () => log('stalled');

    const onVisibility = () => log('visibilitychange');

    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('stalled', onStalled);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('stalled', onStalled);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [content.id]);

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            {/* Progress bar */}
            {isPlaying && !isLocked && duration > 0 && (
              <div 
                ref={progressContainerRef}
                className="absolute bottom-0 left-0 right-0 px-2 pb-1 pt-6 bg-gradient-to-t from-black/60 to-transparent"
                data-progress
                onClickCapture={(e) => e.stopPropagation()}
                onPointerDownCapture={(e) => e.stopPropagation()}
                onTouchStartCapture={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 text-white text-xs">
                  <span className="min-w-[36px]">{formatTime(currentTime)}</span>
                  <div
                    ref={progressBarRef}
                    className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative group"
                    onMouseDown={handleProgressBarMouseDown}
                    onTouchStart={handleProgressBarTouchStart}
                    onTouchMove={handleProgressBarTouchMove}
                    onTouchEnd={handleProgressBarTouchEnd}
                  >
                    {/* Progress fill */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#FF6600] rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    {/* Scrubber handle */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
                    />
                  </div>
                  <span className="min-w-[36px] text-right">{formatTime(duration)}</span>
                </div>
              </div>
            )}
            
            {/* Video controls - left side (pause) */}
            {isPlaying && (
              <div
                className="absolute bottom-8 left-4 flex gap-2 z-10"
                data-video-control
              >
                <button
                  type="button"
                  className="h-12 w-12 flex items-center justify-center bg-background/80 hover:bg-background active:scale-95 touch-manipulation rounded-full transition-transform cursor-pointer select-none"
                  onClick={togglePlayPause}
                >
                  <Pause className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Video controls - right side (mute, fullscreen) */}
            {isPlaying && (
              <div
                ref={controlsRef}
                className="absolute bottom-8 right-4 flex gap-2 z-10"
                data-video-control
              >
                <button
                  type="button"
                  className="h-12 w-12 flex items-center justify-center bg-background/80 hover:bg-background active:scale-95 touch-manipulation rounded-full transition-transform cursor-pointer select-none"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  className="h-12 w-12 flex items-center justify-center bg-background/80 hover:bg-background active:scale-95 touch-manipulation rounded-full transition-transform cursor-pointer select-none"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            )}
            
            {/* Seek indicator */}
            {seekIndicator && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${seekIndicator === 'backward' ? 'left-8' : 'right-8'} animate-pulse`}>
                <div className="bg-background/80 rounded-full p-3">
                  {seekIndicator === 'backward' ? (
                    <RotateCcw className="w-8 h-8 text-white" />
                  ) : (
                    <RotateCw className="w-8 h-8 text-white" />
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white text-xs font-medium whitespace-nowrap">
                    {seekIndicator === 'backward' ? '-10s' : '+10s'}
                  </span>
                </div>
              </div>
            )}

            {/* Volume indicator */}
            {showVolumeIndicator && isPlaying && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                <div className="bg-background/80 rounded-full p-2">
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="h-24 w-1 bg-white/30 rounded-full overflow-hidden rotate-180">
                  <div 
                    className="w-full bg-[#FF6600] rounded-full transition-all duration-100"
                    style={{ height: `${volume * 100}%` }}
                  />
                </div>
                <span className="text-white text-xs font-medium">
                  {Math.round(volume * 100)}%
                </span>
              </div>
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
