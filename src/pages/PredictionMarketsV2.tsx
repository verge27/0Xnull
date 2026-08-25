import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Coins,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trophy,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';

import { Navbar } from '@/components/Navbar';
import { PredictionsSubsiteNav } from '@/components/PredictionsSubsiteNav';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePredictionBetsV2 } from '@/hooks/usePredictionBetsV2';
import { useToken } from '@/hooks/useToken';
import { useSEO } from '@/hooks/useSEO';
import { api, type PredictionMarket } from '@/services/api';
import { BETTING_CONFIG, validateBetAmount } from '@/lib/bettingConfig';

export type PredictionMarketView =
  | 'all'
  | 'sports'
  | 'cricket'
  | 'combat'
  | 'esports'
  | 'crypto'
  | 'governance'
  | 'starcraft';

const VIEW_COPY: Record<PredictionMarketView, { title: string; description: string }> = {
  all: {
    title: 'Prediction Markets',
    description: 'Externally priced markets funded from one reusable 0xn_ token.',
  },
  sports: {
    title: 'Sports Predictions',
    description: 'Near-term events priced from aggregated bookmaker odds.',
  },
  cricket: {
    title: 'Cricket Predictions',
    description: 'Cricket markets priced from aggregated bookmaker odds.',
  },
  combat: {
    title: 'Combat Predictions',
    description: 'MMA and boxing markets priced from aggregated bookmaker odds.',
  },
  esports: {
    title: 'Esports Predictions',
    description: 'Only markets with a current external consensus are listed.',
  },
  crypto: {
    title: 'Crypto Predictions',
    description: 'Only markets with a current external consensus are listed.',
  },
  governance: {
    title: 'Governance Predictions',
    description: 'Only markets with a current external consensus are listed.',
  },
  starcraft: {
    title: 'StarCraft Predictions',
    description: 'Only markets with a current external consensus are listed.',
  },
};

function marketMatchesView(market: PredictionMarket, view: PredictionMarketView) {
  const sportKey = (market.odds_sport_key || '').toLowerCase();
  const oracleType = (market.oracle_type || '').toLowerCase();
  const text = `${market.market_id} ${market.title} ${market.description}`.toLowerCase();

  if (view === 'all' || view === 'sports') return oracleType === 'sports';
  if (view === 'cricket') return sportKey.startsWith('cricket_') || text.includes('cricket');
  if (view === 'combat') return sportKey.startsWith('mma_') || sportKey.startsWith('boxing_') || text.includes('mma') || text.includes('boxing');
  if (view === 'esports') return oracleType.includes('esport') || text.includes('esport');
  if (view === 'starcraft') return text.includes('starcraft');
  if (view === 'crypto') return oracleType.includes('crypto') || text.includes('crypto');
  return oracleType.includes('governance') || text.includes('governance');
}

