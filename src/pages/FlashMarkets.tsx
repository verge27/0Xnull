import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Timer, Zap, Volume2, VolumeX } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { playCountdownTick, playResolutionSound } from '@/lib/sounds';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

interface FlashRound {
  round_id: string;
  asset: string;
  start_time: number;
  cutoff_time: number;
  resolve_time: number;
  current_price: number;
  phase: 'upcoming' | 'betting' | 'locked' | 'resolved';
  time_remaining: number;
  can_bet: boolean;
  pools: { up: number; down: number };
  implied_odds: { up: number; down: number };
  total_pool: number;
  view_key: string;
}

interface ResolvedRound {
  round_id: string;
  asset: string;
  start_price: number;
  end_price: number;
  outcome: 'up' | 'down';
  resolved_at: number;
  total_pool: number;
}

interface BetResult {
  bet_id: string;
  deposit_address: string;
  view_key: string;
  expires_at: number;
  qr_uri: string;
}

const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
};

const COINGECKO_IDS: Record<string, string> = {
  XMR: 'monero',
};

// Simple sparkline component
const Sparkline = ({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) => {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#22c55e' : '#ef4444';
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function FlashMarkets() {
  const [asset, setAsset] = useState('BTC');
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'up' | 'down'>('up');
  const [betAmount, setBetAmount] = useState('0.01');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [betResult, setBetResult] = useState<BetResult | null>(null);
  
  // Track user's active bets for win detection (persisted to localStorage)
  const [activeBets, setActiveBets] = useState<Record<string, { round_id: string; side: 'up' | 'down' }>>(() => {
    try {
      const stored = localStorage.getItem('flash-active-bets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const lastResolvedRoundRef = useRef<string | null>(null);

  // Persist active bets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flash-active-bets', JSON.stringify(activeBets));
    } catch {
      // localStorage unavailable
    }
  }, [activeBets]);
  
  // Price history for sparkline (last 30 data points = ~1 minute at 2s intervals)
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({
    BTC: [],
    ETH: [],
    XMR: [],
  });

  // Confetti celebration function
  const triggerWinCelebration = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
      });
    }, 250);
  }, []);

  // Poll prices every 2 seconds (Binance for BTC/ETH, CoinGecko for XMR)
  const { data: price } = useQuery({
    queryKey: ['crypto-price', asset],
    queryFn: async () => {
      if (asset === 'XMR') {
        // Use CoinGecko for XMR
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd');
        if (!res.ok) throw new Error('Failed to fetch XMR price');
        const data = await res.json();
        return data.monero.usd as number;
      } else {
        // Use Binance for BTC/ETH
        const symbol = BINANCE_SYMBOLS[asset];
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (!res.ok) throw new Error('Failed to fetch price');
        const data = await res.json();
        return parseFloat(data.price);
      }
    },
    refetchInterval: asset === 'XMR' ? 5000 : 2000, // CoinGecko has rate limits, poll less frequently
  });

  // Update price history when price changes
  useEffect(() => {
    if (price) {
      setPriceHistory(prev => {
        const history = [...(prev[asset] || []), price];
        // Keep last 30 data points (~1 minute)
        const trimmed = history.slice(-30);
        return { ...prev, [asset]: trimmed };
      });
    }
  }, [price, asset]);

  // Poll current round every second
  const { data: round } = useQuery<FlashRound>({
    queryKey: ['flash-round', asset],
    queryFn: async () => {
      const url = new URL(PROXY_URL);
      url.searchParams.set('path', `/api/flash/rounds/current/${asset}`);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch round');
      return res.json();
    },
    refetchInterval: 1000,
  });

  // Fetch recent resolved rounds
  const { data: recentResults } = useQuery<ResolvedRound[]>({
    queryKey: ['flash-history', asset],
    queryFn: async () => {
      const url = new URL(PROXY_URL);
      url.searchParams.set('path', `/api/flash/rounds/history/${asset}`);
      url.searchParams.set('limit', '5');
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async () => {
      const url = new URL(PROXY_URL);
      url.searchParams.set('path', '/api/flash/bet');
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: round?.round_id,
          side: selectedSide,
          amount_xmr: parseFloat(betAmount),
          payout_address: payoutAddress,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setBetResult(data);
      // Track the bet for win detection
      if (round?.round_id) {
        setActiveBets(prev => ({
          ...prev,
          [round.round_id]: { round_id: round.round_id, side: selectedSide }
        }));
      }
    },
  });

  // Check for wins when recent results update
  useEffect(() => {
    if (recentResults && recentResults.length > 0) {
      const latestResult = recentResults[0];
      
      // Check if this is a new result we haven't processed
      if (latestResult.round_id !== lastResolvedRoundRef.current) {
        lastResolvedRoundRef.current = latestResult.round_id;
        
        // Check if user had a bet on this round
        const userBet = activeBets[latestResult.round_id];
        if (userBet) {
          if (userBet.side === latestResult.outcome) {
            // User won!
            triggerWinCelebration();
            toast.success('🎉 You won!', {
              description: `${latestResult.outcome.toUpperCase()} was correct!`,
            });
          } else {
            // User lost
            toast.error('Better luck next time', {
              description: `${latestResult.outcome.toUpperCase()} won this round.`,
            });
          }
          // Remove the bet from active bets
          setActiveBets(prev => {
            const newBets = { ...prev };
            delete newBets[latestResult.round_id];
            return newBets;
          });
        }
      }
    }
  }, [recentResults, activeBets, triggerWinCelebration]);

  // Countdown sounds for final 5 seconds
  const lastPlayedSecondRef = useRef<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('flash-sounds-enabled') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!soundEnabled || !round?.time_remaining) return;
    
    const timeRemaining = round.time_remaining;
    
    // Play tick sounds for final 5 seconds
    if (timeRemaining <= 5 && timeRemaining > 0 && timeRemaining !== lastPlayedSecondRef.current) {
      lastPlayedSecondRef.current = timeRemaining;
      playCountdownTick(timeRemaining);
    }
    
    // Play resolution sound when round resolves (time hits 0)
    if (timeRemaining === 0 && lastPlayedSecondRef.current !== 0) {
      lastPlayedSecondRef.current = 0;
      playResolutionSound();
    }
    
    // Reset when new round starts
    if (timeRemaining > 5) {
      lastPlayedSecondRef.current = null;
    }
  }, [round?.time_remaining, soundEnabled]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalPool = (round?.pools?.up || 0) + (round?.pools?.down || 0);
  const upPercent = totalPool > 0 ? (round!.pools.up / totalPool) * 100 : 50;

  const openBetModal = (side: 'up' | 'down') => {
    setSelectedSide(side);
    setBetResult(null);
    setShowBetModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main 
        className="flex-1 flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/images/backgrounds/flash-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newValue = !soundEnabled;
                setSoundEnabled(newValue);
                try {
                  localStorage.setItem('flash-sounds-enabled', String(newValue));
                } catch {}
              }}
              className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-foreground">
              <Zap className="h-8 w-8 text-purple-500" />
              Bull vs Bear
            </h1>
            <p className="text-muted-foreground mt-1">
              Predict UP or DOWN in 5 minutes
            </p>
          </div>

          {/* Asset Tabs */}
          <div className="flex gap-2 justify-center">
            {['BTC', 'XMR', 'ETH'].map((a) => (
              <Button
                key={a}
                variant={asset === a ? 'default' : 'outline'}
                onClick={() => setAsset(a)}
                className={asset === a ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {a}
              </Button>
            ))}
          </div>

          {/* Current Price */}
          <Card className="p-6 bg-card/80 backdrop-blur border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current {asset} Price</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${(price ?? round?.current_price)?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '---'}
                </p>
                {priceHistory[asset]?.length >= 2 && (
                  <p className={`text-xs mt-1 ${
                    priceHistory[asset][priceHistory[asset].length - 1] >= priceHistory[asset][0] 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {priceHistory[asset][priceHistory[asset].length - 1] >= priceHistory[asset][0] ? '▲' : '▼'}
                    {' '}
                    {Math.abs(
                      ((priceHistory[asset][priceHistory[asset].length - 1] - priceHistory[asset][0]) / priceHistory[asset][0]) * 100
                    ).toFixed(3)}% (1m)
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Sparkline data={priceHistory[asset] || []} width={100} height={40} />
                <span className="text-[10px] text-muted-foreground">Last 1 min</span>
              </div>
            </div>
          </Card>

          {/* Timer */}
          <Card className={`p-4 bg-card border-border transition-all duration-200 ${
            round?.time_remaining && round.time_remaining <= 5 && round.time_remaining > 0 
              ? 'ring-2 ring-yellow-500/50 animate-pulse' 
              : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`h-5 w-5 ${
                  round?.time_remaining && round.time_remaining <= 5 && round.time_remaining > 0
                    ? 'text-yellow-500 animate-bounce'
                    : round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'
                }`} />
                <span className="text-muted-foreground">
                  {round?.phase === 'betting' ? 'Betting closes' :
                   round?.phase === 'locked' ? 'Result in' : 'Starts in'}
                </span>
              </div>
              <span className={`text-2xl font-mono font-bold transition-all duration-200 ${
                round?.time_remaining && round.time_remaining <= 5 && round.time_remaining > 0
                  ? 'text-yellow-400 scale-110'
                  : round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {formatTime(round?.time_remaining || 0)}
              </span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  round?.time_remaining && round.time_remaining <= 5 && round.time_remaining > 0
                    ? 'bg-yellow-400'
                    : round?.phase === 'betting' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(100, ((round?.time_remaining || 0) / 300) * 100)}%` }}
              />
            </div>
          </Card>

          {/* Pool Distribution */}
          <Card className="p-4 bg-card border-border">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-500">UP: {round?.pools?.up?.toFixed(4) || '0.0000'} XMR ({upPercent.toFixed(0)}%)</span>
              <span className="text-red-500">DOWN: {round?.pools?.down?.toFixed(4) || '0.0000'} XMR ({(100-upPercent).toFixed(0)}%)</span>
            </div>
            <div className="flex h-10 rounded-lg overflow-hidden border border-border">
              <div 
                className="bg-green-600 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${upPercent}%` }}
              >
                {round?.implied_odds?.up?.toFixed(2) || '1.00'}x
              </div>
              <div 
                className="bg-red-600 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${100 - upPercent}%` }}
              >
                {round?.implied_odds?.down?.toFixed(2) || '1.00'}x
              </div>
            </div>
          </Card>

          {/* Bet Buttons */}
          {round?.can_bet && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-20 text-xl font-bold text-white"
                style={{ backgroundColor: '#22c55e' }}
                onClick={() => openBetModal('up')}
              >
                <TrendingUp className="mr-2 h-7 w-7" />
                UP
              </Button>
              <Button
                size="lg"
                className="h-20 text-xl font-bold text-white"
                style={{ backgroundColor: '#ef4444' }}
                onClick={() => openBetModal('down')}
              >
                <TrendingDown className="mr-2 h-7 w-7" />
                DOWN
              </Button>
            </div>
          )}

          {/* Locked state */}
          {round?.phase === 'locked' && (
            <Card className="p-8 bg-card border-border text-center">
              <p className="text-4xl mb-2">⏳</p>
              <p className="text-muted-foreground">Waiting for result...</p>
            </Card>
          )}

          {/* Recent Results */}
          {recentResults && recentResults.length > 0 && (
            <Card className="p-4 bg-card/80 backdrop-blur border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-sm">📊</span>
                Recent Results
              </h3>
              <div className="space-y-2">
                {recentResults.map((result) => {
                  const priceChange = ((result.end_price - result.start_price) / result.start_price) * 100;
                  const timeAgo = Math.floor((Date.now() / 1000 - result.resolved_at) / 60);
                  return (
                    <div 
                      key={result.round_id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          result.outcome === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {result.outcome === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${
                            result.outcome === 'up' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {result.outcome.toUpperCase()} won
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono ${
                          priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.total_pool?.toFixed(2) || '0.00'} XMR
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* How it works */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bet on {asset} going UP or DOWN in 5 minutes</li>
              <li>• Winners split the losers' pool</li>
              <li>• 0.4% fee on winnings only</li>
              <li>• One-sided rounds = full refund</li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Bet Modal */}
      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className={selectedSide === 'up' ? 'text-green-500' : 'text-red-500'}>
              Bet {selectedSide.toUpperCase()} on {asset}
            </DialogTitle>
          </DialogHeader>
          
          {betResult ? (
            // QR Code Display
            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <QRCodeSVG value={betResult.qr_uri} size={200} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Send {betAmount} XMR to:</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all text-foreground">
                  {betResult.deposit_address}
                </p>
              </div>
              <p className="text-sm text-yellow-500">
                Expires in {Math.max(0, Math.floor((betResult.expires_at - Date.now()/1000) / 60))} min
              </p>
              <Button onClick={() => setShowBetModal(false)} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            // Bet Form
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Amount (XMR)</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  step="0.001"
                  min="0.001"
                  max="10"
                  className="bg-muted border-border mt-1"
                />
                <div className="flex gap-2 mt-2">
                  {['0.01', '0.05', '0.1', '0.5'].map((a) => (
                    <Button 
                      key={a} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBetAmount(a)}
                      className="flex-1"
                    >
                      {a}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Payout Address (XMR)</label>
                <Input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="4..."
                  className="bg-muted border-border mt-1 text-sm"
                />
              </div>
              
              <Button
                className={`w-full ${selectedSide === 'up' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => placeBet.mutate()}
                disabled={placeBet.isPending || !payoutAddress}
              >
                {placeBet.isPending ? 'Creating...' : `Bet ${selectedSide.toUpperCase()}`}
              </Button>
              
              {placeBet.isError && (
                <p className="text-sm text-red-500 text-center">
                  {(placeBet.error as Error).message}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
