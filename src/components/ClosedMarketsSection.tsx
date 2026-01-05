import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, RefreshCw, Clock, Bell, Volume2, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { PendingDataIndicator } from '@/components/PendingDataIndicator';
import { type PredictionMarket, api } from '@/services/api';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';

// Simple notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio notification not available');
  }
};

function ResolutionCountdown({ resolutionTime, marketTitle, soundEnabled }: { 
  resolutionTime: number; 
  marketTitle: string;
  soundEnabled: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = resolutionTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Resolving now...');
        return;
      }
      
      if (diff < 60) {
        setTimeLeft(`${diff}s`);
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        setTimeLeft(`${days}d ${hours}h`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [resolutionTime, marketTitle, soundEnabled]);

  const isResolvingNow = timeLeft === 'Resolving now...';

  return (
    <div className={`flex items-center justify-center gap-2 p-2 rounded transition-all ${
      isResolvingNow 
        ? 'bg-amber-900/30 border border-amber-600/50' 
        : 'bg-zinc-800/50 border border-zinc-700'
    }`}>
      {isResolvingNow ? (
        <>
          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-sm text-amber-400">{timeLeft}</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Resolves in {timeLeft}</span>
        </>
      )}
    </div>
  );
}

interface ClosedMarketsSectionProps {
  markets: PredictionMarket[];
  getBetsForMarket: (marketId: string) => any[];
  onMarketsUpdate?: () => void;
}

export function ClosedMarketsSection({ markets, getBetsForMarket, onMarketsUpdate }: ClosedMarketsSectionProps) {
  const { isAdmin } = useIsAdmin();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('resolution-sound-enabled') !== 'false';
  });
  const [resolvingMarket, setResolvingMarket] = useState<string | null>(null);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('resolution-sound-enabled', String(newValue));
    if (newValue) {
      playNotificationSound();
    }
  };

  const handleResolve = async (marketId: string, outcome: 'YES' | 'NO' | 'DRAW') => {
    setResolvingMarket(marketId);
    try {
      const result = await api.resolveMarket(marketId, outcome);
      if (result.success) {
        if (outcome === 'DRAW') {
          toast.success('Market resolved as DRAW - all bets will be refunded');
        } else {
          toast.success(`Market resolved as ${outcome}`);
        }
        onMarketsUpdate?.();
      } else {
        toast.error(result.message || 'Failed to resolve market');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve market';
      toast.error(message);
    } finally {
      setResolvingMarket(null);
    }
  };

  // Calculate how long past resolution time
  const getOverdueStatus = (market: PredictionMarket) => {
    const now = Math.floor(Date.now() / 1000);
    const overdueSeconds = now - market.resolution_time;
    if (overdueSeconds <= 0) return null;
    
    const hours = Math.floor(overdueSeconds / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { text: `${days}d overdue`, severity: 'high' as const };
    if (hours > 2) return { text: `${hours}h overdue`, severity: 'medium' as const };
    return { text: 'Just passed', severity: 'low' as const };
  };

  if (markets.length === 0) return null;

  const getOdds = (market: PredictionMarket) => {
    const total = market.yes_pool_xmr + market.no_pool_xmr;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.yes_pool_xmr / total) * 100),
      no: Math.round((market.no_pool_xmr / total) * 100),
    };
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5 text-zinc-400" />
          Closed Markets ({markets.length})
          <Badge variant="secondary" className="text-xs">Awaiting Result</Badge>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          className="gap-2"
          title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts disabled'}
        >
          <Volume2 className={`w-4 h-4 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-xs">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map(market => {
          const odds = getOdds(market);
          const marketBets = getBetsForMarket(market.market_id);
          const overdueStatus = getOverdueStatus(market);
          
          return (
            <Card 
              key={market.market_id}
              className={`opacity-75 border-zinc-700/50 ${overdueStatus?.severity === 'high' ? 'border-amber-600/50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{market.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{market.description}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className="bg-zinc-700 text-zinc-300">
                      <Lock className="w-3 h-3 mr-1" />
                      CLOSED
                    </Badge>
                    {overdueStatus && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          overdueStatus.severity === 'high' ? 'border-amber-500 text-amber-500' :
                          overdueStatus.severity === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-zinc-500 text-zinc-400'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {overdueStatus.text}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 p-2 rounded bg-emerald-600/20 border border-emerald-600/30 text-center">
                    <div className="text-lg font-bold text-emerald-500">{odds.yes}%</div>
                    <div className="text-xs text-muted-foreground">YES</div>
                    <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                  </div>
                  <div className="flex-1 p-2 rounded bg-red-600/20 border border-red-600/30 text-center">
                    <div className="text-lg font-bold text-red-500">{odds.no}%</div>
                    <div className="text-xs text-muted-foreground">NO</div>
                    <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2 text-center">
                  Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                </div>
                
                {market.resolution_time ? (
                  <ResolutionCountdown 
                    resolutionTime={market.resolution_time} 
                    marketTitle={market.title}
                    soundEnabled={soundEnabled}
                  />
                ) : (
                  <PendingDataIndicator type="result" showLoader className="bg-zinc-800/50 border-zinc-700 text-amber-400" />
                )}
                
                {/* Admin resolution controls */}
                {isAdmin && overdueStatus && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Admin: Resolve Market</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-emerald-600 text-emerald-500 hover:bg-emerald-600/20"
                        onClick={() => handleResolve(market.market_id, 'YES')}
                        disabled={resolvingMarket === market.market_id}
                      >
                        {resolvingMarket === market.market_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        YES Won
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-600 text-red-500 hover:bg-red-600/20"
                        onClick={() => handleResolve(market.market_id, 'NO')}
                        disabled={resolvingMarket === market.market_id}
                      >
                        {resolvingMarket === market.market_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        NO Won
                      </Button>
                    </div>
                    {/* DRAW option for sports markets */}
                    {market.market_id.startsWith('sports_') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-amber-600 text-amber-500 hover:bg-amber-600/20"
                        onClick={() => handleResolve(market.market_id, 'DRAW')}
                        disabled={resolvingMarket === market.market_id}
                      >
                        {resolvingMarket === market.market_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <MinusCircle className="w-3 h-3 mr-1" />
                        )}
                        DRAW (Refund All)
                      </Button>
                    )}
                  </div>
                )}
                
                {marketBets.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">You have {marketBets.length} bet(s) on this market</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
