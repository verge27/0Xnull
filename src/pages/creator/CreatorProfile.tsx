import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { creatorApi, CreatorProfile as CreatorProfileType, ContentItem } from '@/services/creatorApi';
import { truncateKey } from '@/lib/creatorCrypto';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const CreatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<CreatorProfileType | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      try {
        const profileData = await creatorApi.getCreatorProfile(id);
        setProfile(profileData);
        
        // Content is included in the profile response or we need to fetch separately
        // For now, search with creator filter
        try {
          const contentData = await creatorApi.searchContent({ 
            q: '', 
            page: 1, 
            limit: 50 
          });
          // Filter content by creator
          setContent(contentData.content.filter(c => c.creator_id === id));
        } catch {
          // Content fetch failed, show empty
          setContent([]);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Creator not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

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
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-[#FF6600]/30 to-[#FF6600]/5 relative">
          {profile.banner_url && (
            <img
              src={creatorApi.getMediaUrl(profile.banner_url)}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="relative -mt-16 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-background border-4 border-background overflow-hidden shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={creatorApi.getMediaUrl(profile.avatar_url)}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FF6600]/20 flex items-center justify-center text-4xl font-bold text-[#FF6600]">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="pt-4 sm:pt-16">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {truncateKey(profile.pubkey, 8, 8)}
                </p>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>
                )}
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">{profile.content_count}</strong> content</span>
                  <span><strong className="text-foreground">{profile.subscriber_count}</strong> subscribers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="pb-12">
            <h2 className="text-lg font-semibold mb-4">Content</h2>
            
            {content.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No content yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {content.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer group"
                    onClick={() => navigate(`/content/${item.id}`)}
                  >
                    <div className="relative aspect-square bg-muted">
                      {item.thumbnail_url ? (
                        <img
                          src={creatorApi.getMediaUrl(item.thumbnail_url)}
                          alt={item.title}
                          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                            item.tier === 'paid' ? 'blur-lg' : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Paid overlay */}
                      {item.tier === 'paid' && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="w-6 h-6 mx-auto mb-1 text-[#FF6600]" />
                            <Badge className="bg-[#FF6600] text-white">
                              {item.price_xmr} XMR
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Free badge */}
                      {item.tier === 'free' && (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                          Free
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-sm font-medium truncate group-hover:text-[#FF6600] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {item.view_count}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorProfile;
