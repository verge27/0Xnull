import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HealthFactorBadge } from '@/components/lending/HealthFactorBadge';
import { formatUsd, parseAmount } from '@/lib/lending';
import { TrendingUp, Zap, Bot, ArrowLeftRight, ShoppingBag, Landmark, ArrowRight, Info } from 'lucide-react';
import type { Portfolio } from '@/lib/lending';

interface ServiceCardsGridProps {
  lendingPortfolio: Portfolio | null;
  lendingPrices: Record<string, string>;
  lendingError?: boolean;
}

export const ServiceCardsGrid = ({ lendingPortfolio, lendingPrices, lendingError }: ServiceCardsGridProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {/* Lending */}
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-green-400" />
            </div>
            <span className="font-semibold">Lending</span>
          </div>
          {lendingError ? (
            <p className="text-xs text-muted-foreground">Could not load lending data</p>
          ) : hasLendingPositions ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplied</span>
                <span className="font-mono text-green-400">{formatUsd(totalSupplied)}</span>
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

      {/* Predictions */}
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold">Predictions</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Prediction markets use standalone XMR wallets — not your token balance. Each bet generates a unique deposit address.
            </p>
            <div className="p-2 rounded bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Bets are placed by sending XMR directly. Winnings are paid out to your payout address. Track active bets and payouts from the predictions page.
                </p>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="w-full gap-1">
            <Link to="/predict">View Markets <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* Flash Bets */}
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="font-semibold">Flash Markets</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Quick-resolution crypto price predictions. Same standalone XMR wallet model as regular predictions.
          </p>
          <Button size="sm" variant="outline" asChild className="w-full gap-1">
            <Link to="/flash">View Flash <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* AI Services */}
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold">AI Services</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Voice cloning, text-to-speech, and AI chat — powered by your token balance.
          </p>
          <Button size="sm" variant="outline" asChild className="w-full gap-1">
            <Link to="/ai">View AI Hub <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* Swaps */}
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-semibold">Swaps</span>
          </div>
          <p className="text-xs text-muted-foreground">
            No-KYC crypto swaps via Trocador integration. Exchange between 300+ coins privately.
          </p>
          <Button size="sm" variant="outline" asChild className="w-full gap-1">
            <Link to="/swaps">Swap Now <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* Marketplace */}
      <Card className="hover:border-primary/30 transition-colors opacity-60">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="font-semibold">Marketplace</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Token-based marketplace integration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
