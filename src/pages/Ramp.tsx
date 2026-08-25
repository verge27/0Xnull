import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRightLeft, Bitcoin, CheckCircle2, ExternalLink, Info, Loader2, ShieldCheck, XCircle } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SubsiteLayout } from '@/components/SubsiteLayout';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CountryEligibility, RampEligibilityConfig } from '@/lib/rampEligibilityConfig';
import {
  ASSETS,
  FIATS,
  HODL_HODL_BITCOIN_ONLY,
  HODL_HODL_SAFETY,
  HODL_HODL_URL,
  PAYMENT_METHODS,
  evaluateDirectRoute,
  findCountry,
  isHodlHodlAllowed,
  loadRampConfig,
  requestDirectQuote,
  type QuoteResult,
  type RampSide,
} from '@/lib/rampRouting';
import { formatBlockerReasons, logRampEvent } from '@/lib/rampAnalytics';

const HodlHodlSafetyPanel = () => (
  <Card className="bg-card/40 border-border/50">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ShieldCheck className="h-4 w-4 text-primary" /> Before you trade on Hodl Hodl
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {HODL_HODL_SAFETY.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const HodlHodlCard = ({
  primary,
  asset,
  onRedirect,
}: {
  primary: boolean;
  asset: string;
  onRedirect: (target: string) => void;
}) => (
  <Card className={primary ? 'border-primary/50 bg-card/60' : 'bg-card/40 border-border/50'}>
    <CardHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Bitcoin className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{primary ? 'Peer-to-peer Bitcoin route' : 'Prefer peer-to-peer?'}</CardTitle>
        {primary && <Badge>Eligible route</Badge>}
      </div>
      <CardDescription>
        Eligible users can buy or sell Bitcoin directly with another person through Hodl Hodl. Bitcoin is protected by
        multisignature escrow while the buyer sends fiat payment directly to the seller.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {asset !== 'BTC' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Bitcoin only</AlertTitle>
          <AlertDescription>{HODL_HODL_BITCOIN_ONLY}</AlertDescription>
        </Alert>
      )}
      <HodlHodlSafetyPanel />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant={primary ? 'default' : 'outline'}>
          <a href={HODL_HODL_URL} target="_blank" rel="noopener noreferrer" onClick={() => onRedirect(HODL_HODL_URL)}>
            {primary ? 'Explore Hodl Hodl' : 'View Hodl Hodl offers'} <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/buy" onClick={() => onRedirect('/buy')}>See live offers on our buy page</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Hodl Hodl is a separate, non-custodial peer-to-peer marketplace. This link opens their website in a new tab and
        you leave 0xNull. We do not convert your asset for you.
      </p>
    </CardContent>
  </Card>
);

const Ramp = () => {
  useSEO({
    title: '0xNull | Fiat on and off ramp routing',
    description:
      'Answer four questions and see which fiat route works from your country: our direct ramp partner or the Hodl Hodl peer-to-peer Bitcoin marketplace.',
  });

  const [config, setConfig] = useState<RampEligibilityConfig | null>(null);
  const [side, setSide] = useState<RampSide>('buy');
  const [countryCode, setCountryCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [asset, setAsset] = useState('XMR');
  const [fiat, setFiat] = useState('EUR');
  const [amount, setAmount] = useState('200');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ country: CountryEligibility; quote: QuoteResult | null } | null>(null);

  useEffect(() => {
    loadRampConfig().then(setConfig);
  }, []);

  const countries = useMemo(() => config?.countries ?? [], [config]);
  const providerName = config?.fiatProviderName ?? 'our fiat partner';
  const selectedCountryName =
    countries.find((c) => c.code === countryCode)?.name ?? 'the country selected above';

  const runCheck = async () => {
    if (!config || !countryCode) return;
    setChecking(true);
    setResult(null);
    logRampEvent({
      event_type: 'route_check',
      side,
      country_code: countryCode,
      asset,
      fiat,
      payment_method: method,
      amount: Number(amount) > 0 ? Number(amount) : undefined,
    });
    const country = findCountry(config, countryCode);
    const decision = evaluateDirectRoute(country, providerName);
    let quote: QuoteResult | null = null;
    if (decision.jurisdictionAllowed) {
      const numeric = Number(amount);
      quote = await requestDirectQuote(side, asset, fiat, Number.isFinite(numeric) && numeric > 0 ? numeric : 100);
    }
    setResult({ country, quote });
    setChecking(false);

    const numericAmount = Number(amount);
    const hodlAllowedNow = isHodlHodlAllowed(country);
    const directOk = decision.jurisdictionAllowed && Boolean(quote?.ok);
    const blockerReason = formatBlockerReasons(decision.blockers);
    const quoteReason = !decision.jurisdictionAllowed
      ? ''
      : quote && !quote.ok
        ? `Quote: ${quote.error}`
        : '';
    const shownReason = directOk
      ? 'Recommended for your location'
      : [blockerReason, quoteReason].filter(Boolean).join(' | ') ||
        (hodlAllowedNow ? 'Direct ramp unavailable' : `Hodl Hodl: ${country.hodlhodl.reason}`);

    logRampEvent({
      event_type: 'route_decision',
      side,
      country_code: country.code,
      asset,
      fiat,
      payment_method: method,
      amount: Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : undefined,
      decision: directOk ? 'direct' : hodlAllowedNow ? 'hodlhodl' : 'none',
      direct_allowed: decision.jurisdictionAllowed,
      hodlhodl_allowed: hodlAllowedNow,
      quote_ok: quote ? quote.ok : undefined,
      provider: providerName,
      reason: shownReason,
      error_message: quote && !quote.ok ? quote.error : undefined,
    });
  };

  const logRedirect = (target: string, chosen: 'direct' | 'hodlhodl') =>
    logRampEvent({
      event_type: 'redirect',
      side,
      country_code: countryCode,
      asset,
      fiat,
      payment_method: method,
      decision: chosen,
      target_url: target,
      reason: chosen === 'direct' ? 'Recommended for your location' : 'Peer-to-peer Bitcoin route',
      provider: chosen === 'direct' ? providerName : 'Hodl Hodl',
    });

  const decision = result && config ? evaluateDirectRoute(result.country, providerName) : null;
  const directWorks = Boolean(decision?.jurisdictionAllowed && result?.quote?.ok);
  const hodlAllowed = result ? isHodlHodlAllowed(result.country) : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SubsiteLayout
        section="Fiat On/Off Ramp"
        sectionPath="/ramp"
        links={[
          { label: 'Route finder', to: '/ramp' },
          { label: 'Buy', to: '/buy' },
          { label: 'Cash out', to: '/cashout' },
          { label: 'Swaps', to: '/swaps' },
        ]}
      />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Fiat on and off ramp</h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Answer four questions and we will show the simplest route your jurisdiction permits. Nothing is sent
            anywhere until you choose a route and continue on the provider's own website.
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Route finder</CardTitle>
            <CardDescription>We use the country you confirm, never an inferred IP location.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ramp-side">Are you buying or selling?</Label>
                <Select value={side} onValueChange={(v) => setSide(v as RampSide)}>
                  <SelectTrigger id="ramp-side"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buying crypto</SelectItem>
                    <SelectItem value="sell">Selling crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp-country">Which country are you located in?</Label>
                <Select value={countryCode} onValueChange={(v) => { setCountryCode(v); setConfirmed(false); setResult(null); }}>
                  <SelectTrigger id="ramp-country">
                    <SelectValue placeholder={config ? 'Select country' : 'Loading…'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp-asset">Crypto asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger id="ramp-asset"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp-fiat">Fiat currency</Label>
                <Select value={fiat} onValueChange={setFiat}>
                  <SelectTrigger id="ramp-fiat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp-method">Preferred payment or payout method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="ramp-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp-amount">Approximate amount ({side === 'buy' ? fiat : asset})</Label>
                <Input
                  id="ramp-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 p-3">
              <Checkbox
                id="ramp-confirm"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                disabled={!countryCode}
              />
              <Label htmlFor="ramp-confirm" className="text-sm font-normal leading-relaxed text-muted-foreground">
                I confirm I am located in{' '}
                <span className="text-foreground font-medium">
                  {selectedCountryName}
                </span>{' '}
                and that I will follow the law that applies there.
              </Label>
            </div>

            <Button onClick={runCheck} disabled={!config || !countryCode || !confirmed || checking} size="lg">
              {checking ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking routes…</>) : 'Show my routes'}
            </Button>

            <p className="text-xs text-muted-foreground">
              Your preferred method is a filter for what to look for. We do not promise a payment method until it
              appears in a live provider quote or a Hodl Hodl offer.
            </p>
          </CardContent>
        </Card>

        {result && decision && (
          <section className="space-y-6" aria-live="polite">
            {directWorks && (
              <Card className="border-primary/50 bg-card/60">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Recommended for your location</CardTitle>
                    <Badge>Live quote returned</Badge>
                  </div>
                  <CardDescription>
                    Use our fiat-ramp partner to buy or sell crypto using the payment and payout methods shown in your
                    quote. You will complete payment and any required verification on the provider's website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground font-mono">
                    Indicative quote: {amount} {side === 'buy' ? fiat : asset} → {result.quote?.estimate}{' '}
                    {side === 'buy' ? asset : fiat}
                  </p>
                  <Button asChild size="lg">
                    <Link
                      to={side === 'buy' ? '/buy' : '/cashout'}
                      onClick={() => logRedirect(side === 'buy' ? '/buy' : '/cashout', 'direct')}
                    >
                      Continue with ramp provider
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    The provider is {providerName} via SimpleSwap. Checkout happens on their site, in a new tab, and
                    requires identity verification.
                  </p>
                </CardContent>
              </Card>
            )}

            {!directWorks && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Direct ramp unavailable</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Our direct fiat provider is not available for your location or could not return a live quote. You
                    may still be able to use Hodl Hodl's peer-to-peer Bitcoin marketplace, subject to its terms,
                    available offers and local law.
                  </p>
                  <ul className="text-xs space-y-1">
                    {decision.blockers.map((b) => (
                      <li key={b.provider} className="font-mono">
                        {b.provider}: {b.restriction.reason} — source: {b.restriction.source}, reviewed{' '}
                        {b.restriction.lastReviewedAt}
                      </li>
                    ))}
                    {decision.jurisdictionAllowed && result.quote && !result.quote.ok && (
                      <li className="font-mono">Quote: {result.quote.error}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {hodlAllowed ? (
              <HodlHodlCard
                primary={!directWorks}
                asset={asset}
                onRedirect={(target) => logRedirect(target, 'hodlhodl')}
              />
            ) : (
              <Card className="border-destructive/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-lg">No supported route for {result.country.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Neither our direct fiat provider nor Hodl Hodl permits use from your jurisdiction, so we cannot
                    route you anywhere today. We will not suggest ways around geographic restrictions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground font-mono">
                  Hodl Hodl: {result.country.hodlhodl.reason} — source: {result.country.hodlhodl.source}, reviewed{' '}
                  {result.country.hodlhodl.lastReviewedAt}
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground">
              Eligibility data version {config?.version}. Restriction lists are worded as "including but not limited
              to", so a country's absence from a list is not a guarantee of service.
            </p>
          </section>
        )}

        <section className="mt-10">
          <Card className="bg-card/40 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="h-4 w-4 text-primary" /> Already know your route?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="outline"><Link to="/buy">Buy crypto</Link></Button>
              <Button asChild variant="outline"><Link to="/cashout">Cash out</Link></Button>
              <Button asChild variant="outline"><Link to="/swaps">Swap BTC to XMR</Link></Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Ramp;
