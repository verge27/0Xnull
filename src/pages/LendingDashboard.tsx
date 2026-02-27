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
  type LendingPool, parseAmount, formatUsd, formatBalance, formatInterest,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { ArrowLeft, TrendingUp, Loader2, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import { EarnTab } from '@/components/earn/EarnTab';

const PORTFOLIO_CACHE_KEY = 'lending_portfolio_cache';
const PORTFOLIO_CACHE_TTL = 5 * 60 * 1000;

function writePortfolioCache(token: string, data: Portfolio) {
  try {
    localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify({ token, ts: Date.now(), data }));
  } catch { /* ignore */ }
}

function readPortfolioCache(token: string): Portfolio | null {
  try {
    const raw = localStorage.getItem(PORTFOLIO_CACHE_KEY);
    if (!raw) return null;
    const { token: cachedToken, ts, data } = JSON.parse(raw);
    if (cachedToken !== token || Date.now() - ts > PORTFOLIO_CACHE_TTL) return null;
    return data as Portfolio;
  } catch { return null; }
}

const LendingDashboard = () => {
  const { token, balance, setCustomToken } = useToken();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  

  // Modal states
  const [showDeposit, setShowDeposit] = useState(false);
  const [showBorrow, setShowBorrow] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<SupplyPosition | null>(null);
  const [repayTarget, setRepayTarget] = useState<BorrowPosition | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const pricesPromise = lendingApi.getPrices().catch(() => ({}));
      const poolsPromise = lendingApi.getPools().catch(() => []);
      let portfolioData: Portfolio | null = null;
      if (balance > 0) {
        portfolioData = await lendingApi.getPortfolio(token).catch(() => null);
      }
      
      const [priceData, poolsData] = await Promise.all([pricesPromise, poolsPromise]);
      // Flatten nested price objects: {XMR: {price_usd: "352.5"}} → {XMR: "352.5"}
      const flatPrices: Record<string, string> = {};
      const rawPrices = (priceData as any)?.prices || priceData;
      for (const [key, val] of Object.entries(rawPrices)) {
        flatPrices[key] = typeof val === 'object' && val !== null ? (val as any).price_usd || '0' : String(val);
      }
      
      if (portfolioData) {
        setPortfolio(portfolioData);
        writePortfolioCache(token, portfolioData);
        setIsStale(false);
      } else {
        // Try cache fallback before showing empty state
        const cached = readPortfolioCache(token);
        if (cached && !portfolio) {
          setPortfolio(cached);
          setIsStale(true);
        } else {
          setPortfolio(prev => prev ?? { supplies: [], borrows: [] });
          setIsStale(false);
        }
      }
      setPrices(flatPrices);
      setPools(Array.isArray(poolsData) ? poolsData : (poolsData as any)?.pools || []);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load portfolio';
      // On error, try serving cached portfolio
      if (!portfolio && token) {
        const cached = readPortfolioCache(token);
        if (cached) {
          setPortfolio(cached);
          setIsStale(true);
          setError(null);
          setLoading(false);
          return;
        }
      }
      if (msg.includes('401') || msg.includes('Invalid') || msg.includes('expired')) {
        setError('Invalid or expired token');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, balance]);

  useEffect(() => {
    if (token) {
      fetchPortfolio();
      // Poll faster (10s) when stale, normal (15s) otherwise
      const interval = setInterval(fetchPortfolio, isStale ? 10000 : 15000);
      return () => clearInterval(interval);
    }
  }, [fetchPortfolio, token, isStale]);

  const handleTokenSubmit = async (newToken: string) => {
    await setCustomToken(newToken);
  };

  // Get the display rate for an asset: Aave rate for non-XMR, 0xNull rate for XMR
  const getSupplyApy = (asset: string): string | null => {
    const pool = pools.find((p) => p.asset === asset);
    if (!pool) return null;
    if (asset === 'XMR') return pool.supply_apy;
    return pool.aave_supply_apy || pool.supply_apy;
  };

  const getBorrowApy = (asset: string): string | null => {
    const pool = pools.find((p) => p.asset === asset);
    if (!pool) return null;
    if (asset === 'XMR') return pool.borrow_apy;
    return pool.aave_borrow_apy || pool.borrow_apy;
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

        {isStale && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300">Showing cached data — live data temporarily unavailable.</span>
            <Button variant="ghost" size="sm" onClick={fetchPortfolio} className="ml-auto gap-1 h-7 text-xs">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}

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
                          <th className="text-right py-2 px-2">APY</th>
                          <th className="text-right py-2 px-2">Interest Earned</th>
                          <th className="text-right py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.supplies.map((s) => {
                          const apy = getSupplyApy(s.asset);
                          return (
                          <tr key={s.id} className="border-b border-border/50">
                            <td className="py-3 px-2"><AssetIcon asset={s.asset} showName size="sm" /></td>
                            <td className="py-3 px-2 text-right font-mono">{formatBalance(s.deposited, s.asset)}</td>
                            <td className="py-3 px-2 text-right font-mono">{formatBalance(s.current_balance, s.asset)}</td>
                            <td className="py-3 px-2 text-right font-mono text-green-400">
                              {apy ? `${parseFloat(apy).toFixed(2)}%` : '—'}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-green-400">+{formatInterest(s.interest_earned)}</td>
                            <td className="py-3 px-2 text-right">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setWithdrawTarget(s)}>
                                Withdraw
                              </Button>
                            </td>
                          </tr>
                          );
                        })}
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
                            <td className="py-3 px-2 text-right font-mono">{(() => { const parts = b.borrowed.split(' '); return parts.length === 2 ? `${formatBalance(parts[0], parts[1])} ${parts[1]}` : b.borrowed; })()}</td>
                            <td className="py-3 px-2 text-right font-mono font-bold">{(() => { const parts = b.current_debt.split(' '); return parts.length === 2 ? `${formatBalance(parts[0], parts[1])} ${parts[1]}` : b.current_debt; })()}</td>
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
            {/* Earn Section */}
            <EarnTab token={token} />
          </div>
        )}
      </main>
      <Footer />

      {/* Modals */}
      <DepositFlow open={showDeposit} onClose={() => setShowDeposit(false)} token={token} onSuccess={fetchPortfolio} />
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
