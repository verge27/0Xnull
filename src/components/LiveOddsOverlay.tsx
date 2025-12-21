import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import type { PredictionMarket } from '@/services/api';

interface LiveOddsOverlayProps {
  market: PredictionMarket | null;
  teamA?: string;
  teamB?: string;
  tournamentName?: string;
  onQuickBet?: (side: 'YES' | 'NO') => void;
}

export function LiveOddsOverlay({ 
  market, 
  teamA = 'Team A',
  teamB = 'Team B',
  tournamentName,
  onQuickBet 
}: LiveOddsOverlayProps) {
  const { xmrUsdRate } = useExchangeRate();

  if (!market) return null;

  const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
  const yesPercent = totalPool > 0 ? (market.yes_pool_xmr / totalPool) * 100 : 50;
  const noPercent = totalPool > 0 ? (market.no_pool_xmr / totalPool) * 100 : 50;
  
  // Calculate implied odds (multiplier)
  const yesMultiplier = totalPool > 0 && market.yes_pool_xmr > 0 
    ? (totalPool / market.yes_pool_xmr).toFixed(2) 
    : '2.00';
  const noMultiplier = totalPool > 0 && market.no_pool_xmr > 0 
    ? (totalPool / market.no_pool_xmr).toFixed(2) 
    : '2.00';

  const poolUsd = xmrUsdRate ? totalPool * xmrUsdRate : 0;

  // Time until resolution
  const getCountdown = () => {
    const now = Date.now() / 1000;
    const diff = market.resolution_time - now;
    
    if (diff <= 0) return 'Resolving...';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-primary/30 p-3 space-y-3">
      {/* Tournament / Match Context */}
      {tournamentName && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="truncate">{tournamentName}</span>
        </div>
      )}

      {/* Pool sizes and odds bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-medium">
            YES {yesPercent.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">
            Pool: {totalPool.toFixed(2)} XMR {poolUsd > 0 && `($${poolUsd.toFixed(0)})`}
          </span>
          <span className="text-red-400 font-medium">
            NO {noPercent.toFixed(0)}%
          </span>
        </div>
        
        {/* Visual odds bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${noPercent}%` }}
          />
        </div>

        {/* Multipliers */}
        <div className="flex items-center justify-between text-xs">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            {yesMultiplier}x
          </Badge>
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
            <TrendingDown className="w-3 h-3 mr-1" />
            {noMultiplier}x
          </Badge>
        </div>
      </div>

      {/* Quick bet buttons */}
      {onQuickBet && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
            onClick={() => onQuickBet('YES')}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Bet YES
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
            onClick={() => onQuickBet('NO')}
          >
            <TrendingDown className="w-3 h-3 mr-1" />
            Bet NO
          </Button>
        </div>
      )}

      {/* Resolution countdown */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Market closes in {getCountdown()}</span>
      </div>
    </Card>
  );
}
