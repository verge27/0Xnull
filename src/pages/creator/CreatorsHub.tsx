import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { creatorApi, CreatorProfile } from '@/services/creatorApi';
import { truncateKey } from '@/lib/creatorCrypto';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const LIMIT = 20;

const CreatorsHub = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCreators = useCallback(async (currentOffset: number, append = false) => {
    try {
      const { creators: newCreators, total: totalCount } = await creatorApi.browseCreators(LIMIT, currentOffset);
      setCreators(prev => append ? [...prev, ...newCreators] : newCreators);
      setTotal(totalCount);
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchCreators(0);
      setIsLoading(false);
    };
    init();
  }, [fetchCreators]);

  const handleLoadMore = async () => {
    const newOffset = offset + LIMIT;
    setIsLoadingMore(true);
    setOffset(newOffset);
    await fetchCreators(newOffset, true);
    setIsLoadingMore(false);
  };

  const hasMore = creators.length < total;

  const filteredCreators = creators.filter(
    (creator) =>
      creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#FF6600]">0x</span>Null Creators
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            A privacy-first creator platform. No email, no password, no KYC.
            Just cryptographic identity and Monero payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/creator/register')}
              className="bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Become a Creator
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/creator/login')}
              size="lg"
            >
              Creator Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Creators Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No creators found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Be the first to join!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCreators.map((creator) => (
                <Card
                  key={creator.id}
                  className="overflow-hidden cursor-pointer hover:border-[#FF6600]/50 transition-colors group"
                  onClick={() => navigate(`/creator/${creator.id}`)}
                >
                  {/* Banner */}
                  <div className="h-24 bg-gradient-to-br from-[#FF6600]/20 to-[#FF6600]/5 relative">
                    {creator.banner_url && (
                      <img
                        src={creatorApi.getMediaUrl(creator.banner_url)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Avatar */}
                    <div className="absolute -bottom-8 left-4">
                      <div className="w-16 h-16 rounded-full bg-background border-4 border-background overflow-hidden">
                        {creator.avatar_url ? (
                          <img
                            src={creatorApi.getMediaUrl(creator.avatar_url)}
                            alt={creator.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#FF6600]/20 flex items-center justify-center text-xl font-bold text-[#FF6600]">
                            {creator.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-10 pb-4">
                    <h3 className="font-semibold group-hover:text-[#FF6600] transition-colors">
                      {creator.display_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncateKey(creator.pubkey, 6, 6)}
                    </p>
                    {creator.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {creator.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{creator.content_count} content</span>
                      <span>{creator.subscriber_count} subscribers</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CreatorsHub;