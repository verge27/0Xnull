import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Loader2, ShieldCheck, Wallet, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToken } from '@/hooks/useToken';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { api } from '@/services/api';
import { useSEO } from '@/hooks/useSEO';
import { addressError } from '@/lib/addressValidation';
import { roundUpXmr } from '@/lib/utils';

const MIN_USD = 1;
const HISTORY_KEY = 'xnull_token_withdrawals';
const HISTORY_LIMIT = 10;
const POLL_INTERVAL_MS = 3000;
const POLL_ATTEMPTS = 8;

interface QueuedWithdrawal {
  withdrawal_id: string;
  amount_usd?: number;
  amount_xmr?: number;
  status?: string;
}

interface WithdrawalRecord extends QueuedWithdrawal {
  created_at: string;
  address: string;
}

const loadHistory = (): WithdrawalRecord[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
};

const shortAddress = (value: string) =>
  value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;

const TokenCashout = () => {
  useSEO({
    title: 'Withdraw XMR from your token balance - 0xNull',
    description: 'Withdraw your 0xNull token balance to any Monero address. No accounts, no KYC, queued then broadcast.',
  });

  const { token, balance, hasToken, refreshBalance } = useToken();
  const { xmrUsdRate } = useExchangeRate();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState<QueuedWithdrawal | null>(null);
  const [history, setHistory] = useState<WithdrawalRecord[]>(() => loadHistory());
  // Keep the same key across retries of an uncertain request.
  const idempotencyKey = useRef<ReturnType<typeof crypto.randomUUID> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => () => { cancelled.current = true; }, []);

  const amountNum = parseFloat(amount);
  const addrError = addressError('XMR', address.trim());
  const rate = xmrUsdRate || 0;
  const feeRate = 0.005;

  const breakdown = useMemo(() => {
    if (!amountNum || Number.isNaN(amountNum) || amountNum <= 0 || !rate) return null;
    const gross = amountNum;
    const fee = gross * feeRate;
    const net = gross - fee;
    const xmr = roundUpXmr(net / rate, 10);
    return { gross, fee, net, rate, xmr };
  }, [amountNum, rate]);

  const estimatedXmr = breakdown ? breakdown.xmr : null;

  const amountError = !amount
    ? null
    : Number.isNaN(amountNum)
      ? 'Enter a valid amount'
      : amountNum < MIN_USD
        ? `Minimum withdrawal is $${MIN_USD.toFixed(2)}`
        : amountNum > balance
          ? 'Amount exceeds your available balance'
          : null;

  const busy = submitting || syncing;
  const canSubmit =
    !!token && !!address.trim() && !addrError && !!amount && !amountError && !busy;

  const recordWithdrawal = useCallback((record: WithdrawalRecord) => {
    setHistory((prev) => {
      const next = [record, ...prev.filter((h) => h.withdrawal_id !== record.withdrawal_id)]
        .slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable; history stays in memory for this session.
      }
      return next;
    });
  }, []);

  // Poll the balance briefly so the new available balance settles reliably.
  const pollBalance = useCallback(async (before: number) => {
    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      const value = await refreshBalance();
      if (cancelled.current) return;
      if (typeof value === 'number' && value !== before) return;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, [refreshBalance]);

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setError(null);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const balanceBefore = balance;
    try {
      const res = (await api.queueTokenWithdrawal(
        token,
        address.trim(),
        Math.round(amountNum * 100),
        idempotencyKey.current,
      )) as QueuedWithdrawal;
      idempotencyKey.current = null;
      setQueued(res);
      recordWithdrawal({
        ...res,
        amount_usd: res.amount_usd ?? amountNum,
        address: address.trim(),
        created_at: new Date().toISOString(),
      });
      setSubmitting(false);
      setSyncing(true);
      await pollBalance(balanceBefore);
      toast.success(`Withdrawal ${res.withdrawal_id} is ${res.status ?? 'queued'}`, {
        description: 'Your balance has been refreshed.',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Withdrawal could not be queued';
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Banknote className="w-7 h-7 text-primary" /> Withdraw XMR
          </h1>
          <p className="text-muted-foreground mt-2">
            Send your token balance to any Monero address. Looking for bank or card payouts? Use{' '}
            <Link to="/cashout" className="text-primary hover:underline">fiat cash out</Link>.
          </p>
        </header>

        {!hasToken ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Wallet className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">You need a 0xNull token to withdraw.</p>
              <Button asChild><Link to="/dashboard">Go to your token</Link></Button>
            </CardContent>
          </Card>
        ) : queued ? (
          <Card className="border-primary/40">
            <CardContent className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Withdrawal queued</h2>
              <p className="text-sm text-muted-foreground">
                Queued for broadcast. It has not been sent on-chain yet.
              </p>
              <p className="font-mono text-sm break-all">
                Withdrawal ID: {queued.withdrawal_id}
              </p>
              {syncing ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Refreshing your balance…
                </p>
              ) : (
                <Button variant="outline" onClick={() => { setQueued(null); setAmount(''); setAddress(''); }}>
                  Make another withdrawal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Token balance</span>
                <span className="font-mono text-primary">${balance.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Amount (USD / TXN)</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setAmount(balance.toFixed(2))}
                  >
                    Maximum
                  </button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={MIN_USD}
                  max={balance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum ${MIN_USD.toFixed(2)}. Available ${balance.toFixed(2)}.
                </p>
                {amountError && <p className="text-xs text-destructive mt-1">{amountError}</p>}
              </div>

              <div>
                <Label htmlFor="address">Monero destination address</Label>
                <Input
                  id="address"
                  placeholder="Standard, subaddress or integrated address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="font-mono text-xs"
                  disabled={busy}
                />
                {addrError && <p className="text-xs text-destructive mt-1">{addrError}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Standard, subaddress and integrated destinations are accepted; the backend has the final say.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal amount</span>
                  <span className="font-mono">{breakdown ? `$${breakdown.gross.toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">0.5% deduction</span>
                  <span className="font-mono text-destructive">
                    {breakdown ? `-$${breakdown.fee.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Net after deduction</span>
                  <span className="font-mono">{breakdown ? `$${breakdown.net.toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Live XMR/USD rate</span>
                  <span className="font-mono">{breakdown ? `$${breakdown.rate.toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-medium">Estimated XMR received</span>
                  <span className="font-mono font-medium">
                    {breakdown ? `${breakdown.xmr} XMR` : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Net TXN/USD is converted at the live XMR price when the withdrawal is processed.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive whitespace-pre-wrap break-words">{error}</p>
              )}

              <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit} aria-busy={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? 'Queueing withdrawal…' : syncing ? 'Refreshing balance…' : 'Confirm withdrawal'}
              </Button>

              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Confirming queues the withdrawal. Nothing is broadcast to the Monero network until the payout worker picks it up.
              </p>
            </CardContent>
          </Card>
        )}

        {hasToken && history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" /> Recent withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.withdrawal_id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs break-all">{item.withdrawal_id}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {shortAddress(item.address)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {typeof item.amount_usd === 'number' && (
                      <p className="font-mono text-sm">${item.amount_usd.toFixed(2)}</p>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {item.status ?? 'queued'}
                    </Badge>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                History is stored on this device only, so it stays private and clears when you clear site data.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TokenCashout;
