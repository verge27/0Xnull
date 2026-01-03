import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEventSEO, generateOGImageUrl } from '@/hooks/useSEO';
import { Loader2, ArrowLeft, Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Helper to update OG image meta tag
function updateOGImage(url: string) {
  let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.content = url;
  
  let twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
  if (!twitterImage) {
    twitterImage = document.createElement('meta');
    twitterImage.name = 'twitter:image';
    document.head.appendChild(twitterImage);
  }
  twitterImage.content = url;
}

interface Market {
  id: string;
  question: string;
  description: string | null;
  resolution_date: string | null;
  status: string;
  total_yes_pool: number;
  total_no_pool: number;
  created_at: string;
  resolved_at: string | null;
}

const MarketDetail = () => {
  const { id } = useParams();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!id) {
        setError('Market ID not provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('prediction_markets')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setMarket(data);
      } catch (err) {
        console.error('Error fetching market:', err);
        setError('Market not found');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [id]);

  // Apply Event SEO schema
  useEventSEO(
    market ? {
      id: market.id,
      question: market.question,
      description: market.description || undefined,
      resolutionDate: market.resolution_date || undefined,
      status: market.status as 'open' | 'closed' | 'resolved',
      totalPool: market.total_yes_pool + market.total_no_pool,
      eventType: 'other',
    } : null,
    'Predictions'
  );

  // Apply dynamic OG image
  useEffect(() => {
    if (market) {
      const totalPool = market.total_yes_pool + market.total_no_pool;
      const ogImageUrl = generateOGImageUrl({
        title: market.question,
        subtitle: market.description || 'Anonymous prediction market on 0xNull',
        type: 'market',
        price: `${totalPool.toFixed(2)} XMR Pool`,
      });
      updateOGImage(ogImageUrl);
    }
  }, [market]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Market not found</h1>
          <p className="text-muted-foreground mb-6">This prediction market doesn't exist or has been removed.</p>
          <Link to="/predict">
            <Button>Browse Predictions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPool = market.total_yes_pool + market.total_no_pool;
  const yesPercentage = totalPool > 0 ? (market.total_yes_pool / totalPool) * 100 : 50;
  const noPercentage = totalPool > 0 ? (market.total_no_pool / totalPool) * 100 : 50;

  const getStatusBadge = () => {
    switch (market.status) {
      case 'open':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Open</Badge>;
      case 'closed':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Closed</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Resolved</Badge>;
      default:
        return <Badge variant="outline">{market.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link to="/predict" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Predictions
        </Link>

        {/* Market Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-2xl leading-tight">{market.question}</CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {market.description && (
              <p className="text-muted-foreground mb-6">{market.description}</p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-muted-foreground">Total Pool</div>
                  <div className="font-semibold">{totalPool.toFixed(4)} XMR</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-semibold capitalize">{market.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-semibold">{format(new Date(market.created_at), 'MMM d, yyyy')}</div>
                </div>
              </div>
              {market.resolution_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-muted-foreground">Resolves</div>
                    <div className="font-semibold">{format(new Date(market.resolution_date), 'MMM d, yyyy')}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Odds Display */}
            <div className="space-y-4">
              <h3 className="font-semibold">Current Odds</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{yesPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">YES</div>
                    <div className="text-xs text-muted-foreground mt-1">{market.total_yes_pool.toFixed(4)} XMR</div>
                  </CardContent>
                </Card>
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{noPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">NO</div>
                    <div className="text-xs text-muted-foreground mt-1">{market.total_no_pool.toFixed(4)} XMR</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA */}
            {market.status === 'open' && (
              <div className="mt-6 flex gap-3">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Bet YES
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700">
                  Bet NO
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• This is a parimutuel betting pool where all bets go into a shared pool</li>
              <li>• Odds are determined by the ratio of money on each side</li>
              <li>• Winners split the total pool proportionally to their stake</li>
              <li>• 0xNull takes only a 0.4% fee on winnings</li>
            </ul>
            <Link to="/how-betting-works" className="text-primary text-sm hover:underline mt-4 inline-block">
              Learn more about parimutuel betting →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketDetail;
