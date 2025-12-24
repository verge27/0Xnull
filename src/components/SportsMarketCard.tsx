import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/TeamLogo';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { BettingCountdown, isBettingOpen } from '@/components/BettingCountdown';
import { getMarketStatus, type SportsScore, type MarketStatus } from '@/hooks/useMarketStatus';
import { Clock, TrendingUp, Zap, Users, Lock, Radio } from 'lucide-react';
import type { PredictionMarket } from '@/services/api';
import { extractSportInfo, parseMatchupFromTitle } from '@/lib/sportLabels';

interface SportsMarketCardProps {
  market: PredictionMarket;
  onBetClick: (market: PredictionMarket, side: 'yes' | 'no') => void;
  onAddToSlip?: (marketId: string, title: string, side: 'YES' | 'NO', amount: number, yesPool: number, noPool: number, bettingClosesAt?: number) => void;
  onOpenSlip?: () => void;
  isLive?: boolean;
  isClosingSoon?: boolean;
  /** If true, we detected live score data for this match - force-close betting UI */
  hasLiveScoreData?: boolean;
  /** Live score data from Sports API for enhanced status detection */
  liveScoreData?: SportsScore | null;
}

export function SportsMarketCard({ 
  market, 
  onBetClick, 
  onAddToSlip,
  onOpenSlip,
  isLive = false,
  isClosingSoon = false,
  hasLiveScoreData = false,
  liveScoreData = null
}: SportsMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use the centralized market status detection with all 3 layers
  const marketStatus: MarketStatus = useMemo(() => {
    return getMarketStatus(market, liveScoreData, null);
  }, [market, liveScoreData]);
  
  // Combine old detection with new - bettingClosed is true if any layer says so
  const [bettingClosed, setBettingClosed] = useState(marketStatus.isClosed || hasLiveScoreData);
  
  // Update betting closed state when market data changes OR when live score data is detected
  useEffect(() => {
    setBettingClosed(marketStatus.isClosed || hasLiveScoreData);
  }, [marketStatus.isClosed, hasLiveScoreData]);
  
  const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
  const yesPercent = totalPool > 0 ? Math.round((market.yes_pool_xmr / totalPool) * 100) : 50;
  const noPercent = 100 - yesPercent;
  
  // Parse team names and sport info from market
  const { teamA, teamB } = parseMatchupFromTitle(market.title);
  const sportInfo = extractSportInfo(market.market_id);

  // Determine sport from oracle_asset or market_id
  const getSport = () => {
    if (market.oracle_asset) return market.oracle_asset;
    return sportInfo.sport || 'soccer';
  };

  const handleBettingClosed = () => {
    setBettingClosed(true);
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 bg-card/90 backdrop-blur-sm border-border/50 ${
        isHovered ? 'border-primary/50 shadow-lg shadow-primary/10' : ''
      } ${isLive ? 'ring-2 ring-red-500/50' : ''} ${bettingClosed ? 'opacity-80' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status badges */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {bettingClosed && !isLive && marketStatus.reason !== 'live_scores' && (
          <Badge className="bg-zinc-700 text-zinc-300">
            <Lock className="w-3 h-3 mr-1" />
            CLOSED
          </Badge>
        )}
        {(isLive || marketStatus.reason === 'live_scores') && (
          <Badge className="bg-red-600 text-white animate-pulse">
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            {marketStatus.displayText === 'Match Finished' ? 'FINISHED' : 'LIVE'}
          </Badge>
        )}
        {isClosingSoon && !isLive && !bettingClosed && marketStatus.reason !== 'live_scores' && (
          <Badge className="bg-amber-600 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Closing Soon
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Sport/League badge */}
        <div className="mb-3">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">
            {sportInfo.sportEmoji} {sportInfo.leagueLabel || sportInfo.sportLabel}
          </Badge>
        </div>

        {/* Teams display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <TeamLogo teamName={teamA} sport={getSport()} size="md" />
            <div className="text-left">
              <div className="font-semibold text-sm">{teamA}</div>
              <div className="text-xs text-muted-foreground">to win</div>
            </div>
          </div>
          
          <div className="text-lg font-bold text-muted-foreground px-3">vs</div>
          
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <div className="font-semibold text-sm">{teamB || 'Draw/Other'}</div>
              <div className="text-xs text-muted-foreground">opponent</div>
            </div>
            {teamB && <TeamLogo teamName={teamB} sport={getSport()} size="md" />}
          </div>
        </div>

        {/* Pool percentages bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-emerald-400 font-medium">YES {yesPercent}%</span>
            <span className="text-red-400 font-medium">NO {noPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>

        {/* Pool size and countdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="font-mono">{totalPool.toFixed(2)} XMR</span>
            {totalPool > 0.5 && (
              <Badge variant="outline" className="text-xs py-0 h-4 border-primary/30 text-primary">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                Hot
              </Badge>
            )}
          </div>
          <BettingCountdown 
            bettingClosesAt={market.betting_closes_at}
            bettingOpen={market.betting_open}
            resolutionTime={market.resolution_time}
            variant="inline"
            onBettingClosed={handleBettingClosed}
          />
        </div>

        {/* Quick bet buttons */}
        <div className={`flex items-center gap-2 transition-all duration-200 ${
          isHovered ? 'opacity-100 max-h-20' : 'opacity-70 max-h-20'
        }`}>
          {bettingClosed ? (
            <div className="flex-1 text-center py-2 text-sm text-zinc-500">
              {marketStatus.reason === 'live_scores' ? marketStatus.displayText : 
               isLive ? 'Match in Progress' : 'Betting Closed - Awaiting Result'}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onBetClick(market, 'yes');
                }}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Bet YES
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onBetClick(market, 'no');
                }}
              >
                Bet NO
              </Button>
              {onAddToSlip && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AddToSlipButton
                    marketId={market.market_id}
                    marketTitle={market.title}
                    yesPool={market.yes_pool_xmr || 0}
                    noPool={market.no_pool_xmr || 0}
                    onAdd={onAddToSlip}
                    onOpenSlip={onOpenSlip}
                    variant="icon"
                    bettingClosesAt={market.betting_closes_at}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
