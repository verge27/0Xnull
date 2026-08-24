import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw, ShieldCheck, Clock, Star, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const REFERRAL_URL = 'https://hodlhodl.com/join/LNNJ';
const CURRENCIES = ['GBP', 'EUR', 'USD', 'CHF', 'CAD', 'AUD'];

interface Offer {
  id: string;
  title: string;
  price: number;
  currency_code: string;
  min_amount: string | null;
  max_amount: string | null;
  payment_method_instructions: { name: string; type: string | null }[];
  seller: {
    login: string;
    rating: string | number | null;
    trades_count: number;
    online_status: string;
    strong_hodler: boolean;
    average_release_time_minutes: number | null;
  };
}

const STEPS = [
  { n: 1, text: 'Open Hodl Hodl via our link. Sign up with an email — no ID, no selfie.' },
  { n: 2, text: "Pick an offer below (or on their site). Filter for sellers who don't ask for verification — some individuals do, regardless of platform policy." },
  { n: 3, text: 'Seller locks BTC in a 2-of-3 multisig escrow. You verify the address. Only then do you pay them.' },
  { n: 4, text: 'Pay by the method in the offer — bank transfer, Revolut, cash, whatever the seller lists. Mark as paid.' },
  { n: 5, text: 'Seller releases. BTC lands in your wallet. Come back here and swap BTC → XMR.' },
];

const fmtAmount = (v: string | null) => {
  if (!v) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v;
};

const BuyNoKyc = () => {
  useSEO();
  const [currency, setCurrency] = useState('GBP');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (cur: string) => {
    setLoading(true);
    setFailed(false);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hodlhodl-offers?currency=${cur}`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list: Offer[] = Array.isArray(data?.offers) ? data.offers : [];
      setOffers(list);
      setFailed(false);
    } catch {
      setOffers([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currency);
  }, [currency, load]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Buy crypto without an ID.</h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Every card on-ramp we tested wants your passport. This is the lowest-KYC route we could find: you buy
            bitcoin from another person on Hodl Hodl, the coins sit in a 2-of-3 multisig escrow that you hold a key to
            and nobody asks who you are. Then you swap to Monero here.
          </p>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mt-4">
            <span className="text-foreground font-medium">Why bitcoin first, not Monero directly?</span> Hodl Hodl only
            trades BTC. That's fine — BTC in a multisig escrow can't be frozen by an exchange and the swap to XMR takes
            a few minutes on this site. Direct fiat → XMR markets exist but are thin and currently unstable; BTC is the
            liquid door in.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer">
                Open on Hodl Hodl <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </header>

        {/* Steps */}
        <section className="mb-10" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-bold mb-4">How it works</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {STEPS.map((s) => (
              <Card key={s.n} className="bg-card/40 border-border/50">
                <CardContent className="p-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold mb-3">
                    {s.n}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Honesty box */}
        <section className="mb-10">
          <Card className="bg-card/30 border-border/40">
            <CardContent className="p-5 space-y-2 text-sm text-muted-foreground">
              <p>Hodl Hodl fee: max 0.75% per trade, lower via our link. Expect a premium over spot — the more private the payment rail, the higher it is.</p>
              <p>The BTC leg is on a transparent chain. The swap to XMR is where the trail ends. If you need the trail to end sooner, buy with cash.</p>
              <p>We earn a small share of Hodl Hodl's fee when you trade through our link. It costs you nothing extra.</p>
              <p>Escrow protects against the seller vanishing. It does not protect you from paying the wrong person — verify the escrow address before you send fiat.</p>
            </CardContent>
          </Card>
        </section>

        {/* Offer book */}
        <section className="mb-12" aria-labelledby="offers">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="offers" className="text-2xl font-bold">Live offers</h2>
            <div className="flex items-center gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[130px]" aria-label="Select fiat currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" aria-label="Refresh offers" onClick={() => load(currency)}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          )}

          {!loading && failed && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Live offers unavailable — open Hodl Hodl directly.
                <Button asChild size="sm" variant="outline">
                  <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer">
                    Open on Hodl Hodl <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !failed && offers.length === 0 && (
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No live {currency} sell offers right now. Try another currency or check Hodl Hodl directly.
                </p>
                <Button asChild size="sm" variant="outline">
                  <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer">
                    Open on Hodl Hodl <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !failed && offers.length > 0 && (
            <div className="space-y-3">
              {offers.map((o) => (
                <Card key={o.id} className="bg-card/40 border-border/50">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold font-mono">{o.seller.login}</span>
                        {o.seller.strong_hodler && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" /> Strong hodler
                          </Badge>
                        )}
                        <Badge variant={o.seller.online_status === 'online' ? 'default' : 'outline'}>
                          {o.seller.online_status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {o.seller.rating ? Number(o.seller.rating).toFixed(2) : 'new'} · {o.seller.trades_count} trades
                        </span>
                        {o.seller.average_release_time_minutes != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> ~{o.seller.average_release_time_minutes} min release
                          </span>
                        )}
                        <span className="font-mono">ID {o.id}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {o.payment_method_instructions.slice(0, 4).map((p, i) => (
                          <Badge key={`${o.id}-pm-${i}`} variant="outline" className="text-xs">{p.name}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="md:text-right shrink-0">
                      <div className="font-mono text-lg font-bold">
                        {o.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} {o.currency_code}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {fmtAmount(o.min_amount)} – {fmtAmount(o.max_amount)} {o.currency_code}
                      </div>
                      <Button asChild size="sm" className="mt-2 w-full md:w-auto">
                        <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer">
                          Open on Hodl Hodl <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Hand-off to swap */}
        <section className="mb-10">
          <Card className="bg-card/40 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" /> Got your BTC? Swap it to XMR
              </CardTitle>
              <CardDescription>
                Use the on-site swap to convert Bitcoin to Monero. No account, no sign-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild size="lg">
                <Link to="/swaps?from=btc&to=xmr">Swap BTC → XMR</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Going the other way? Use the <Link to="/cashout" className="text-primary hover:underline">off-ramp</Link> to move XMR out.
              </p>
            </CardContent>
          </Card>
        </section>

        <p className="text-sm text-muted-foreground text-center">
          No accounts. No KYC. No JavaScript trackers. Just a link and an escrow.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default BuyNoKyc;
