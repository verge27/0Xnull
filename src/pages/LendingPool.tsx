import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetIcon } from '@/components/lending/AssetIcon';
import { UtilizationBar } from '@/components/lending/UtilizationBar';
import { DepositFlow } from '@/components/lending/DepositFlow';
import { BorrowFlow } from '@/components/lending/BorrowFlow';
import { WithdrawModal } from '@/components/lending/WithdrawModal';
import { LendingTokenPrompt } from '@/components/lending/LendingTokenPrompt';
import {
  lendingApi, type LendingPoolDetail, type Portfolio, type SupplyPosition,
  parseAmount, parsePercent, formatUsd, formatBalance, sourceLabel, RISK_PARAMS, ASSET_META,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { ArrowLeft, Shield, Lock, Percent, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const LendingPool = () => {
  const { asset } = useParams<{ asset: string }>();
  const [searchParams] = useSearchParams();
  const { token, setCustomToken } = useToken();
  const [pool, setPool] = useState<LendingPoolDetail | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(searchParams.get('action') === 'supply');
  const [showBorrow, setShowBorrow] = useState(searchParams.get('action') === 'borrow');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [supplyPosition, setSupplyPosition] = useState<SupplyPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchPool = useCallback(async () => {
    if (!asset) return;
    try {
      const [poolData, priceData] = await Promise.all([
        lendingApi.getPool(asset),
        lendingApi.getPrices().catch(() => ({})),
      ]);
      setPool(poolData);
      setPrices(priceData);
      setIsStale(!!(poolData as any)?._stale);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pool data');
    } finally {
      setLoading(false);
    }
  }, [asset]);

  // Fetch user's supply position for this asset
  const fetchSupplyPosition = useCallback(async () => {
    if (!token || !asset) { setSupplyPosition(null); return; }
    try {
      const portfolio = await lendingApi.getPortfolio(token);
      const match = portfolio.supplies.find((s) => s.asset === asset);
      setSupplyPosition(match || null);
    } catch { setSupplyPosition(null); }
  }, [token, asset]);

  useEffect(() => { fetchSupplyPosition(); }, [fetchSupplyPosition]);

  useEffect(() => {
    fetchPool();
    // Auto-retry every 10s when serving stale data
    if (isStale) {
      const interval = setInterval(fetchPool, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchPool, isStale]);

  if (!asset) return null;

  const risk = RISK_PARAMS[asset];
  const meta = ASSET_META[asset];
  const util = pool ? parsePercent(pool.utilization) : 0;
  const hasAave = !!pool?.aave_supply_apy;

  const handleAction = (action: 'supply' | 'borrow') => {
    if (!token) return; // token prompt will show
    if (action === 'supply') setShowDeposit(true);
    else setShowBorrow(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/lending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> All Markets
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
            <div className="h-40 bg-secondary/50 rounded-lg animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive opacity-70" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => { setLoading(true); setError(null); fetchPool(); }} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : pool ? (
          <div className="space-y-6">
            {isStale && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-amber-300">Showing cached data — live data temporarily unavailable.</span>
                <Button variant="ghost" size="sm" onClick={() => { setLoading(true); setError(null); fetchPool(); }} className="ml-auto gap-1 h-7 text-xs">
                  <RefreshCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <AssetIcon asset={asset} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold">{asset}</h1>
                  <p className="text-muted-foreground text-sm">{meta?.name || asset}</p>
                </div>
              </div>
              <Badge variant="outline">{sourceLabel(pool.source)}</Badge>
            </div>

            {/* Rate Comparison Card */}
            <Card className="border-primary/20">
              <CardContent className="py-4">
                <div className={`grid ${hasAave ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {hasAave && (
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Aave V3 Rate</p>
                      <div className="flex justify-center gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Supply</p>
                          <p className="text-xl font-bold font-mono text-green-400/70">{pool.aave_supply_apy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Borrow</p>
                          <p className="text-xl font-bold font-mono text-amber-400/70">{pool.aave_borrow_apy}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Live on-chain rate, updated every 60s</p>
                    </div>
                  )}
                  <div className="text-center p-3 rounded-lg bg-primary/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">0xNull Rate</p>
                    <div className="flex justify-center gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Supply</p>
                        <p className="text-xl font-bold font-mono text-green-400">{pool.supply_apy}</p>
                        <p className="text-xs text-muted-foreground">APR: {pool.supply_apr}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Borrow</p>
                        <p className="text-xl font-bold font-mono text-amber-400">{pool.borrow_apy}</p>
                        <p className="text-xs text-muted-foreground">APR: {pool.borrow_apr}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">What you earn/pay through 0xNull</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pool Stats */}
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pool Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Deposited</p>
                    <p className="font-mono font-bold">{formatBalance(pool.total_deposits, asset)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Borrowed</p>
                    <p className="font-mono font-bold">{formatBalance(pool.total_borrows, asset)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available Liquidity</p>
                    <p className="font-mono font-bold">{formatBalance(pool.available_liquidity, asset)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reserves</p>
                    <p className="font-mono font-bold">{formatBalance(pool.total_reserves, asset)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                  <UtilizationBar percent={util} />
                </div>
              </CardContent>
            </Card>

            {/* Risk Parameters */}
            {risk && (
              <Card>
                <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Risk Parameters</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">LTV</p>
                        <p className="font-mono font-bold">{(risk.ltv * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Liquidation Threshold</p>
                        <p className="font-mono font-bold">{(risk.liquidation_threshold * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Liquidation Penalty</p>
                      <p className="font-mono font-bold">{(risk.liquidation_penalty * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {risk.can_collateral
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                      <span className="text-sm">Can use as collateral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {risk.can_borrow
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                      <span className="text-sm">Can borrow</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Token prompt or Actions */}
            {!token ? (
              <LendingTokenPrompt compact onSubmit={setCustomToken} />
            ) : (
              <div className="flex gap-3 flex-wrap">
                <Button size="lg" onClick={() => handleAction('supply')} className="flex-1">
                  Supply {asset}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setShowWithdraw(true)}
                  className="flex-1"
                  disabled={!supplyPosition}
                  title={!supplyPosition ? `No ${asset} supplied` : undefined}
                >
                  Withdraw {asset}
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAction('borrow')} className="flex-1">
                  Borrow against {asset}
                </Button>
              </div>
            )}

            {/* Privacy Info */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Privacy-Shielded</p>
                {asset === 'XMR'
                  ? <p>Send Monero to a unique subaddress. Your deposit is credited after 3 confirmations (~6 minutes). No wallet connection needed.</p>
                  : <p>Send tokens on Arbitrum. For maximum privacy, use Railgun's Railway Wallet to shield tokens first, then unshield to the deposit address.</p>
                }
                {hasAave && (
                  <p className="text-xs mt-2">We display live Aave V3 rates alongside our own rates so you can see exactly what the underlying protocol pays. Our rates are derived from Aave's on-chain rates with a small spread that funds protocol operations.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">Pool not found</div>
        )}
      </main>
      <Footer />

      {token && (
        <>
          <DepositFlow open={showDeposit} onClose={() => setShowDeposit(false)} asset={asset} token={token} onSuccess={() => { fetchPool(); fetchSupplyPosition(); }} />
          <BorrowFlow
            open={showBorrow}
            onClose={() => setShowBorrow(false)}
            token={token}
            prices={prices}
            defaultCollateral={risk?.can_collateral ? asset : 'WETH'}
            defaultBorrow={risk?.can_collateral ? 'USDC' : asset}
          />
          {supplyPosition && (
            <WithdrawModal
              open={showWithdraw}
              onClose={() => setShowWithdraw(false)}
              token={token}
              asset={asset}
              currentBalance={supplyPosition.current_balance}
              interestEarned={supplyPosition.interest_earned}
              availableLiquidity={pool?.available_liquidity}
              onSuccess={() => { fetchPool(); fetchSupplyPosition(); }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LendingPool;
