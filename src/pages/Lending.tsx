import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssetIcon } from '@/components/lending/AssetIcon';
import { UtilizationBar } from '@/components/lending/UtilizationBar';
import { LendingTokenPrompt } from '@/components/lending/LendingTokenPrompt';
import { LendingPrivacyTiers } from '@/components/lending/LendingPrivacyTiers';
import { SEORichText } from '@/components/SEORichText';
import {
  lendingApi, type LendingPool, type LendingStatus,
  parseAmount, parsePercent, formatUsd, sourceLabel,
} from '@/lib/lending';
import { useToken } from '@/hooks/useToken';
import { usePendleEarn } from '@/hooks/usePendleEarn';
import { useAaveEarn } from '@/hooks/useAaveEarn';
import { useSEO } from '@/hooks/useSEO';
import { Shield, Activity, TrendingUp, AlertTriangle, RefreshCw, ShieldCheck, Search, Lock, Filter } from 'lucide-react';
import { EarnTab } from '@/components/earn/EarnTab';

const Lending = () => {
  useSEO();
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [status, setStatus] = useState<LendingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degradedSince, setDegradedSince] = useState<number | null>(null);
  const [showDegraded, setShowDegraded] = useState(false);
  const { token, setCustomToken } = useToken();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'earn'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [myDepositsOnly, setMyDepositsOnly] = useState(false);

  const [isStale, setIsStale] = useState(false);

  // Pendle & Aave earn data for dashboard integration
  const pendle = usePendleEarn(token);
  const aaveEarn = useAaveEarn(token);

  const fetchData = useCallback(async () => {
    try {
      const [poolsRes, statusRes] = await Promise.all([
        lendingApi.getPools(),
        lendingApi.getStatus().catch(() => null),
      ]);
      setPools(poolsRes.pools || []);
      setStatus(statusRes);
      setIsStale(!!(poolsRes as any)?._stale);
      setError(null);

      // Track when oracle degradation started
      const isDegraded = statusRes?.oracle_degraded || statusRes?.circuit_breaker;
      if (isDegraded) {
        setDegradedSince(prev => prev ?? Date.now());
      } else {
        setDegradedSince(null);
        setShowDegraded(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll faster (10s) when serving stale cached data, normal (30s) otherwise
    const interval = setInterval(fetchData, isStale ? 10000 : 30000);
    return () => clearInterval(interval);
  }, [fetchData, isStale]);

  // Only show degraded banner after 60 seconds of continuous degradation
  useEffect(() => {
    if (!degradedSince) return;
    const elapsed = Date.now() - degradedSince;
    if (elapsed >= 60000) {
      setShowDegraded(true);
      return;
    }
    const timer = setTimeout(() => setShowDegraded(true), 60000 - elapsed);
    return () => clearTimeout(timer);
  }, [degradedSince]);

  const totalTvl = pools.reduce((sum, p) => sum + parseAmount(p.total_deposits) * parseAmount(p.price_usd), 0);
  const totalBorrowed = pools.reduce((sum, p) => sum + parseAmount(p.total_borrows) * parseAmount(p.price_usd), 0);

  // Build set of assets the user has deposits in (Aave positions + Pendle positions)
  const myDepositAssets = useMemo(() => {
    const s = new Set<string>();
    for (const p of aaveEarn.positions) s.add(p.asset || '');
    for (const p of pendle.positions) s.add(p.deposit_token || '');
    // Also check portfolio supplies if user has lending positions in pools
    return s;
  }, [aaveEarn.positions, pendle.positions]);

  // Compact number formatter
  const fmtCompact = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  const fmtExpiry = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const daysUntil = (iso: string) =>
    Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

  // Unified rows: pool rows + pendle market rows
  type DashboardRow = 
    | { kind: 'pool'; pool: LendingPool }
    | { kind: 'pendle'; market: typeof pendle.markets[0]; comparison?: typeof pendle.comparisons[0] };

  const allRows = useMemo(() => {
    const rows: DashboardRow[] = [];
    for (const pool of pools) rows.push({ kind: 'pool', pool });
    for (const m of pendle.markets) {
      const comp = pendle.comparisons.find(c => c.market_address === m.market_address);
      rows.push({ kind: 'pendle', market: m, comparison: comp });
    }
    return rows;
  }, [pools, pendle.markets, pendle.comparisons]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allRows.filter(row => {
      const asset = row.kind === 'pool' ? row.pool.asset : row.market.deposit_token;
      const name = row.kind === 'pool' ? row.pool.asset : row.market.name;
      // Search filter
      if (q && !asset.toLowerCase().includes(q) && !name.toLowerCase().includes(q) &&
          !(row.kind === 'pool' && sourceLabel(row.pool.source).toLowerCase().includes(q)) &&
          !(row.kind === 'pendle' && 'pendle'.includes(q))) {
        return false;
      }
      // My deposits filter
      if (myDepositsOnly) {
        if (row.kind === 'pool') {
          return myDepositAssets.has(row.pool.asset);
        } else {
          return pendle.positions.some(p => p.market_address === row.market.market_address);
        }
      }
      return true;
    });
  }, [allRows, searchQuery, myDepositsOnly, myDepositAssets, pendle.positions]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Circuit Breaker Banner — only shown after 60s of degradation */}
        {showDegraded && status?.circuit_breaker && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-300">Borrows temporarily paused</p>
              <p className="text-sm text-amber-400/80">{status.message || 'Oracle degraded — new borrows are halted until conditions stabilize.'}</p>
            </div>
          </div>
        )}
        {isStale && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300">Showing cached data — live data temporarily unavailable.</span>
            <Button variant="ghost" size="sm" onClick={() => { setLoading(true); setError(null); fetchData(); }} className="ml-auto gap-1 h-7 text-xs">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}

        {/* Hero */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Lending Protocol</h1>
            {status && (
              <Badge variant="outline" className={`gap-1 ${!showDegraded || status.healthy ? 'border-green-500/50 text-green-400' : status.oracle_degraded ? 'border-amber-500/50 text-amber-400' : 'border-red-500/50 text-red-400'}`}>
                <Activity className="w-3 h-3" />
                {!showDegraded || status.healthy ? 'Operational' : status.oracle_degraded ? 'Oracle Degraded' : 'Circuit Breaker'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Privacy-first lending. No KYC. No account. Just your token.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" />
            Privacy-enhanced lending via Railgun ZK on Arbitrum — shielding optional on deposits and withdrawals
            <Link to="/lending/privacy" className="text-primary hover:underline ml-1">How it works →</Link>
          </div>
        </div>

        {/* Token Onboarding Banner */}
        {!token && (
          <LendingTokenPrompt compact onSubmit={setCustomToken} />
        )}

        {/* TVL Banner */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <CardContent className="py-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value Locked</p>
                <p className="text-2xl font-bold font-mono">{formatUsd(totalTvl)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Borrowed</p>
                <p className="text-2xl font-bold font-mono text-amber-400">{formatUsd(totalBorrowed)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'earn' ? 'default' : 'outline'}
                onClick={() => setActiveTab('earn')}
              >
                Earn
              </Button>
              <Button variant="outline" asChild><Link to="/lending/liquidations">Liquidations</Link></Button>
              <Button variant="ghost" size="sm" asChild className="text-xs"><Link to="/lending/privacy">Privacy</Link></Button>
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

        {/* Tab content */}
        {activeTab === 'dashboard' && (
          <>
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
                              <div className="flex items-center gap-1.5">
                                <AssetIcon asset={pool.asset} showName />
                                {pool.asset !== 'XMR' && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <ShieldCheck className="w-3 h-3 text-emerald-400/60" />
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-xs">Railgun ZK shielding available for deposits and withdrawals</p></TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
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
                            <td className="py-3 px-3 text-right">
                              <div>
                                <span className="font-mono text-green-400 text-xs">{supplyApy.toFixed(2)}%</span>
                                <span className="text-muted-foreground mx-1">/</span>
                                <span className="font-mono text-amber-400 text-xs">{borrowApy.toFixed(2)}%</span>
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

            {/* Privacy Tiers */}
            <div className="mt-10 mb-4">
              <LendingPrivacyTiers />
            </div>
          </>
        )}

        {activeTab === 'earn' && (
          <EarnTab token={token} />
        )}

        <SEORichText
          title="Anonymous Crypto Lending Protocol"
          content={`
<p>Decentralized finance continues to evolve beyond simple token swaps and staking mechanisms. Today, users are increasingly looking for anonymous crypto lending protocols that allow them to access liquidity without identity verification, custodial risk, or invasive onboarding processes. Traditional lending platforms often require account creation, compliance checks, and extensive personal data collection — creating unnecessary friction for users who simply want to lend or borrow digital assets.</p>

<p>The 0xNull Lending Protocol represents a shift toward privacy-first DeFi infrastructure, where smart contracts replace intermediaries and crypto-native payments eliminate reliance on banks or third-party processors. By removing KYC requirements, users can participate in decentralized lending markets without exposing sensitive identity information. This aligns with the foundational principles of cryptocurrency: permissionless access, self-custody, and censorship resistance.</p>

<h3>Why No-KYC Lending Is Gaining Momentum</h3>

<p>As regulatory environments tighten and centralized platforms increase verification requirements, demand for no KYC crypto lending continues to rise. Users want:</p>

<ul>
<li>Greater control over personal data</li>
<li>Reduced counterparty risk</li>
<li>Transparent on-chain activity</li>
<li>Global accessibility without banking restrictions</li>
</ul>

<p>Anonymous lending protocols meet these needs by allowing borrowers to lock collateral directly into smart contracts while lenders supply liquidity in exchange for algorithmically determined yield.</p>
          `}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Lending;
