import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { PredictionsSubsiteNav } from '@/components/PredictionsSubsiteNav';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSEO } from '@/hooks/useSEO';
import { useToken } from '@/hooks/useToken';
import { api, type PayoutEntry, type PredictionV2Payout } from '@/services/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(timestamp?: number | null) {
  if (!timestamp) return 'Pending timestamp';
  return new Date(timestamp * 1000).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: PredictionV2Payout['status']) {
  if (status === 'won') return { label: 'Won', style: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' };
  if (status === 'refunded') return { label: 'Refunded', style: 'border-blue-500/30 bg-blue-500/10 text-blue-400' };
  return { label: 'Lost', style: 'border-red-500/30 bg-red-500/10 text-red-400' };
}

export default function Payouts() {
  useSEO({
    title: 'Prediction Settlements | 0xNull',
    description: 'How prediction v2 reserves stakes and settles wins or refunds back to the same 0xn_ token.',
  });
  const { token, balance, refreshBalance } = useToken();
  const [v2Payouts, setV2Payouts] = useState<PredictionV2Payout[]>([]);
  const [legacyPayouts, setLegacyPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchPayouts = async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const [v2, legacy] = await Promise.all([
        api.getPredictionPayoutsV2(),
        api.getPredictionPayouts(),
      ]);
      setV2Payouts(v2.payouts || []);
      setLegacyPayouts(legacy.payouts || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the settlement ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchPayouts();
  }, []);

  const stats = useMemo(() => ({
    settled: v2Payouts.length,
    wins: v2Payouts.filter((entry) => entry.status === 'won').length,
    refunds: v2Payouts.filter((entry) => entry.status === 'refunded').length,
    returnedCents: v2Payouts.reduce((sum, entry) => sum + entry.payout_cents, 0),
  }), [v2Payouts]);

  const submitWithdrawal = async () => {
    if (!token) return;
    const amountCents = Math.round(Number(withdrawAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > Math.round(balance * 100)) {
      toast.error('Enter a withdrawal between $1.00 and your available balance');
      return;
    }
    if (!withdrawAddress.startsWith('4') && !withdrawAddress.startsWith('8')) {
      toast.error('Enter a valid Monero address');
      return;
    }
    setWithdrawing(true);
    try {
      await api.queueTokenWithdrawal(token, withdrawAddress.trim(), amountCents);
      await refreshBalance();
      toast.success('Withdrawal queued', { description: 'The amount is reserved while the Monero transaction is sent.' });
      setWithdrawOpen(false);
      setWithdrawAddress('');
      setWithdrawAmount('');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to queue withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PredictionsSubsiteNav />

      <main className="container mx-auto flex-1 px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild variant="ghost" size="icon"><Link to="/predict"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div className="flex-1">
              <Badge className="mb-2 border-primary/30 bg-primary/10 text-primary" variant="outline">Prediction v2</Badge>
              <h1 className="text-3xl font-bold">Settlement ledger</h1>
              <p className="mt-1 text-muted-foreground">One balance from stake reservation through settlement and withdrawal.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setWithdrawAmount(balance.toFixed(2)); setWithdrawOpen(true); }} disabled={!token || balance < 1}>Withdraw</Button>
              <Button variant="outline" onClick={() => void fetchPayouts(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr] lg:items-start">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-primary">What changed</p>
                  <h2 className="mt-2 text-2xl font-semibold">Markets no longer create their own Monero wallet.</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    A bet now reserves dollars already held by your 0xn_ token. When the market resolves, winnings or a refund credit that same token automatically. There is no payout address to enter and no market view key to save.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild><Link to="/sports-predictions">View seeded markets <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline"><Link to="/dashboard">Open token balance</Link></Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    { icon: WalletCards, title: 'Existing token', body: 'Available → reserved → available on one ledger.' },
                    { icon: KeyRound, title: 'No market keypair', body: 'The original treasury wallet backs the system; markets have no wallet or view key.' },
                    { icon: ShieldCheck, title: 'Legacy stays verifiable', body: 'Earlier on-chain payouts remain in the archive below.' },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div><p className="font-medium">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{body}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Opening liquidity</p><p className="mt-1 text-2xl font-mono font-semibold">$4.00</p><p className="mt-1 text-xs text-muted-foreground">Per eligible market, split by median no-vig bookmaker probability.</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Settlement fee</p><p className="mt-1 text-2xl font-mono font-semibold">0.4%</p><p className="mt-1 text-xs text-muted-foreground">Applied to distributed winnings only; not losses, draws or refunds.</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Withdrawals</p><p className="mt-1 text-2xl font-semibold">User controlled</p><p className="mt-1 text-xs text-muted-foreground">Settlement is internal; an XMR transaction occurs when you withdraw the token balance.</p></CardContent></Card>
          </div>

          <section className="mt-10" aria-labelledby="v2-settlements-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="v2-settlements-title" className="text-2xl font-semibold">TXN settlements</h2>
                <p className="mt-1 text-sm text-muted-foreground">Public, account-free history. Token identifiers are never exposed.</p>
              </div>
              <Badge variant="outline">{stats.settled} settled · {dollars(stats.returnedCents)} returned</Badge>
            </div>

            {loading ? (
              <Card className="border-dashed"><CardContent className="flex items-center justify-center gap-2 py-14 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading settlements…</CardContent></Card>
            ) : error ? (
              <Card className="border-destructive/40"><CardContent className="py-10 text-center"><p className="text-destructive">{error}</p><Button className="mt-4" variant="outline" onClick={() => void fetchPayouts(true)}>Try again</Button></CardContent></Card>
            ) : v2Payouts.length === 0 ? (
              <Card className="border-dashed bg-card/40"><CardContent className="py-12 text-center"><CircleDollarSign className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No v2 markets have settled yet</h3><p className="mt-2 text-sm text-muted-foreground">The first results will appear here automatically; no payout action is required.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {v2Payouts.map((entry) => {
                  const status = statusLabel(entry.status);
                  const profit = entry.payout_cents - entry.stake_cents;
                  return (
                    <Card key={entry.bet_id} className="bg-card/60">
                      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge className={status.style} variant="outline">{status.label}</Badge>
                            <Badge variant="outline">{entry.side}</Badge>
                            <span className="text-xs text-muted-foreground">Outcome {entry.outcome}</span>
                          </div>
                          <p className="truncate font-medium">{entry.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.resolved_at)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-5 text-right text-sm">
                          <div><p className="text-xs text-muted-foreground">Stake</p><p className="font-mono">{dollars(entry.stake_cents)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Returned</p><p className="font-mono">{dollars(entry.payout_cents)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Net</p><p className={cn('font-mono font-semibold', profit > 0 && 'text-emerald-400', profit < 0 && 'text-red-400')}>{profit > 0 ? '+' : ''}{dollars(profit)}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-12" aria-labelledby="legacy-archive-title">
            <Card className="border-border/60 bg-card/30">
              <CardHeader>
                <CardTitle id="legacy-archive-title" className="flex items-center gap-2 text-xl"><History className="h-5 w-5 text-muted-foreground" /> Legacy XMR payout archive</CardTitle>
                <p className="text-sm text-muted-foreground">Read-only history from the retired per-market wallet model. These records are preserved, not migrated into v2.</p>
              </CardHeader>
              <CardContent>
                {legacyPayouts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No legacy payout records.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {legacyPayouts.slice(0, 100).map((entry) => (
                      <div key={entry.bet_id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{entry.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.resolved_at)} · {entry.side}</p>
                        </div>
                        <div className="text-sm"><span className="text-muted-foreground">Stake </span><span className="font-mono">{entry.stake_xmr.toFixed(4)} XMR</span></div>
                        <div className="text-sm"><span className="text-muted-foreground">Payout </span><span className="font-mono">{entry.payout_xmr.toFixed(4)} XMR</span></div>
                        {entry.tx_hash && (
                          <a className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={`${XMR_EXPLORER_URL}/${entry.tx_hash}`} target="_blank" rel="noreferrer">Transaction <ExternalLink className="h-3.5 w-3.5" /></a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </section>
      </main>

      <Footer />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw token balance</DialogTitle>
            <DialogDescription>Convert available dollars to XMR at the current server price and send them from the original treasury wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-v2-amount">Amount in USD</Label>
              <Input id="withdraw-v2-amount" type="number" min="1" step="0.01" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} />
              <p className="text-xs text-muted-foreground">Available: ${balance.toFixed(2)} · Minimum: $1.00</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-v2-address">Monero address</Label>
              <Input id="withdraw-v2-address" className="font-mono text-xs" value={withdrawAddress} onChange={(event) => setWithdrawAddress(event.target.value)} placeholder="4… or 8…" />
            </div>
            <p className="text-xs text-muted-foreground">0.5% is retained from the XMR amount for network-fee and price-movement coverage. The full dollar amount is reserved once you confirm.</p>
            <Button className="w-full" disabled={withdrawing} onClick={() => void submitWithdrawal()}>
              {withdrawing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Queueing…</> : 'Confirm withdrawal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
