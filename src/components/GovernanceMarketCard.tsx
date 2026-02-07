import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { PoolTransparency } from '@/components/PoolTransparency';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, Users, Gavel, Info, ChevronDown, ChevronUp, Lock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { PredictionMarket } from '@/services/api';
import { format } from 'date-fns';

// Map market IDs to their feature images
const MARKET_IMAGES: Record<string, string> = {
  'btc_quantum_hardfork_2030': '/images/markets/btc-quantum-hardfork.png',
};

interface GovernanceMarketCardProps {
  market: PredictionMarket;
  onBetClick: (market: PredictionMarket, side: 'yes' | 'no') => void;
  onAddToSlip?: (marketId: string, title: string, side: 'YES' | 'NO', amount: number, yesPool: number, noPool: number, bettingClosesAt?: number) => void;
  onOpenSlip?: () => void;
}

export function GovernanceMarketCard({ 
  market, 
  onBetClick, 
  onAddToSlip,
  onOpenSlip
}: GovernanceMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  
  const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
  const yesPercent = totalPool > 0 ? Math.round((market.yes_pool_xmr / totalPool) * 100) : 50;
  const noPercent = 100 - yesPercent;
  
  // Check if betting is still open
  const now = Date.now() / 1000;
  const bettingClosed = market.resolved || (market.resolution_time && market.resolution_time <= now) || market.betting_open === false;
  
  // Get market image if available
  const marketImage = MARKET_IMAGES[market.market_id];
  
  // Format resolution date nicely for long-term markets
  const formatResolutionDate = () => {
    if (!market.resolution_time) return null;
    const resDate = new Date(market.resolution_time * 1000);
    return format(resDate, 'MMM d, yyyy');
  };

  const getStatusBadge = () => {
    if (market.resolved) {
      if (market.outcome?.toUpperCase() === 'YES') {
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> YES Won</Badge>;
      } else {
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> NO Won</Badge>;
      }
    }
    
    if (market.resolution_time && market.resolution_time <= now) {
      return <Badge className="bg-amber-600 animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Resolving...</Badge>;
    }
    
    return null;
  };

  // Truncate description for preview
  const truncateDescription = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return { text, truncated: false };
    return { text: text.slice(0, maxLength).trim() + '...', truncated: true };
  };

  const descriptionPreview = market.description ? truncateDescription(market.description) : null;

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 bg-card/90 backdrop-blur-sm border-border/50 ${
        isHovered ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : ''
      } ${bettingClosed ? 'opacity-80' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Feature Image */}
      {marketImage && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={marketImage} 
            alt={market.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
      )}
      
      {/* Category and Admin badge */}
      <div className={`absolute ${marketImage ? 'top-2' : 'top-2'} left-2 z-10 flex gap-1.5`}>
        <Badge
          variant="outline"
          className="text-xs bg-amber-500/20 border-amber-500/40 text-amber-400 backdrop-blur-sm"
        >
          <Gavel className="w-3 h-3 mr-1" />
          Governance
        </Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs bg-amber-600/20 border-amber-600/40 text-amber-300 cursor-help backdrop-blur-sm"
            >
              Admin Resolved
              <Info className="w-3 h-3 ml-1" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>This market is resolved by 0xNull admin based on publicly verifiable events. No automated oracle.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Status badges */}
      <div className={`absolute ${marketImage ? 'top-2' : 'top-2'} right-2 flex gap-1 z-10`}>
        {bettingClosed && !market.resolved && market.resolution_time && market.resolution_time > now && (
          <Badge className="bg-zinc-700 text-zinc-300 backdrop-blur-sm">
            <Lock className="w-3 h-3 mr-1" />
            CLOSED
          </Badge>
        )}
        {getStatusBadge()}
      </div>

      <CardContent className={`p-4 ${marketImage ? 'pt-4' : 'pt-12'}`}>
        {/* Market Question */}
        <h3 className="text-lg font-semibold mb-2 leading-tight">
          {market.title}
        </h3>

        {/* Expandable Description */}
        {market.description && (
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <div className="text-sm text-muted-foreground mb-3">
              {descriptionOpen ? (
                <CollapsibleContent className="animate-in fade-in-0 duration-200">
                  <p className="whitespace-pre-wrap">{market.description}</p>
                </CollapsibleContent>
              ) : (
                <p>{descriptionPreview?.text}</p>
              )}
              {descriptionPreview?.truncated && (
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="p-0 h-auto text-amber-400 hover:text-amber-300">
                    {descriptionOpen ? (
                      <>Show less <ChevronUp className="w-3 h-3 ml-1" /></>
                    ) : (
                      <>Read more <ChevronDown className="w-3 h-3 ml-1" /></>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </Collapsible>
        )}

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

        {/* Pool size and resolution date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="font-mono">{totalPool.toFixed(2)} XMR</span>
          </div>
          {formatResolutionDate() && (
            <div className="flex items-center gap-1 text-amber-400">
              <span>Resolves: {formatResolutionDate()}</span>
            </div>
          )}
        </div>

        {/* Pool Transparency for verification */}
        <PoolTransparency marketId={market.market_id} className="mb-3" />

        {/* Bet buttons */}
        <div className={`flex items-center gap-2 transition-all duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`}>
          {bettingClosed ? (
            <div className="flex-1 text-center py-2 text-sm text-zinc-500">
              {market.resolved ? 'Market Resolved' : 'Betting Closed - Awaiting Resolution'}
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
