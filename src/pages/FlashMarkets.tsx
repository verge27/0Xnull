import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Timer, TrendingDown, TrendingUp, Volume2, VolumeX, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { PredictionsSubsiteNav } from '@/components/PredictionsSubsiteNav';
import { SEORichText } from '@/components/SEORichText';
import { VoucherBadge } from '@/components/VoucherBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToken } from '@/hooks/useToken';
import { useVoucherFromUrl } from '@/hooks/useVoucher';
import { BETTING_CONFIG, validateBetAmount } from '@/lib/bettingConfig';
import { playCountdownTick, playResolutionSound } from '@/lib/sounds';
import { api, type PredictionV2Bet } from '@/services/api';

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
  pools_cents: { up: number; down: number };
  treasury_pools_cents: { up: number; down: number };
  implied_odds: { up: number; down: number };
  total_pool_cents: number;
  bet_count: number;
  funding: 'txn_balance';
  pricing_method: 'even_fallback';
}

interface ResolvedRound {
  round_id: string;
  asset: string;
  start_price: number;
  end_price: number;
  outcome: 'up' | 'down' | 'draw';
  resolved_at: number;
  total_pool_cents: number;
}

interface FlashHistoryResponse {
  rounds: ResolvedRound[];
}

interface ActiveFlashBet {
  bet_id: string;
  round_id: string;
  side: 'up' | 'down';
}

const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
};

