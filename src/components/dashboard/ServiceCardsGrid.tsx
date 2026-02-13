import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthFactorBadge } from '@/components/lending/HealthFactorBadge';
import { formatUsd, parseAmount } from '@/lib/lending';
import { TrendingUp, Zap, Bot, ArrowLeftRight, ShoppingBag, Landmark, ArrowRight, ExternalLink } from 'lucide-react';
import type { Portfolio } from '@/lib/lending';

interface ServiceCardsGridProps {
  lendingPortfolio: Portfolio | null;
  lendingPrices: Record<string, string>;
  lendingError?: boolean;
  balance?: number;
}

/* ─── Tier Badges ──────────────────────────────────────── */

const TokenBadge = () => (
  <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-1.5 py-0">
    TOKEN BALANCE
  </Badge>
);

const StandaloneBadge = () => (
  <Badge variant="outline" className="text-[10px] font-medium border-blue-500/40 text-blue-400 bg-blue-500/10 px-1.5 py-0">
    STANDALONE XMR
  </Badge>
);

const ExternalBadge = () => (
  <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/40 text-muted-foreground bg-muted/30 px-1.5 py-0">
    EXTERNAL
  </Badge>
);

/* ─── Component ────────────────────────────────────────── */

export const ServiceCardsGrid = ({ lendingPortfolio, lendingPrices, lendingError, balance = 0 }: ServiceCardsGridProps) => {
  // Calculate lending totals
  const totalSupplied = lendingPortfolio?.supplies.reduce((sum, s) => {
    const price = parseAmount(lendingPrices[s.asset] || '0');
    return sum + parseAmount(s.current_balance) * price;
  }, 0) || 0;

  const totalBorrowed = lendingPortfolio?.borrows.reduce((sum, b) => {
    const parts = b.borrowed.split(' ');
    const amount = parseAmount(parts[0]);
    const asset = parts[1] || '';
    const price = parseAmount(lendingPrices[asset] || '0');
    return sum + amount * price;
  }, 0) || 0;

  const worstHF = lendingPortfolio?.borrows.reduce((min, b) => {
    const hf = parseFloat(b.health_factor);
    return hf < min ? hf : min;
  }, Infinity) || Infinity;

  const hasLendingPositions = (lendingPortfolio?.supplies.length || 0) > 0 || (lendingPortfolio?.borrows.length || 0) > 0;

  return (
    <div className="space-y-6 mb-8">
      {/* ─── Tier 1: Token-Powered ─────────────────────── */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Your Services</h2>
          <span className="text-xs text-muted-foreground">Token Balance: <span className="font-mono font-semibold text-emerald-400">${balance.toFixed(2)}</span></span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">These services use your token balance</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lending */}
          <Card className="border-l-[3px] border-l-emerald-500 hover:border-l-emerald-400 transition-colors">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-semibold">Lending</span>
                <TokenBadge />
              </div>
              {lendingError ? (
                <p className="text-xs text-muted-foreground">Could not load lending data</p>
              ) : hasLendingPositions ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplied</span>
                    <span className="font-mono text-emerald-400">{formatUsd(totalSupplied)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Borrowed</span>
                    <span className="font-mono text-amber-400">{formatUsd(totalBorrowed)}</span>
                  </div>
                  {worstHF < Infinity && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Health</span>
                      <HealthFactorBadge value={worstHF} size="sm" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No lending positions yet — <Link to="/lending" className="text-primary hover:underline">start earning yield</Link></p>
              )}
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/lending/portfolio">View Details <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Flash Markets */}
          <Card className="border-l-[3px] border-l-emerald-500 hover:border-l-emerald-400 transition-colors">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="font-semibold">Flash Markets</span>
                <TokenBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                Quick-resolution crypto price predictions. 5-minute markets powered by your token balance.
              </p>
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/flash">View Flash <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Services */}
          <Card className="border-l-[3px] border-l-emerald-500 hover:border-l-emerald-400 transition-colors">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <span className="font-semibold">AI Services</span>
                <TokenBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                Voice cloning, text-to-speech, and AI chat — powered by your token balance.
              </p>
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/ai">View AI Hub <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card className="border-l-[3px] border-l-emerald-500 hover:border-l-emerald-400 transition-colors">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-semibold">Marketplace</span>
                <TokenBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                Buy and sell products and services using your token balance.
              </p>
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/browse">Browse Market <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Tier 2 & 3: Other Services ────────────────── */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-1">Other Services</h2>
        <p className="text-xs text-muted-foreground mb-4">Independent services with separate funding</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Predictions — Standalone */}
          <Card className="border-l-[3px] border-l-blue-500 hover:border-l-blue-400 transition-colors">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-semibold">Predictions</span>
                <StandaloneBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                Each bet generates its own XMR deposit address. Winnings are paid out to your payout address. Not linked to your token balance.
              </p>
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/predict">View Markets <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Swaps — External */}
          <Card className="border-l-[3px] border-l-muted-foreground/40 hover:border-l-muted-foreground/60 transition-colors bg-card/80">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-semibold">Swaps</span>
                <ExternalBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                No-KYC crypto swaps via Trocador. Exchange 300+ coins privately. Not linked to your token.
              </p>
              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/swaps">Swap Now <ExternalLink className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
