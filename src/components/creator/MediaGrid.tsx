import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Play, Eye, Image as ImageIcon, Share2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem, creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';

interface MediaGridProps {
  content: ContentItem[];
  isSubscribed?: boolean;
  creatorId?: string;
}

export const MediaGrid = ({ content, isSubscribed = false, creatorId }: MediaGridProps) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    const cId = creatorId || item.creator_id;
    const shareUrl = cId 
      ? `${window.location.origin}/creator/${cId}/content/${item.id}`
      : `${window.location.origin}/content/${item.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title || 'Content on 0xNull Creators',
          url: shareUrl,
        });
        return;
      }
    } catch (err) {
      console.warn('[MediaGrid] navigator.share failed:', err);
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(item.id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('[MediaGrid] copy failed:', err);
      toast.error('Could not copy link');
    }
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No media yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {content.map((item) => {
        const isPaid = item.tier === 'paid';
        const isLocked = isPaid && !isSubscribed;
        const isVideo = item.media_type?.startsWith('video/') || item.media_hash?.match(/\.(mp4|webm|mov)$/i);

        return (
          <div
            key={item.id}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm"
            onClick={() => navigate(`/content/${item.id}`)}
          >
            {/* Thumbnail - for videos without thumbnails, use the video element */}
            {isVideo && !item.thumbnail_url && item.media_hash ? (
              <video
                src={creatorApi.getMediaUrl(item.media_hash)}
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  isLocked ? 'blur-sm' : ''
                }`}
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={item.thumbnail_url ? creatorApi.getMediaUrl(item.thumbnail_url) : '/placeholder.svg'}
                alt={item.title || 'Content'}
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  isLocked ? 'blur-sm' : ''
                }`}
              />
            )}

            {/* Hover overlay with share button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {item.view_count || 0}
                </span>
                <button
                  onClick={(e) => handleShare(e, item)}
                  className="flex items-center gap-1 hover:text-[#FF6600] transition-colors bg-black/50 rounded-full px-2 py-1"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Video indicator */}
            {isVideo && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Locked indicator */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/80 rounded-full p-2">
                  <Lock className="w-5 h-5 text-[#FF6600]" />
                </div>
              </div>
            )}

            {/* Price badge for paid content */}
            {isPaid && (
              <Badge className="absolute bottom-2 left-2 bg-[#FF6600] text-white text-xs">
                {item.price_xmr} XMR
              </Badge>
            )}

            {/* Free badge */}
            {!isPaid && (
              <Badge className="absolute bottom-2 left-2 bg-green-600 text-white text-xs">
                Free
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};