function sportLabel(key?: string) {
  if (!key) return 'Market';
  return key
    .replace(/^(americanfootball|basketball|baseball|soccer|cricket|icehockey|tennis|mma|boxing|rugbyunion|rugbyleague|aussierules)_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStart(timestamp?: number) {
  if (!timestamp) return 'Start time pending';
  return new Date(timestamp * 1000).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PredictionMarketsV2({ view = 'sports' }: { view?: PredictionMarketView }) {
  const copy = VIEW_COPY[view];
  useSEO({
    title: `${copy.title} | 0xNull`,
    description: copy.description,
  });
  const { token, balance, loading: tokenLoading } = useToken();
  const { placeBet } = usePredictionBetsV2();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState(BETTING_CONFIG.DEFAULT_BET_USD.toFixed(2));
  const [placing, setPlacing] = useState(false);

  const fetchMarkets = async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const result = await api.getPredictionMarkets(false);
      setMarkets(result.markets || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load markets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchMarkets();
    const interval = window.setInterval(() => void fetchMarkets(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const visibleMarkets = useMemo(() => {
    const now = Date.now() / 1000;
    return markets
      .filter((market) => !market.resolved)
      .filter((market) => (market.commence_time || market.resolution_time) > now)
      .filter((market) => marketMatchesView(market, view))
      .sort((a, b) => (a.commence_time || a.resolution_time) - (b.commence_time || b.resolution_time));
  }, [markets, view]);

  const amountUsd = Number(amount);
  const amountCents = Math.round(amountUsd * 100);
  const validation = validateBetAmount(amountUsd);
  const insufficient = Number.isFinite(amountUsd) && amountUsd > balance;

  const preview = useMemo(() => {
    if (!selectedMarket || !validation.valid) return null;
    const yes = selectedMarket.yes_pool_cents || 0;
    const no = selectedMarket.no_pool_cents || 0;
    const yesAfter = yes + (side === 'YES' ? amountCents : 0);
    const noAfter = no + (side === 'NO' ? amountCents : 0);
    const sideAfter = side === 'YES' ? yesAfter : noAfter;
    const totalAfter = yesAfter + noAfter;
    if (!sideAfter || !totalAfter) return null;
    const gross = Math.floor((amountCents / sideAfter) * totalAfter);
    return { gross, profit: gross - amountCents };
  }, [amountCents, selectedMarket, side, validation.valid]);

  const openBet = (market: PredictionMarket, selectedSide: 'YES' | 'NO') => {
    setSelectedMarket(market);
    setSide(selectedSide);
    setAmount(BETTING_CONFIG.DEFAULT_BET_USD.toFixed(2));
  };

  const submitBet = async () => {
    if (!selectedMarket || !token || !validation.valid || insufficient) return;
    setPlacing(true);
    try {
      await placeBet({
        market_id: selectedMarket.market_id,
        side,
        amount_cents: amountCents,
      });
      toast.success(`${money(amountCents)} reserved on ${side}`, {
        description: 'The position is attached to this 0xn_ token. No second deposit is required.',
      });
      setSelectedMarket(null);
      await fetchMarkets();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to place bet';
      toast.error(message.toLowerCase().includes('balance') ? 'Insufficient token balance' : message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <PredictionsSubsiteNav />

      <main className="container mx-auto flex-1 px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-3 border-primary/30 bg-primary/10 text-primary" variant="outline">
                Prediction v2 · live ledger funding
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">{copy.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-center gap-3 px-4 py-3">
                  <WalletCards className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Available on this token</p>
                    <p className="font-mono font-semibold">{tokenLoading ? '—' : `$${balance.toFixed(2)}`}</p>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" size="icon" onClick={() => void fetchMarkets(true)} disabled={refreshing} aria-label="Refresh markets">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            {[
              { icon: BarChart3, title: '$4 opening liquidity', body: 'Every eligible market starts with $4 split to the bookmaker consensus.' },
              { icon: Coins, title: 'One token', body: 'A bet reserves dollars already on your 0xn_ token—no market wallet or view key.' },
              { icon: CheckCircle2, title: 'Automatic settlement', body: 'Wins and refunds return to the same token balance when the oracle resolves.' },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="bg-card/50">
                <CardContent className="flex gap-3 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading markets…
            </div>
          ) : error ? (
            <Card className="border-destructive/40">
              <CardContent className="py-10 text-center">
                <p className="text-destructive">{error}</p>
                <Button className="mt-4" variant="outline" onClick={() => void fetchMarkets(true)}>Try again</Button>
              </CardContent>
            </Card>
          ) : visibleMarkets.length === 0 ? (
            <Card className="border-dashed bg-card/40">
              <CardContent className="py-14 text-center">
                <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No externally priced markets in this section</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  v2 only opens a market when at least two current bookmakers agree on both sides. The catalogue refreshes every 30 minutes.
                </p>
                {view !== 'sports' && (
                  <Button asChild className="mt-5" variant="outline">
                    <Link to="/sports-predictions">See all live markets <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleMarkets.map((market) => {
                const yes = market.yes_pool_cents || 0;
                const no = market.no_pool_cents || 0;
                const totalPool = yes + no;
                const yesPercent = totalPool > 0 ? Math.round((yes / totalPool) * 100) : 50;
                const noPercent = 100 - yesPercent;
                const seedTotal = (market.treasury_yes_cents || 0) + (market.treasury_no_cents || 0);
                return (
                  <Card key={market.market_id} className="overflow-hidden border-border/70 bg-card/70 transition-colors hover:border-primary/40">
                    <CardContent className="p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{sportLabel(market.odds_sport_key)}</Badge>
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400" variant="outline">
                          {money(seedTotal)} seeded
                        </Badge>
                      </div>
                      <h2 className="min-h-12 text-lg font-semibold leading-snug">{market.title}</h2>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" /> {formatStart(market.commence_time || market.resolution_time)}
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-emerald-400">YES {yesPercent}%</span>
                          <span className="text-red-400">NO {noPercent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-red-500/30">
                          <div className="h-full bg-emerald-500" style={{ width: `${yesPercent}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Button className="h-auto bg-emerald-600 py-3 text-white hover:bg-emerald-700" onClick={() => openBet(market, 'YES')}>
                          <span><span className="block">YES</span><span className="text-xs opacity-80">{yes ? (totalPool / yes).toFixed(2) : '—'}×</span></span>
                        </Button>
                        <Button className="h-auto border-red-500/40 py-3 text-red-400 hover:bg-red-500/10" variant="outline" onClick={() => openBet(market, 'NO')}>
                          <span><span className="block">NO</span><span className="text-xs opacity-80">{no ? (totalPool / no).toFixed(2) : '—'}×</span></span>
                        </Button>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span>{money(totalPool)} total liquidity</span>
                        <span>{market.bookmaker_count || 0} books · median no-vig</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> No new keypair is created when you bet.
            </span>
            <Link className="text-primary hover:underline" to="/payouts">Payout model <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>
          </div>
        </section>
      </main>

      <Footer />

      <Dialog open={!!selectedMarket} onOpenChange={(open) => !open && setSelectedMarket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bet {side}</DialogTitle>
            <DialogDescription>{selectedMarket?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button className={side === 'YES' ? 'bg-emerald-600 hover:bg-emerald-700' : ''} variant={side === 'YES' ? 'default' : 'outline'} onClick={() => setSide('YES')}>YES</Button>
              <Button className={side === 'NO' ? 'bg-red-600 hover:bg-red-700' : ''} variant={side === 'NO' ? 'default' : 'outline'} onClick={() => setSide('NO')}>NO</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prediction-v2-amount">Stake from token balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="prediction-v2-amount" className="pl-7 font-mono" type="number" min={BETTING_CONFIG.MINIMUM_BET_USD} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
              {!validation.valid && amount && <p className="text-xs text-destructive">{validation.error}</p>}
              {insufficient && <p className="text-xs text-destructive">This token has ${balance.toFixed(2)} available.</p>}
            </div>

            <Card className="bg-primary/5">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-mono">${balance.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reserved now</span><span className="font-mono">{money(Number.isFinite(amountCents) ? amountCents : 0)}</span></div>
                {preview && <div className="flex justify-between border-t border-border/60 pt-2"><span className="text-muted-foreground">Approx. return if correct</span><span className="font-mono text-emerald-400">{money(preview.gross)}</span></div>}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              The stake is reserved immediately from this 0xn_ token. Settlement credits the same balance automatically. Draws, cancellations and one-sided pools refund the stake; the 0.4% fee applies to winnings only.
            </p>

            {!token || balance <= 0 ? (
              <Button asChild className="w-full"><Link to="/dashboard">Add funds to this token <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            ) : (
              <Button className="w-full" onClick={() => void submitBet()} disabled={placing || !validation.valid || insufficient}>
                {placing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reserving stake…</> : `Confirm ${side} · ${money(amountCents)}`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
