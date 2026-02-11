import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetIcon } from '@/components/lending/AssetIcon';
import { HealthFactorBadge } from '@/components/lending/HealthFactorBadge';
import { DepositFlow } from '@/components/lending/DepositFlow';
import { WithdrawModal } from '@/components/lending/WithdrawModal';
import { BorrowFlow } from '@/components/lending/BorrowFlow';
import { RepayModal } from '@/components/lending/RepayModal';
import { LendingTokenPrompt } from '@/components/lending/LendingTokenPrompt';
import {
  lendingApi, type Portfolio, type SupplyPosition, type BorrowPosition,
  parseAmount, formatUsd,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { ArrowLeft, TrendingUp, Loader2, RefreshCw, Plus } from 'lucide-react';

const LendingDashboard = () => {
  const { token, setCustomToken } = useToken();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDeposit, setShowDeposit] = useState(false);
  const [showBorrow, setShowBorrow] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<SupplyPosition | null>(null);
  const [repayTarget, setRepayTarget] = useState<BorrowPosition | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [portfolioData, priceData] = await Promise.all([
        lendingApi.getPortfolio(token),
        lendingApi.getPrices().catch(() => ({})),
      ]);
      setPortfolio(portfolioData);
      setPrices(priceData);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load portfolio';
      if (msg.includes('401') || msg.includes('Invalid') || msg.includes('expired')) {
        setError('Invalid or expired token');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPortfolio();
      const interval = setInterval(fetchPortfolio, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchPortfolio, token]);

  const handleTokenSubmit = async (newToken: string) => {
    await setCustomToken(newToken);
  };

  // Compute totals
  const totalSuppliedUsd = portfolio?.supplies.reduce((sum, s) => {
    const price = parseAmount(prices[s.asset] || '0');
    return sum + parseAmount(s.current_balance) * price;
  }, 0) || 0;

  const totalBorrowedUsd = portfolio?.borrows.reduce((sum, b) => {
    // Parse "15000 USDC" format
    const parts = b.borrowed.split(' ');
    const amount = parseAmount(parts[0]);
    const asset = parts[1] || '';
    const price = parseAmount(prices[asset] || '0');
    return sum + amount * price;
  }, 0) || 0;

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <Link to="/lending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> All Markets
          </Link>
          <LendingTokenPrompt onSubmit={handleTokenSubmit} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/lending" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPortfolio} disabled={loading} className="gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-6">
            {error}
          </div>
        )}

        {loading && !portfolio && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {portfolio && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Supplied</p>
                  <p className="text-2xl font-bold font-mono text-green-400">{formatUsd(totalSuppliedUsd)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Borrowed</p>
                  <p className="text-2xl font-bold font-mono text-amber-400">{formatUsd(totalBorrowedUsd)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Position</p>
                  <p className={`text-2xl font-bold font-mono ${totalSuppliedUsd - totalBorrowedUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatUsd(totalSuppliedUsd - totalBorrowedUsd)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Supply Positions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Supply Positions</CardTitle>
                <Button size="sm" onClick={() => setShowDeposit(true)} className="gap-1 h-7">
                  <Plus className="w-3 h-3" /> Supply
                </Button>
              </CardHeader>
              <CardContent>
                {portfolio.supplies.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No supply positions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="text-left py-2 px-2">Asset</th>
                          <th className="text-right py-2 px-2">Deposited</th>
                          <th className="text-right py-2 px-2">Current Balance</th>
                          <th className="text-right py-2 px-2">Interest Earned</th>
                          <th className="text-right py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.supplies.map((s) => (
                          <tr key={s.id} className="border-b border-border/50">
                            <td className="py-3 px-2"><AssetIcon asset={s.asset} showName size="sm" /></td>
                            <td className="py-3 px-2 text-right font-mono">{s.deposited}</td>
                            <td className="py-3 px-2 text-right font-mono">{s.current_balance}</td>
                            <td className="py-3 px-2 text-right font-mono text-green-400">+{s.interest_earned}</td>
                            <td className="py-3 px-2 text-right">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setWithdrawTarget(s)}>
                                Withdraw
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Borrow Positions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Borrow Positions</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowBorrow(true)} className="gap-1 h-7">
                  <Plus className="w-3 h-3" /> Borrow
                </Button>
              </CardHeader>
              <CardContent>
                {portfolio.borrows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No borrow positions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="text-left py-2 px-2">Collateral</th>
                          <th className="text-right py-2 px-2">Borrowed</th>
                          <th className="text-right py-2 px-2">Current Debt</th>
                          <th className="text-right py-2 px-2">Health Factor</th>
                          <th className="text-right py-2 px-2 hidden sm:table-cell">Source</th>
                          <th className="text-right py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.borrows.map((b) => (
                          <tr key={b.id} className="border-b border-border/50">
                            <td className="py-3 px-2 font-mono text-sm">{b.collateral}</td>
                            <td className="py-3 px-2 text-right font-mono">{b.borrowed}</td>
                            <td className="py-3 px-2 text-right font-mono font-bold">{b.current_debt}</td>
                            <td className="py-3 px-2 text-right">
                              <HealthFactorBadge value={parseAmount(b.health_factor)} size="sm" />
                            </td>
                            <td className="py-3 px-2 text-right hidden sm:table-cell">
                              <Badge variant="outline" className="text-xs">{b.source === 'aave' ? 'Aave V3' : 'XMR Pool'}</Badge>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRepayTarget(b)}>
                                Repay
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />

      {/* Modals */}
      <DepositFlow open={showDeposit} onClose={() => setShowDeposit(false)} token={token} />
      <BorrowFlow
        open={showBorrow}
        onClose={() => setShowBorrow(false)}
        token={token}
        prices={prices}
        onSuccess={fetchPortfolio}
      />
      {withdrawTarget && (
        <WithdrawModal
          open={!!withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          token={token}
          asset={withdrawTarget.asset}
          currentBalance={withdrawTarget.current_balance}
          interestEarned={withdrawTarget.interest_earned}
          onSuccess={fetchPortfolio}
        />
      )}
      {repayTarget && (
        <RepayModal
          open={!!repayTarget}
          onClose={() => setRepayTarget(null)}
          token={token}
          positionId={repayTarget.id}
          collateral={repayTarget.collateral}
          borrowed={repayTarget.borrowed}
          currentDebt={repayTarget.current_debt}
          healthFactor={repayTarget.health_factor}
          onSuccess={fetchPortfolio}
        />
      )}
    </div>
  );
};

export default LendingDashboard;
