import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecentBet {
  id: string;
  side: 'YES' | 'NO';
  amount: number;
  market_title: string;
  timestamp: string;
}

interface RecentBetsTickerProps {
  className?: string;
}

export function RecentBetsTicker({ className }: RecentBetsTickerProps) {
  const [bets, setBets] = useState<RecentBet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRecentBets = async () => {
    try {
      const { data, error } = await supabase
        .from('market_positions')
        .select(`
          id,
          side,
          amount,
          created_at,
          prediction_markets (
            question
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedBets: RecentBet[] = (data || []).map((bet: any) => ({
        id: bet.id,
        side: bet.side.toUpperCase() as 'YES' | 'NO',
        amount: bet.amount,
        market_title: bet.prediction_markets?.question || 'Unknown market',
        timestamp: bet.created_at,
      }));

      setBets(formattedBets);
    } catch (error) {
      console.error('Error fetching recent bets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentBets();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('recent-bets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_positions'
        },
        () => {
          fetchRecentBets();
        }
      )
      .subscribe();

    // Rotate through bets every 4 seconds
    const rotateInterval = setInterval(() => {
      setCurrentIndex(prev => (bets.length > 0 ? (prev + 1) % bets.length : 0));
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(rotateInterval);
    };
  }, [bets.length]);

  if (loading || bets.length === 0) return null;

  const currentBet = bets[currentIndex];
  if (!currentBet) return null;

  const timeAgo = Math.floor((Date.now() - new Date(currentBet.timestamp).getTime()) / 60000);
  const timeString = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;

  // Truncate market title for display
  const displayTitle = currentBet.market_title.length > 30 
    ? currentBet.market_title.substring(0, 30) + '...' 
    : currentBet.market_title;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-card/60 rounded-lg border border-border/50 text-xs ${className}`}>
      <Zap className="w-3 h-3 text-yellow-500 animate-pulse shrink-0" />
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="text-muted-foreground">Someone bet</span>
        <Badge 
          variant="outline" 
          className={`shrink-0 ${
            currentBet.side === 'YES' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {currentBet.side === 'YES' ? (
            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
          )}
          {currentBet.amount.toFixed(2)} XMR
        </Badge>
        <span className="text-muted-foreground truncate">on {displayTitle}</span>
        <span className="text-muted-foreground/60 shrink-0">• {timeString}</span>
      </div>
    </div>
  );
}
