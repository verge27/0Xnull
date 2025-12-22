import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, RefreshCw, Clock, Bell, Volume2 } from 'lucide-react';
import { type PredictionMarket } from '@/services/api';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [isResolvingSoon, setIsResolvingSoon] = useState(false);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = resolutionTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Resolving now...');
        setIsResolvingSoon(true);
        return;
      }
      
      // Check if resolving within 5 minutes
      const resolvingSoon = diff <= 300;
      setIsResolvingSoon(resolvingSoon);
      
      // Trigger notification when entering 5-minute window
      if (resolvingSoon && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        if (soundEnabled) {
          playNotificationSound();
        }
        toast.info(`⏰ Resolving soon!`, {
          description: `"${marketTitle}" resolves in less than 5 minutes`,
        });
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
        : isResolvingSoon 
          ? 'bg-primary/20 border border-primary/50 animate-pulse' 
          : 'bg-zinc-800/50 border border-zinc-700'
    }`}>
      {isResolvingNow ? (
        <>
          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-sm text-amber-400">{timeLeft}</span>
        </>
      ) : isResolvingSoon ? (
        <>
          <Bell className="w-4 h-4 text-primary animate-bounce" />
          <span className="text-sm text-primary font-medium">Resolves in {timeLeft}</span>
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
}

export function ClosedMarketsSection({ markets, getBetsForMarket }: ClosedMarketsSectionProps) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Load from localStorage
    return localStorage.getItem('resolution-sound-enabled') !== 'false';
  });

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('resolution-sound-enabled', String(newValue));
    if (newValue) {
      playNotificationSound(); // Play a test sound
    }
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
          
          return (
            <Card 
              key={market.market_id}
              className="opacity-75 border-zinc-700/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{market.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{market.description}</p>
                  </div>
                  <Badge className="bg-zinc-700 text-zinc-300">
                    <Lock className="w-3 h-3 mr-1" />
                    CLOSED
                  </Badge>
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
                  <div className="flex items-center justify-center gap-2 p-2 rounded bg-zinc-800/50 border border-zinc-700">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-sm text-amber-400">Awaiting Resolution</span>
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
