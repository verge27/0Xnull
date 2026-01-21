import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye,
  Gamepad2,
  Trophy,
  TrendingUp,
  Zap,
  BookOpen,
  ExternalLink,
  Tag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { format } from 'date-fns';

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_name: string;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  published_at: string | null;
  views: number;
  market_id: string | null;
  meta_description: string | null;
}

interface LinkedMarket {
  id: string;
  question: string;
  status: string;
  total_yes_pool: number;
  total_no_pool: number;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; route: string }> = {
  esports: { icon: Gamepad2, label: 'Esports', color: 'text-purple-400', route: '/esports-predictions' },
  sports: { icon: Trophy, label: 'Sports', color: 'text-green-400', route: '/sports-predictions' },
  crypto: { icon: TrendingUp, label: 'Crypto', color: 'text-orange-400', route: '/predictions' },
  flash: { icon: Zap, label: 'Flash Markets', color: 'text-yellow-400', route: '/flash' },
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [linkedMarket, setLinkedMarket] = useState<LinkedMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO(post ? {
    title: `${post.title} | 0xNull Blog`,
    description: post.meta_description || post.excerpt || `Read ${post.title} on 0xNull Blog`,
    image: post.featured_image || undefined,
  } : undefined);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Post not found');
        return;
      }

      setPost(data);
      
      // Increment views
      await supabase.rpc('increment_blog_views', { post_id: data.id });

      // Fetch linked market if exists
      if (data.market_id) {
        const { data: market } = await supabase
          .from('prediction_markets')
          .select('id, question, status, total_yes_pool, total_no_pool')
          .eq('id', data.market_id)
          .single();
        
        if (market) {
          setLinkedMarket(market);
        }
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: string | null) => {
    if (!category || !CATEGORY_CONFIG[category]) {
      return { icon: BookOpen, label: 'General', color: 'text-muted-foreground', route: '/blog' };
    }
    return CATEGORY_CONFIG[category];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(post.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate('/blog')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link to={`/blog?category=${post.category}`}>
            <Badge variant="outline" className="flex items-center gap-1 hover:bg-primary/10">
              <CategoryIcon className={`w-3 h-3 ${categoryInfo.color}`} />
              {categoryInfo.label}
            </Badge>
          </Link>
          {post.subcategory && (
            <Badge variant="secondary">
              {post.subcategory.toUpperCase()}
            </Badge>
          )}
          {post.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="w-2 h-2 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author_name}
          </span>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(post.published_at), 'MMMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.views} views
          </span>
        </div>

        {/* Featured image */}
        {post.featured_image && (
          <div className="relative mb-8 rounded-lg overflow-hidden">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {/* Linked Market Card */}
        {linkedMarket && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Related Prediction Market
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium mb-2">{linkedMarket.question}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <Badge variant={linkedMarket.status === 'open' ? 'default' : 'secondary'}>
                    {linkedMarket.status}
                  </Badge>
                  <span className="ml-2">
                    Pool: {(linkedMarket.total_yes_pool + linkedMarket.total_no_pool).toFixed(4)} XMR
                  </span>
                </div>
                <Button size="sm" asChild>
                  <Link to={`/market/${linkedMarket.id}`}>
                    View Market
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <div 
          className="prose prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-pre:bg-muted/50"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Ready to make predictions?</h3>
                <p className="text-sm text-muted-foreground">
                  Explore {categoryInfo.label.toLowerCase()} markets and put your insights to work.
                </p>
              </div>
              <Button asChild>
                <Link to={categoryInfo.route}>
                  View {categoryInfo.label} Markets
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>

      <Footer />
    </div>
  );
}