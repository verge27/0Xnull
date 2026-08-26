import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Loader2, ShieldCheck, Wallet, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToken } from '@/hooks/useToken';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { api } from '@/services/api';
import { useSEO } from '@/hooks/useSEO';
import { addressError } from '@/lib/addressValidation';
import { roundUpXmr } from '@/lib/utils';

const MIN_USD = 1;

interface QueuedWithdrawal {
  withdrawal_id: string;
  amount_usd?: number;
  amount_xmr?: number;
  status?: string;
}

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
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState<QueuedWithdrawal | null>(null);
  // Keep the same key across retries of an uncertain request.
  const idempotencyKey = useRef<string | null>(null);

  const amountNum = parseFloat(amount);
  const addrError = addressError('XMR', address.trim());
  const rate = xmrUsdRate || 0;
  const estimatedXmr = useMemo(() => {
    if (!amountNum || !rate) return null;
    return roundUpXmr(amountNum / rate, 10);
  }, [amountNum, rate]);

  const amountError = !amount
    ? null
    : Number.isNaN(amountNum)
      ? 'Enter a valid amount'
      : amountNum < MIN_USD
        ? `Minimum withdrawal is $${MIN_USD.toFixed(2)}`
        : amountNum > balance
          ? 'Amount exceeds your available balance'
          : null;

  const canSubmit =
    !!token && !!address.trim() && !addrError && !!amount && !amountError && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setError(null);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    try {
      const res = await api.queueTokenWithdrawal(
        token,
        address.trim(),
        Math.round(amountNum * 100),
        idempotencyKey.current,
      );
      setQueued(res as QueuedWithdrawal);
      idempotencyKey.current = null;
      refreshBalance();
    } catch (e) {
      // Backend validation messages are shown verbatim.
      setError(e instanceof Error ? e.message : 'Withdrawal could not be queued');
    } finally {
      setSubmitting(false);
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
              <Button variant="outline" onClick={() => { setQueued(null); setAmount(''); setAddress(''); }}>
                Make another withdrawal
              </Button>
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
                />
                {addrError && <p className="text-xs text-destructive mt-1">{addrError}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Standard, subaddress and integrated destinations are accepted; the backend has the final say.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated XMR received</span>
                  <span className="font-mono">
                    {estimatedXmr ? `${estimatedXmr} XMR` : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Converted at the live XMR price when the withdrawal is processed, minus the standard 0.5% deduction.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive whitespace-pre-wrap break-words">{error}</p>
              )}

              <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm withdrawal
              </Button>

              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Confirming queues the withdrawal. Nothing is broadcast to the Monero network until the payout worker picks it up.
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