const KRAKEN_PAIRS: Record<string, string> = {
  XMR: 'XMRUSD',
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function Sparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function FlashMarkets() {
  useVoucherFromUrl();
  const queryClient = useQueryClient();
  const { token, balance, loading: tokenLoading, refreshBalance } = useToken();
  const [asset, setAsset] = useState('BTC');
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'up' | 'down'>('up');
  const [betAmount, setBetAmount] = useState(BETTING_CONFIG.DEFAULT_BET_USD.toFixed(2));
  const [betResult, setBetResult] = useState<PredictionV2Bet | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [isShaking, setIsShaking] = useState(false);
  const [activeBets, setActiveBets] = useState<Record<string, ActiveFlashBet>>(() => {
    try {
      const stored = localStorage.getItem('flash-v2-active-bets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const lastResolvedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('flash-v2-active-bets', JSON.stringify(activeBets));
    } catch {
      // Storage can be disabled without affecting settlement.
    }
  }, [activeBets]);

  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({
    BTC: [],
    ETH: [],
    XMR: [],
  });

  const triggerWinCelebration = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return window.clearInterval(interval);
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

  const { data: price } = useQuery({
    queryKey: ['crypto-price', asset],
    queryFn: async () => {
      if (asset === 'XMR') {
        const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${KRAKEN_PAIRS[asset]}`);
        if (!res.ok) throw new Error('Failed to fetch XMR price');
        const data = await res.json();
        const pairKey = Object.keys(data.result)[0];
        return Number.parseFloat(data.result[pairKey].c[0]);
      }
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${BINANCE_SYMBOLS[asset]}`);
      if (!res.ok) throw new Error('Failed to fetch price');
      const data = await res.json();
      return Number.parseFloat(data.price);
    },
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!price) return;
    setPriceHistory((previous) => ({
      ...previous,
      [asset]: [...(previous[asset] || []), price].slice(-30),
    }));
  }, [price, asset]);

  const { data: round } = useQuery<FlashRound>({
    queryKey: ['flash-v2-round', asset],
    queryFn: async () => {
      const url = new URL(PROXY_URL);
      url.searchParams.set('path', `/api/flash/rounds/current/${asset}`);
      const response = await fetch(url.toString());
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || payload.error || 'Failed to fetch round');
      return payload;
    },
    refetchInterval: 1000,
  });

  const { data: recentResults = [] } = useQuery<ResolvedRound[]>({
    queryKey: ['flash-v2-history', asset],
    queryFn: async () => {
      const url = new URL(PROXY_URL);
      url.searchParams.set('path', `/api/flash/rounds/history/${asset}?limit=5`);
      const response = await fetch(url.toString());
      if (!response.ok) return [];
      const payload = await response.json() as FlashHistoryResponse;
      return payload.rounds || [];
    },
    refetchInterval: 10_000,
  });

  const amountUsd = Number(betAmount);
  const amountCents = Math.round(amountUsd * 100);
  const amountValidation = validateBetAmount(amountUsd);
  const insufficientBalance = Number.isFinite(amountUsd) && amountUsd > balance;
  const v2Ready = round?.funding === 'txn_balance';

  const placeBet = useMutation({
    mutationFn: async () => {
      if (!round || !token) throw new Error('A TXN token is required');
      if (!amountValidation.valid) throw new Error(amountValidation.error);
      if (insufficientBalance) throw new Error('Insufficient TXN balance');
      return api.placePredictionBetV2(
        token,
        {
          market_id: round.round_id,
          side: selectedSide === 'up' ? 'YES' : 'NO',
          amount_cents: amountCents,
        },
        idempotencyKey,
      );
    },
    onSuccess: async (result) => {
      setBetResult(result);
      setActiveBets((previous) => ({
        ...previous,
        [result.market_id]: {
          bet_id: result.bet_id,
          round_id: result.market_id,
          side: result.side === 'YES' ? 'up' : 'down',
        },
      }));
      await Promise.all([
        refreshBalance(),
        queryClient.invalidateQueries({ queryKey: ['flash-v2-round', asset] }),
      ]);
    },
  });

  useEffect(() => {
    const latestResult = recentResults[0];
    if (!latestResult || latestResult.round_id === lastResolvedRoundRef.current) return;
    lastResolvedRoundRef.current = latestResult.round_id;
    const userBet = activeBets[latestResult.round_id];
    if (!userBet) return;

    if (latestResult.outcome === 'draw') {
      toast.info('Round drawn', { description: 'Your TXN stake was returned.' });
    } else if (userBet.side === latestResult.outcome) {
      triggerWinCelebration();
      toast.success('You won!', { description: `${latestResult.outcome.toUpperCase()} was correct.` });
    } else {
      toast.error('Better luck next time', { description: `${latestResult.outcome.toUpperCase()} won this round.` });
    }
    setActiveBets((previous) => {
      const next = { ...previous };
      delete next[latestResult.round_id];
      return next;
    });
    void refreshBalance();
  }, [activeBets, recentResults, refreshBalance, triggerWinCelebration]);

  const lastPlayedSecondRef = useRef<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('flash-sounds-enabled') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!soundEnabled || round?.time_remaining === undefined) return;
    const remaining = round.time_remaining;
    if (remaining <= 5 && remaining > 0 && remaining !== lastPlayedSecondRef.current) {
      lastPlayedSecondRef.current = remaining;
      playCountdownTick(remaining);
    }
    if (remaining === 0 && lastPlayedSecondRef.current !== 0) {
      lastPlayedSecondRef.current = 0;
      playResolutionSound();
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
    }
    if (remaining > 5) lastPlayedSecondRef.current = null;
  }, [round?.time_remaining, soundEnabled]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const totalPoolCents = (round?.pools_cents?.up || 0) + (round?.pools_cents?.down || 0);
  const upPercent = totalPoolCents > 0 ? ((round?.pools_cents?.up || 0) / totalPoolCents) * 100 : 50;
  const preview = useMemo(() => {
    if (!round?.pools_cents || !amountValidation.valid) return null;
    const upAfter = round.pools_cents.up + (selectedSide === 'up' ? amountCents : 0);
    const downAfter = round.pools_cents.down + (selectedSide === 'down' ? amountCents : 0);
    const sideAfter = selectedSide === 'up' ? upAfter : downAfter;
    const totalAfter = upAfter + downAfter;
    if (!sideAfter || !totalAfter) return null;
    return Math.floor((amountCents / sideAfter) * totalAfter);
  }, [amountCents, amountValidation.valid, round, selectedSide]);

  const openBetModal = (side: 'up' | 'down') => {
    setSelectedSide(side);
    setBetResult(null);
    setIdempotencyKey(crypto.randomUUID());
    placeBet.reset();
    setShowBetModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PredictionsSubsiteNav />

      <main
        className="flex-1 flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/images/backgrounds/flash-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className={`w-full max-w-md space-y-6 relative z-10 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="text-center relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                try { localStorage.setItem('flash-sounds-enabled', String(next)); } catch { /* no-op */ }
              }}
              className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
                <Zap className="h-8 w-8 text-purple-500" />
                Bull vs Bear
              </h1>
              <VoucherBadge />
            </div>
            <p className="text-muted-foreground mt-1">Five-minute entry · ten-minute result</p>
            <p className="text-xs text-emerald-400 mt-2">TXN-funded · $4 even treasury seed each round</p>
          </div>

          <div className="flex gap-2 justify-center">
            {['BTC', 'XMR', 'ETH'].map((item) => (
              <Button
                key={item}
                variant={asset === item ? 'default' : 'outline'}
                onClick={() => setAsset(item)}
                className={asset === item ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {item}
              </Button>
            ))}
          </div>

          <Card className="p-6 bg-card/80 backdrop-blur border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current {asset} Price</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${(price ?? round?.current_price)?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || '---'}
                </p>
                {priceHistory[asset]?.length >= 2 && (
                  <p className={`text-xs mt-1 ${priceHistory[asset].at(-1)! >= priceHistory[asset][0] ? 'text-green-500' : 'text-red-500'}`}>
                    {priceHistory[asset].at(-1)! >= priceHistory[asset][0] ? '▲' : '▼'}{' '}
                    {Math.abs(((priceHistory[asset].at(-1)! - priceHistory[asset][0]) / priceHistory[asset][0]) * 100).toFixed(3)}% (1m)
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Sparkline data={priceHistory[asset] || []} width={100} height={40} />
                <span className="text-[10px] text-muted-foreground">Last 1 min</span>
              </div>
            </div>
          </Card>

          <Card className={`p-4 bg-card border-border transition-all duration-200 ${round?.time_remaining && round.time_remaining <= 5 ? 'ring-2 ring-yellow-500/50 animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`h-5 w-5 ${round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-muted-foreground">
                  {round?.phase === 'betting' ? 'Entry closes' : round?.phase === 'locked' ? 'Result in' : 'Starts in'}
                </span>
              </div>
              <span className={`text-2xl font-mono font-bold ${round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'}`}>
                {formatTime(round?.time_remaining || 0)}
              </span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${round?.phase === 'betting' ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(100, ((round?.time_remaining || 0) / 300) * 100)}%` }}
              />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-500">UP: {money(round?.pools_cents?.up || 0)} ({upPercent.toFixed(0)}%)</span>
              <span className="text-red-500">DOWN: {money(round?.pools_cents?.down || 0)} ({(100 - upPercent).toFixed(0)}%)</span>
            </div>
            <div className="flex h-10 rounded-lg overflow-hidden border border-border">
              <div className="bg-green-600 flex items-center justify-center text-white font-bold transition-all duration-300" style={{ width: `${upPercent}%` }}>
                {round?.implied_odds?.up?.toFixed(2) || '2.00'}x
              </div>
              <div className="bg-red-600 flex items-center justify-center text-white font-bold transition-all duration-300" style={{ width: `${100 - upPercent}%` }}>
                {round?.implied_odds?.down?.toFixed(2) || '2.00'}x
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Total pool {money(totalPoolCents)}</span>
              <span>Balance ${balance.toFixed(2)}</span>
            </div>
          </Card>

          {round?.can_bet && v2Ready && (
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" className="h-20 text-xl font-bold text-white bg-green-600 hover:bg-green-700" onClick={() => openBetModal('up')}>
                <TrendingUp className="mr-2 h-7 w-7" /> UP
              </Button>
              <Button size="lg" className="h-20 text-xl font-bold text-white bg-red-600 hover:bg-red-700" onClick={() => openBetModal('down')}>
                <TrendingDown className="mr-2 h-7 w-7" /> DOWN
              </Button>
            </div>
          )}

          {round && !v2Ready && (
            <Card className="p-6 bg-card border-border text-center text-muted-foreground">Flash V2 is activating.</Card>
          )}

          {round?.phase === 'locked' && (
            <Card className="p-8 bg-card border-border text-center">
              <p className="text-4xl mb-2">⏳</p>
              <p className="text-muted-foreground">Waiting for result…</p>
            </Card>
          )}

          {recentResults.length > 0 && (
            <Card className="p-4 bg-card/80 backdrop-blur border-border">
              <h3 className="font-semibold text-foreground mb-3">Recent results</h3>
              <div className="space-y-2">
                {recentResults.map((result) => {
                  const priceChange = ((result.end_price - result.start_price) / result.start_price) * 100;
                  const minutesAgo = Math.floor((Date.now() / 1000 - result.resolved_at) / 60);
                  return (
                    <div key={result.round_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.outcome === 'up' ? 'bg-green-500/20' : result.outcome === 'down' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                          {result.outcome === 'up' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className={`w-4 h-4 ${result.outcome === 'down' ? 'text-red-500' : 'text-yellow-500'}`} />}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${result.outcome === 'up' ? 'text-green-500' : result.outcome === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                            {result.outcome === 'draw' ? 'DRAW' : `${result.outcome.toUpperCase()} won`}
                          </p>
                          <p className="text-xs text-muted-foreground">{minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{money(result.total_pool_cents || 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Choose whether {asset} finishes UP or DOWN</li>
              <li>• Stakes reserve from your existing TXN balance</li>
              <li>• Every round opens with a $2-per-side treasury seed</li>
              <li>• Winners split the losing pool; 0.4% fee on user losses</li>
              <li>• Draws return every stake to its TXN balance</li>
            </ul>
          </Card>
        </div>
      </main>

      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className={selectedSide === 'up' ? 'text-green-500' : 'text-red-500'}>
              {selectedSide.toUpperCase()} on {asset}
            </DialogTitle>
          </DialogHeader>

          {betResult ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="font-semibold text-emerald-400">Position reserved</p>
                <p className="mt-1 text-sm text-muted-foreground">{money(betResult.amount_cents)} from your TXN balance</p>
              </div>
              <p className="font-mono text-xs text-muted-foreground break-all">{betResult.bet_id}</p>
              <Button onClick={() => setShowBetModal(false)} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Stake (USD from TXN balance)</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(event) => setBetAmount(event.target.value)}
                  step="0.01"
                  min={BETTING_CONFIG.MINIMUM_BET_USD}
                  max={BETTING_CONFIG.MAXIMUM_BET_USD}
                  className="bg-muted border-border mt-1"
                />
                <div className="flex gap-2 mt-2">
                  {['0.20', '0.50', '1.00', '2.00'].map((value) => (
                    <Button key={value} variant="outline" size="sm" onClick={() => setBetAmount(value)} className="flex-1">${value}</Button>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-muted/60 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span>${balance.toFixed(2)}</span></div>
                {preview !== null && <div className="flex justify-between mt-1"><span className="text-muted-foreground">Estimated return</span><span>{money(preview)}</span></div>}
              </div>

              {!tokenLoading && insufficientBalance && (
                <p className="text-sm text-amber-400">Insufficient balance. <Link to="/dashboard" className="underline">Fund your TXN token</Link>.</p>
              )}
              {!amountValidation.valid && <p className="text-sm text-red-500">{amountValidation.error}</p>}

              <Button
                className={`w-full ${selectedSide === 'up' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => placeBet.mutate()}
                disabled={placeBet.isPending || tokenLoading || !token || !amountValidation.valid || insufficientBalance || !round?.can_bet}
              >
                {placeBet.isPending ? 'Reserving…' : `Reserve ${money(amountCents)} on ${selectedSide.toUpperCase()}`}
              </Button>

              {placeBet.isError && <p className="text-sm text-red-500 text-center">{(placeBet.error as Error).message}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SEORichText
        title="Flash Markets: TXN-funded Bull vs Bear"
        content={`
          <p>Flash Markets are ten-minute BTC, ETH and XMR direction markets with a five-minute entry window. Each round opens with an even $4 treasury seed.</p>
          <p>Positions reserve value from the same reusable TXN token used elsewhere on 0xNull. Settlement returns winnings or refunds to that token balance; no per-round wallet, deposit address, payout address or view key is created.</p>
          <p>The outcome is determined from the asset price at the start and end of the round. Winners split the losing pool, while a draw returns every stake.</p>
        `}
      />
      <Footer />
    </div>
  );
}
