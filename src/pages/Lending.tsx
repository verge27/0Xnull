import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssetIcon } from '@/components/lending/AssetIcon';
import { UtilizationBar } from '@/components/lending/UtilizationBar';
import { LendingTokenPrompt } from '@/components/lending/LendingTokenPrompt';
import {
  lendingApi, type LendingPool, type LendingStatus,
  parseAmount, parsePercent, formatUsd, sourceLabel,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { Shield, Activity, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const Lending = () => {
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [status, setStatus] = useState<LendingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, setCustomToken } = useToken();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [poolsRes, statusRes] = await Promise.all([
        lendingApi.getPools(),
        lendingApi.getStatus().catch(() => null),
      ]);
      setPools(poolsRes.pools || []);
      setStatus(statusRes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalTvl = pools.reduce((sum, p) => sum + parseAmount(p.total_deposits) * parseAmount(p.price_usd), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Lending Protocol</h1>
            {status && (
              <Badge variant="outline" className={`gap-1 ${status.healthy ? 'border-green-500/50 text-green-400' : status.oracle_degraded ? 'border-amber-500/50 text-amber-400' : 'border-red-500/50 text-red-400'}`}>
                <Activity className="w-3 h-3" />
                {status.healthy ? 'Healthy' : status.oracle_degraded ? 'Oracle Degraded' : 'Circuit Breaker'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Privacy-preserving DeFi lending. Earn yield on deposits, borrow against collateral — all shielded via Railgun ZK-SNARKs on Arbitrum.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" />
            All deposits shielded via Railgun ZK-SNARKs on Arbitrum
          </div>
        </div>

        {/* Token Onboarding Banner */}
        {!token && (
          <LendingTokenPrompt compact onSubmit={setCustomToken} />
        )}

        {/* TVL Banner */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value Locked</p>
              <p className="text-2xl font-bold font-mono">{formatUsd(totalTvl)}</p>
            </div>
            <div className="flex gap-3">
              <Button asChild><Link to="/lending/dashboard">Dashboard</Link></Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <Button variant="ghost" size="sm" onClick={fetchData} className="ml-auto gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Pools Table */}
        {!loading && pools.length > 0 && (
          <TooltipProvider>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-3">Asset</th>
                    <th className="text-right py-3 px-3 hidden md:table-cell">Price</th>
                    <th className="text-right py-3 px-3">Total Deposited</th>
                    <th className="text-right py-3 px-3 hidden lg:table-cell">Total Borrowed</th>
                    <th className="text-right py-3 px-3 hidden lg:table-cell">Available</th>
                    <th className="py-3 px-3 w-32 hidden md:table-cell">Utilization</th>
                    <th className="text-right py-3 px-3 hidden xl:table-cell">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Aave Rate</TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-48">Live rate from Aave V3 on Arbitrum, updated every 60 seconds</p></TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-right py-3 px-3">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">0xNull Rate</TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-48">Rate you earn/pay through 0xNull's privacy-preserving lending</p></TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-right py-3 px-3 hidden sm:table-cell">Source</th>
                    <th className="text-right py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => {
                    const price = parseAmount(pool.price_usd);
                    const deposited = parseAmount(pool.total_deposits);
                    const borrowed = parseAmount(pool.total_borrows);
                    const available = parseAmount(pool.available_liquidity);
                    const util = parsePercent(pool.utilization);
                    const supplyApy = parsePercent(pool.supply_apy);
                    const borrowApy = parsePercent(pool.borrow_apy);
                    const hasAave = !!pool.aave_supply_apy;

                    return (
                      <tr
                        key={pool.asset}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/lending/pool/${pool.asset}`)}
                      >
                        <td className="py-3 px-3">
                          <AssetIcon asset={pool.asset} showName />
                        </td>
                        <td className="py-3 px-3 text-right font-mono hidden md:table-cell">
                          ${price < 10 ? price.toFixed(4) : price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono">{deposited.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{formatUsd(deposited * price)}</div>
                        </td>
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          <div className="font-mono">{borrowed.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{formatUsd(borrowed * price)}</div>
                        </td>
                        <td className="py-3 px-3 text-right hidden lg:table-cell font-mono">
                          {available.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <UtilizationBar percent={util} />
                        </td>
                        {/* Aave Rate Column */}
                        <td className="py-3 px-3 text-right hidden xl:table-cell">
                          {hasAave ? (
                            <div>
                              <span className="font-mono text-green-400/70 text-xs">{parsePercent(pool.aave_supply_apy!).toFixed(2)}%</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="font-mono text-amber-400/70 text-xs">{parsePercent(pool.aave_borrow_apy!).toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        {/* 0xNull Rate Column */}
                        <td className="py-3 px-3 text-right">
                          <div>
                            <span className="font-mono text-green-400">{supplyApy.toFixed(2)}%</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="font-mono text-amber-400">{borrowApy.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {sourceLabel(pool.source)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="default" asChild className="h-7 text-xs">
                              <Link to={`/lending/pool/${pool.asset}?action=supply`}>Supply</Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                              <Link to={`/lending/pool/${pool.asset}?action=borrow`}>Borrow</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}

        {/* Empty state */}
        {!loading && !error && pools.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No lending pools available</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Lending;
