import { useNavigate } from 'react-router-dom';
import { Lock, Play, Eye, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem, creatorApi } from '@/services/creatorApi';

interface MediaGridProps {
  content: ContentItem[];
  isSubscribed?: boolean;
}

export const MediaGrid = ({ content, isSubscribed = false }: MediaGridProps) => {
  const navigate = useNavigate();

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
        const isVideo = item.media_hash?.match(/\.(mp4|webm|mov)$/i);

        return (
          <div
            key={item.id}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm"
            onClick={() => navigate(`/content/${item.id}`)}
          >
            {/* Thumbnail */}
            <img
              src={item.thumbnail_url ? creatorApi.getMediaUrl(item.thumbnail_url) : '/placeholder.svg'}
              alt={item.title || 'Content'}
              className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                isLocked ? 'blur-sm' : ''
              }`}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {item.view_count || 0}
                </span>
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
