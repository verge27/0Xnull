import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Eye, 
  ArrowRight,
  Gamepad2,
  Trophy,
  TrendingUp,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  published_at: string | null;
  views: number;
  market_id: string | null;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  esports: { icon: Gamepad2, label: 'Esports', color: 'text-purple-400' },
  sports: { icon: Trophy, label: 'Sports', color: 'text-green-400' },
  crypto: { icon: TrendingUp, label: 'Crypto', color: 'text-orange-400' },
  flash: { icon: Zap, label: 'Flash Markets', color: 'text-yellow-400' },
};

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  useSEO({
    title: 'Blog | 0xNull - Prediction Market Insights & Analysis',
    description: 'Expert analysis, betting strategies, and insights for esports, sports, and crypto prediction markets. Stay informed with the latest from 0xNull.',
  });

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, featured_image, author_name, category, subcategory, tags, published_at, views, market_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const getCategoryInfo = (category: string | null) => {
    if (!category || !CATEGORY_CONFIG[category]) {
      return { icon: BookOpen, label: 'General', color: 'text-muted-foreground' };
    }
    return CATEGORY_CONFIG[category];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              0xNull Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Prediction Market Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Expert analysis, betting strategies, and the latest news from esports, sports, and crypto markets.
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto px-4 pb-8">
        <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="esports" className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" />
              <span className="hidden sm:inline">Esports</span>
            </TabsTrigger>
            <TabsTrigger value="sports" className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span className="hidden sm:inline">Sports</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="flash" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Flash</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {activeCategory === 'all' 
                    ? 'Check back soon for the latest insights and analysis.'
                    : `No ${CATEGORY_CONFIG[activeCategory]?.label || activeCategory} posts available yet.`}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const categoryInfo = getCategoryInfo(post.category);
                  const CategoryIcon = categoryInfo.icon;
                  
                  return (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors group">
                        {post.featured_image ? (
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={post.featured_image} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {post.market_id && (
                              <Badge className="absolute top-2 right-2 bg-primary/90">
                                Linked Market
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <CategoryIcon className={`w-16 h-16 ${categoryInfo.color} opacity-50`} />
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CategoryIcon className={`w-3 h-3 ${categoryInfo.color}`} />
                              {categoryInfo.label}
                            </Badge>
                            {post.subcategory && (
                              <Badge variant="secondary" className="text-xs">
                                {post.subcategory.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          
                          <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                          
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.author_name}
                              </span>
                              {post.published_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(post.published_at), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to start predicting?</h2>
            <p className="text-muted-foreground mb-6">
              Put your insights to work with our prediction markets.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/esports-predictions">
                  Esports Markets
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/sports-predictions">
                  Sports Markets
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/predictions">
                  Crypto Markets
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}