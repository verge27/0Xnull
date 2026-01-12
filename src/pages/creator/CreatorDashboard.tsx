import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Unlock, Coins, Settings, LogOut, 
  MoreVertical, Pencil, Trash2, Loader2, Image as ImageIcon,
  Upload, ExternalLink, Share2, Check, Copy, Play, Film,
  FileText, Pin, PinOff
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { usePinnedPosts } from '@/hooks/usePinnedPosts';
import { creatorApi, ContentItem } from '@/services/creatorApi';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import CreatorUploadModal from '@/components/creator/CreatorUploadModal';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { creator, isLoading: authLoading, isAuthenticated, logout, truncateKey, refreshProfile } = useCreatorAuth();
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Pinned posts management
  const { togglePin, isPinned, sortWithPinned, markPinned, pinnedCount } = usePinnedPosts(creator?.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/creator/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      if (!isAuthenticated) return;
      
      try {
        const { content } = await creatorApi.getMyContent();
        setContent(content);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setLoadError('Failed to load your content. You may not be fully authenticated yet.');
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/creators');
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      await creatorApi.deleteContent(contentId);
      setContent(prev => prev.filter(c => c.id !== contentId));
      console.log('[CreatorDashboard] Content deleted:', contentId);
      setLoadError(null);
      refreshProfile();
    } catch (error) {
      console.error('Failed to delete content:', error);
      setLoadError('Failed to delete content.');
    }
  };

  const handleUploadSuccess = (newContent: ContentItem) => {
    setContent(prev => [newContent, ...prev]);
    refreshProfile();
  };

  if (authLoading || !creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{creator.displayName || 'Unknown'}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {truncateKey(creator.publicKey, 8, 8)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`/creator/${creator.id}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">View Page</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                const url = `${window.location.origin}/creator/${creator.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success('Profile URL copied to clipboard!');
                } catch {
                  toast.error('Failed to copy link');
                }
              }}
            >
              <Share2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/creator/settings')}>
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {loadError}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mb-8 border-[#FF6600]/30 bg-gradient-to-r from-[#FF6600]/5 to-transparent">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FF6600]/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#FF6600]" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload New Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Share photos or videos with your audience
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/creator/upload')}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats - calculate from content if API stats are 0 */}
        {(() => {
          const earnings = creator.stats?.total_earnings_xmr ?? 0;
          // If API stats are 0, calculate from content items
          const calculatedViews = content.reduce((sum, item) => sum + (item.view_count ?? 0), 0);
          const calculatedUnlocks = content.reduce((sum, item) => sum + (item.unlock_count ?? 0), 0);
          const calculatedEarnings = content.reduce((sum, item) => sum + (item.earnings_xmr ?? 0), 0);
          
          const views = (creator.stats?.total_views ?? 0) || calculatedViews;
          const unlocks = (creator.stats?.total_unlocks ?? 0) || calculatedUnlocks;
          const displayEarnings = earnings || calculatedEarnings;

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-[#FF6600]/20 bg-[#FF6600]/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#FF6600]" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#FF6600]">
                    {displayEarnings.toFixed(4)} XMR
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{views.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Unlock className="w-4 h-4" />
                    Total Unlocks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{unlocks.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          );
        })()}


        {/* Content Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Content</h2>
        </div>

        {isLoadingContent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : content.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No content yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first content to start earning
              </p>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-[#FF6600] hover:bg-[#FF6600]/90">
                <Plus className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortWithPinned(content).map((item) => {
              const priceXmr = item.price_xmr ?? 0;
              const viewCount = item.view_count ?? 0;
              const unlockCount = item.unlock_count ?? 0;
              const earningsXmr = item.earnings_xmr ?? 0;
              const isVideo = item.media_type?.startsWith('video/') || 
                             item.media_hash?.includes('.mp4') ||
                             item.media_hash?.includes('.webm');
              const isTextPost = item.post_type === 'text' || item.media_type === 'text/post';
              const itemIsPinned = isPinned(item.id);
              
              // Determine thumbnail/preview URL
              const thumbnailSrc = item.thumbnail_url 
                ? creatorApi.getMediaUrl(item.thumbnail_url)
                : item.media_hash && !isTextPost
                  ? creatorApi.getMediaUrl(item.media_hash)
                  : null;

              return (
              <Card 
                key={item.id} 
                className={`overflow-hidden group ${itemIsPinned ? 'ring-2 ring-[#FF6600]/50 bg-[#FF6600]/5' : ''}`}
              >
                <div className="relative aspect-video bg-muted">
                  {isTextPost ? (
                    // Text post preview
                    <div className="w-full h-full p-4 flex flex-col justify-center bg-gradient-to-br from-muted to-muted/50">
                      <FileText className="w-8 h-8 text-muted-foreground mb-2 mx-auto" />
                      <p className="text-sm text-center text-muted-foreground line-clamp-3">
                        {item.description || item.title || 'Text Post'}
                      </p>
                    </div>
                  ) : isVideo ? (
                    // For videos, show clickable play overlay
                    <div 
                      className="relative w-full h-full cursor-pointer group/video"
                      onClick={(e) => {
                        e.stopPropagation();
                        const videoEl = e.currentTarget.querySelector('video');
                        if (videoEl) {
                          if (videoEl.paused) {
                            videoEl.play().catch(() => {});
                            e.currentTarget.querySelector('.play-overlay')?.classList.add('opacity-0');
                          } else {
                            videoEl.pause();
                            e.currentTarget.querySelector('.play-overlay')?.classList.remove('opacity-0');
                          }
                        }
                      }}
                    >
                      <video
                        src={creatorApi.getMediaUrl(item.media_hash || '')}
                        poster={item.thumbnail_url ? creatorApi.getMediaUrl(item.thumbnail_url) : undefined}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onEnded={(e) => {
                          e.currentTarget.parentElement?.querySelector('.play-overlay')?.classList.remove('opacity-0');
                        }}
                      />
                      <div className="play-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover/video:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 left-2 bg-black/60 text-white">
                        <Film className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    </div>
                  ) : thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={item.title || 'Content'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Pinned badge */}
                  {itemIsPinned && (
                    <Badge className="absolute top-2 left-2 bg-[#FF6600] text-white gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </Badge>
                  )}
                  
                  {/* Price/Free badge */}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      item.tier === 'paid' 
                        ? 'bg-[#FF6600] text-white' 
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {item.tier === 'paid' ? `${priceXmr} XMR` : 'Free'}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 
                        className="font-medium truncate hover:text-[#FF6600] transition-colors cursor-pointer"
                        title={item.title || 'Untitled'}
                        onClick={() => navigate(`/content/${item.id}`)}
                      >
                        {item.title || 'Untitled'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {viewCount}
                        </span>
                        {item.tier === 'paid' && (
                          <span className="flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> {unlockCount}
                          </span>
                        )}
                        {item.tier === 'paid' && (
                          <span className="flex items-center gap-1 text-[#FF6600]">
                            <Coins className="w-3 h-3" /> {earningsXmr.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                          toast.success(itemIsPinned ? 'Post unpinned' : 'Post pinned to top');
                        }}>
                          {itemIsPinned ? (
                            <>
                              <PinOff className="w-4 h-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 mr-2" />
                              Pin to Top {pinnedCount >= 3 && '(will unpin oldest)'}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/content/${item.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Edit feature coming soon');
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this content?')) {
                              await handleDeleteContent(item.id);
                              toast.success('Content deleted');
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <CreatorUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default CreatorDashboard;
