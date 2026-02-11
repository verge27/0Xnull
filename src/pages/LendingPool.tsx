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
import {
  lendingApi, type LendingPoolDetail,
  parseAmount, parsePercent, formatUsd, sourceLabel, RISK_PARAMS, ASSET_META,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { ArrowLeft, Shield, Lock, Percent, CheckCircle, XCircle } from 'lucide-react';

const LendingPool = () => {
  const { asset } = useParams<{ asset: string }>();
  const [searchParams] = useSearchParams();
  const { token } = useToken();
  const [pool, setPool] = useState<LendingPoolDetail | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(searchParams.get('action') === 'supply');
  const [showBorrow, setShowBorrow] = useState(searchParams.get('action') === 'borrow');

  const fetchPool = useCallback(async () => {
    if (!asset) return;
    try {
      const [poolData, priceData] = await Promise.all([
        lendingApi.getPool(asset),
        lendingApi.getPrices().catch(() => ({})),
      ]);
      setPool(poolData);
      setPrices(priceData);
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  if (!asset) return null;

  const risk = RISK_PARAMS[asset];
  const meta = ASSET_META[asset];
  const price = parseAmount(prices[asset] || pool?.utilization?.replace('%', '') || '0');
  const poolPrice = pool ? parseAmount(pool.total_deposits) : 0;
  const util = pool ? parsePercent(pool.utilization) : 0;

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
        ) : pool ? (
          <div className="space-y-6">
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

            {/* APY Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Supply APY</p>
                  <p className="text-3xl font-bold font-mono text-green-400">{pool.supply_apy}</p>
                  <p className="text-xs text-muted-foreground">APR: {pool.supply_apr}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Borrow APY</p>
                  <p className="text-3xl font-bold font-mono text-amber-400">{pool.borrow_apy}</p>
                  <p className="text-xs text-muted-foreground">APR: {pool.borrow_apr}</p>
                </CardContent>
              </Card>
            </div>

            {/* Pool Stats */}
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pool Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Deposited</p>
                    <p className="font-mono font-bold">{parseAmount(pool.total_deposits).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Borrowed</p>
                    <p className="font-mono font-bold">{parseAmount(pool.total_borrows).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available Liquidity</p>
                    <p className="font-mono font-bold">{parseAmount(pool.available_liquidity).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reserves</p>
                    <p className="font-mono font-bold">{parseAmount(pool.total_reserves).toFixed(4)}</p>
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

            {/* Actions */}
            <div className="flex gap-3">
              <Button size="lg" onClick={() => setShowDeposit(true)} className="flex-1">
                Supply {asset}
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowBorrow(true)} className="flex-1">
                Borrow against {asset}
              </Button>
            </div>

            {/* Privacy Info */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Privacy-Shielded</p>
                {asset === 'XMR'
                  ? <p>Send Monero to a unique subaddress. Your deposit is credited after 10 confirmations. No wallet connection needed.</p>
                  : <p>Send tokens on Arbitrum. For maximum privacy, use Railgun's Railway Wallet to shield tokens first, then unshield to the deposit address.</p>
                }
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
          <DepositFlow open={showDeposit} onClose={() => setShowDeposit(false)} asset={asset} token={token} />
          <BorrowFlow
            open={showBorrow}
            onClose={() => setShowBorrow(false)}
            token={token}
            prices={prices}
            defaultCollateral={risk?.can_collateral ? asset : 'WETH'}
            defaultBorrow={risk?.can_collateral ? 'USDC' : asset}
          />
        </>
      )}
    </div>
  );
};

export default LendingPool;
