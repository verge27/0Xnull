import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Loader2, 
  Grid3X3, 
  LayoutList,
  Crown,
  MessageCircle,
  Share2,
  Check,
  Users,
  ArrowLeft,
  Bot,
  Mic
} from 'lucide-react';

// Safe date formatting helper
const formatJoinDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  } catch {
    return 'Unknown';
  }
};
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { creatorApi, CreatorProfile as CreatorProfileType, ContentItem } from '@/services/creatorApi';
import { truncateKey } from '@/lib/creatorCrypto';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ContentFeedItem } from '@/components/creator/ContentFeedItem';
import { MediaGrid } from '@/components/creator/MediaGrid';
import { SubscriptionCard } from '@/components/creator/SubscriptionCard';
import { TipModal } from '@/components/creator/TipModal';
import { CreatorDMPanel } from '@/components/creator/CreatorDMPanel';
import { CreatorChatTab } from '@/components/creator/CreatorChatTab';
import { CreatorVoiceTab } from '@/components/creator/CreatorVoiceTab';
import { BundlesSection } from '@/components/creator/BundlesSection';
import { CampaignsSection } from '@/components/creator/CampaignsSection';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { toast } from 'sonner';

// Helper to update document meta tags for creator profiles
const updateCreatorMeta = (profile: CreatorProfileType | null) => {
  if (!profile) return;
  
  const title = `${profile.display_name} - 0xNull Creators`;
  const description = profile.bio || `Check out ${profile.display_name} on 0xNull Creators. ${profile.content_count} posts, ${profile.subscriber_count} subscribers.`;
  const url = `https://0xnull.io/creator/${profile.id}`;
  const image = profile.avatar_url 
    ? creatorApi.getMediaUrl(profile.avatar_url) 
    : 'https://0xnull.io/og-image.png';

  // Update document title
  document.title = title;

  // Helper to set or create meta tag
  const setMeta = (property: string, content: string, isName = false) => {
    const attr = isName ? 'name' : 'property';
    let tag = document.querySelector(`meta[${attr}="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // Update meta tags
  setMeta('description', description, true);
  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:url', url);
  setMeta('og:image', image);
  setMeta('og:type', 'profile');
  setMeta('og:site_name', '0xNull Creators');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', image);
};

const CreatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creator: loggedInCreator } = useCreatorAuth();
  
  const [profile, setProfile] = useState<CreatorProfileType | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  
  // Check if current user is viewing their own profile
  const isOwner = loggedInCreator?.id === id;

  // Refetch profile and content
  const fetchProfile = useCallback(async () => {
    if (!id) return;
    
    try {
      const profileData = await creatorApi.getCreatorProfile(id);
      setProfile(profileData);
      
      // Update page SEO/meta tags with creator info
      updateCreatorMeta(profileData);
      
      // Use embedded content from profile response if available
      if (profileData.content && profileData.content.length > 0) {
        // Sort by newest first
        const sorted = [...profileData.content].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setContent(sorted);
      } else {
        // Fallback: fetch via search if profile didn't include content
        try {
          const contentData = await creatorApi.searchContent({ 
            q: '', 
            page: 1, 
            limit: 50 
          });
          // Filter content by creator and sort by newest first
          const creatorContent = contentData.content
            .filter(c => c.creator_id === id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setContent(creatorContent);
        } catch {
          setContent([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Creator not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refetch on window focus (for when returning from upload page)
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading && profile) {
        fetchProfile();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProfile, isLoading, profile]);

  const freeContent = content.filter(c => c.tier === 'free');
  const paidContent = content.filter(c => c.tier === 'paid');
  
  // Handle content deletion
  const handleDeleteContent = useCallback((contentId: string) => {
    setContent(prev => prev.filter(c => c.id !== contentId));
  }, []);

  const handleShare = async () => {
    const url = window.location.href;

    // Prefer native share when available, but ALWAYS fallback to clipboard if share is denied.
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.display_name || 'Creator',
          url,
        });
        return;
      }
    } catch (err) {
      // Some environments throw NotAllowedError even though share() exists.
      console.warn('[CreatorProfile] navigator.share failed, falling back to clipboard', err);
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[CreatorProfile] copy failed:', err);
      toast.error('Could not copy link. Please copy from the address bar.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/creators')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Creators
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Browse link */}
        <div className="container mx-auto px-4 pt-4">
          <Link 
            to="/creators" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="w-4 h-4" />
            Browse Creators
          </Link>
        </div>

        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-[#FF6600]/30 to-[#FF6600]/5 relative mt-2">
          {profile.banner_url && (
            <img
              src={creatorApi.getMediaUrl(profile.banner_url)}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="relative -mt-16 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Avatar */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-background border-4 border-background overflow-hidden shrink-0 ring-4 ring-[#FF6600]/20">
                {profile.avatar_url ? (
                  <img
                    src={creatorApi.getMediaUrl(profile.avatar_url)}
                    alt={profile.display_name || 'Creator'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FF6600]/20 flex items-center justify-center text-4xl font-bold text-[#FF6600]">
                    {(profile.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-0 sm:pt-16">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name || 'Unknown'}</h1>
                    <p className="text-sm text-muted-foreground font-mono">
                      {truncateKey(profile.pubkey, 8, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TipModal creator={profile} />
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </Button>
                    <Sheet open={isDMOpen} onOpenChange={setIsDMOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="p-0 w-full sm:max-w-md">
                        <CreatorDMPanel 
                          creator={profile} 
                          isSubscribed={isSubscribed}
                          onClose={() => setIsDMOpen(false)}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground mt-3 max-w-xl">{profile.bio}</p>
                )}
                
                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-xl font-bold">{profile.content_count ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{profile.subscriber_count ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Subscribers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{freeContent.length}</p>
                    <p className="text-xs text-muted-foreground">Free</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{paidContent.length}</p>
                    <p className="text-xs text-muted-foreground">Exclusive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
            {/* Left sidebar - Subscription (mobile: top) */}
            <div className="lg:order-2 space-y-4">
              <SubscriptionCard 
                creator={profile} 
                isSubscribed={isSubscribed}
                subscriptionPrice={0.02}
                onSubscribe={() => setIsSubscribed(true)}
              />
              
              {/* Quick stats card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    About
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Posts</span>
                      <span>{content.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free Content</span>
                      <span>{freeContent.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid Content</span>
                      <span>{paidContent.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bundles Section */}
              <BundlesSection 
                creator={profile} 
                content={content}
              />

              {/* Campaigns Section */}
              <CampaignsSection creatorId={profile.id} />
            </div>

            {/* Main content - Timeline */}
            <div className="lg:col-span-2 lg:order-1">
              <Tabs defaultValue="posts" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="free">Free</TabsTrigger>
                    <TabsTrigger value="paid">
                      <Lock className="w-3 h-3 mr-1" />
                      Paid
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                      <Bot className="w-3 h-3 mr-1" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="voice">
                      <Mic className="w-3 h-3 mr-1" />
                      Voice
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* View toggle */}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'feed' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('feed')}
                    >
                      <LayoutList className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* All Posts */}
                <TabsContent value="posts" className="mt-0">
                  {content.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No posts yet</p>
                      </CardContent>
                    </Card>
                  ) : viewMode === 'feed' ? (
                    <div className="space-y-4">
                      {content.map((item) => (
                        <ContentFeedItem 
                          key={item.id} 
                          content={item} 
                          creator={profile}
                          isSubscribed={isSubscribed}
                          isOwner={isOwner}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  ) : (
                    <MediaGrid content={content} isSubscribed={isSubscribed} creatorId={profile.id} />
                  )}
                </TabsContent>

                {/* Media only */}
                <TabsContent value="media" className="mt-0">
                  <MediaGrid content={content} isSubscribed={isSubscribed} creatorId={profile.id} />
                </TabsContent>

                {/* Free content */}
                <TabsContent value="free" className="mt-0">
                  {freeContent.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No free content yet</p>
                      </CardContent>
                    </Card>
                  ) : viewMode === 'feed' ? (
                    <div className="space-y-4">
                      {freeContent.map((item) => (
                        <ContentFeedItem 
                          key={item.id} 
                          content={item} 
                          creator={profile}
                          isSubscribed={true}
                          isOwner={isOwner}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  ) : (
                    <MediaGrid content={freeContent} isSubscribed={true} creatorId={profile.id} />
                  )}
                </TabsContent>

                {/* Paid content */}
                <TabsContent value="paid" className="mt-0">
                  {paidContent.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Crown className="w-12 h-12 mx-auto mb-4 text-[#FF6600]/50" />
                        <p className="text-muted-foreground">No exclusive content yet</p>
                      </CardContent>
                    </Card>
                  ) : viewMode === 'feed' ? (
                    <div className="space-y-4">
                      {paidContent.map((item) => (
                        <ContentFeedItem 
                          key={item.id} 
                          content={item} 
                          creator={profile}
                          isSubscribed={isSubscribed}
                          isOwner={isOwner}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  ) : (
                    <MediaGrid content={paidContent} isSubscribed={isSubscribed} creatorId={profile.id} />
                  )}
                </TabsContent>

                {/* AI Chat Tab */}
                <TabsContent value="chat" className="mt-0">
                  <CreatorChatTab creator={profile} />
                </TabsContent>

                {/* Voice Tab */}
                <TabsContent value="voice" className="mt-0">
                  <CreatorVoiceTab creator={profile} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorProfile;
