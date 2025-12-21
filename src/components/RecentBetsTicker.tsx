import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface RecentBet {
  id: string;
  side: 'YES' | 'NO';
  amount_xmr: number;
  market_title: string;
  timestamp: number;
}

// Mock data generator for social proof (in production, this would come from API)
const generateMockBets = (): RecentBet[] => {
  const sides: ('YES' | 'NO')[] = ['YES', 'NO'];
  const amounts = [0.1, 0.25, 0.5, 1, 2, 5];
  const markets = [
    'Team Spirit wins',
    'Gen.G wins',
    'NIP wins',
    'Paper Rex wins',
  ];
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: `mock-${i}-${Date.now()}`,
    side: sides[Math.floor(Math.random() * sides.length)],
    amount_xmr: amounts[Math.floor(Math.random() * amounts.length)],
    market_title: markets[Math.floor(Math.random() * markets.length)],
    timestamp: Date.now() - Math.random() * 60000 * 10, // Random time in last 10 mins
  }));
};

interface RecentBetsTickerProps {
  className?: string;
}

export function RecentBetsTicker({ className }: RecentBetsTickerProps) {
  const [bets, setBets] = useState<RecentBet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize with mock data
  useEffect(() => {
    setBets(generateMockBets());
    
    // Rotate through bets every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % 5);
    }, 4000);

    // Refresh mock data periodically
    const refreshInterval = setInterval(() => {
      setBets(generateMockBets());
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, []);

  if (bets.length === 0) return null;

  const currentBet = bets[currentIndex];
  if (!currentBet) return null;

  const timeAgo = Math.floor((Date.now() - currentBet.timestamp) / 60000);
  const timeString = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;

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
          {currentBet.amount_xmr} XMR
        </Badge>
        <span className="text-muted-foreground truncate">on {currentBet.market_title}</span>
        <span className="text-muted-foreground/60 shrink-0">• {timeString}</span>
      </div>
    </div>
  );
}
