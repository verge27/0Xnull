import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Lock, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { creatorApi, ContentItem } from '@/services/creatorApi';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const ContentSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tier, setTier] = useState<string>(searchParams.get('tier') || 'all');
  const [tags, setTags] = useState<string>(searchParams.get('tags') || '');

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await creatorApi.searchContent({
        q: query,
        tier: tier === 'all' ? undefined : tier as 'free' | 'paid',
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        limit: 24,
      });
      setContent(result.content);
      setTotal(result.total);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, tier, tags]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tier && tier !== 'all') params.set('tier', tier);
    if (tags) params.set('tags', tags);
    setSearchParams(params);
    fetchContent();
  };

  const clearFilters = () => {
    setQuery('');
    setTier('all');
    setTags('');
    setSearchParams({});
  };

  const hasFilters = query || tier !== 'all' || tags;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Content</h1>
          <p className="text-muted-foreground">
            Discover content from creators on 0xNull
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="pl-10"
              />
            </div>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full sm:w-48"
            />
            <Button type="submit" className="bg-[#FF6600] hover:bg-[#FF6600]/90">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
          
          {hasFilters && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">
                {total} results found
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto py-1"
              >
                <X className="w-3 h-3 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No content found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                        item.tier === 'paid' ? 'blur-md' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {item.tier === 'paid' && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-5 h-5 mx-auto mb-1 text-[#FF6600]" />
                        <Badge className="bg-[#FF6600] text-white text-xs">
                          {item.price_xmr} XMR
                        </Badge>
                      </div>
                    </div>
                  )}

                  {item.tier === 'free' && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
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
      </main>
      <Footer />
    </div>
  );
};

export default ContentSearch;
