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
import { useAaveEarn } from '@/hooks/useAaveEarn';
import { useSEO } from '@/hooks/useSEO';
import { Shield, Activity, TrendingUp, AlertTriangle, RefreshCw, ShieldCheck, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EarnTab } from '@/components/earn/EarnTab';

type SortKey = 'asset' | 'venue' | 'price' | 'supplyApy' | 'borrowApy' | 'util';
type SortDir = 'asc' | 'desc';

// Venue badge color map — keyed by lowercase venue/source name
const VENUE_COLORS: Record<string, string> = {
  'xmr pool':        'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'aave v3':         'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'aave_arbitrum':   'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'pendle':          'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'xmr_pool':        'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const VenueBadge = ({ label, source }: { label: string; source?: string }) => {
  const key = (source || label).toLowerCase();
  const colors = VENUE_COLORS[key] || 'bg-muted/50 text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${colors}`}>
      {label}
    </span>
  );
};

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
  const [sortKey, setSortKey] = useState<SortKey>('supplyApy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Aave earn data for dashboard integration
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
      const isDegraded = statusRes?.oracle?.degraded || statusRes?.oracle_degraded || (typeof statusRes?.circuit_breaker === 'object' ? statusRes.circuit_breaker.borrows_halted : statusRes?.circuit_breaker);
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

  // Build set of assets the user has deposits in (Aave positions)
  const myDepositAssets = useMemo(() => {
    const s = new Set<string>();
    for (const p of aaveEarn.positions) s.add(p.asset || '');
    return s;
  }, [aaveEarn.positions]);

  // Compact number formatter
  const fmtCompact = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortValue = (pool: LendingPool, key: SortKey): number | string => {
    switch (key) {
      case 'asset': return pool.asset.toLowerCase();
      case 'venue': return sourceLabel(pool.source).toLowerCase();
      case 'price': return parseAmount(pool.price_usd) * parseAmount(pool.total_deposits);
      case 'supplyApy': return parsePercent(pool.supply_apy);
      case 'borrowApy': return parsePercent(pool.borrow_apy);
      case 'util': return parsePercent(pool.utilization);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = pools.filter(pool => {
      if (q && !pool.asset.toLowerCase().includes(q) &&
          !sourceLabel(pool.source).toLowerCase().includes(q)) {
        return false;
      }
      if (myDepositsOnly) {
        return myDepositAssets.has(pool.asset);
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [pools, searchQuery, myDepositsOnly, myDepositAssets, sortKey, sortDir]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Circuit Breaker Banner — only shown after 60s of degradation */}
        {showDegraded && (typeof status?.circuit_breaker === 'object' ? status.circuit_breaker.borrows_halted : status?.circuit_breaker) && (
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
              <Badge variant="outline" className={`gap-1 ${!showDegraded || status.healthy ? 'border-green-500/50 text-green-400' : (status.oracle?.degraded || status.oracle_degraded) ? 'border-amber-500/50 text-amber-400' : 'border-red-500/50 text-red-400'}`}>
                <Activity className="w-3 h-3" />
                {!showDegraded || status.healthy ? 'Operational' : (status.oracle?.degraded || status.oracle_degraded) ? 'Oracle Degraded' : 'Circuit Breaker'}
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
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets, venues (e.g. DAI, Pendle, sUSDai)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800"
                />
              </div>
              {token && (
                <Button
                  variant={myDepositsOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMyDepositsOnly(!myDepositsOnly)}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <Filter className="w-3.5 h-3.5" />
                  My Deposits
                </Button>
              )}
            </div>

            {/* Unified Table */}
            {!loading && filteredRows.length > 0 && (
              <TooltipProvider>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        {([
                          { key: 'asset' as SortKey, label: 'Asset', align: 'text-left', hide: '' },
                          { key: 'venue' as SortKey, label: 'Venue', align: 'text-left', hide: '' },
                          { key: 'price' as SortKey, label: 'Price / TVL', align: 'text-right', hide: 'hidden md:table-cell' },
                          { key: 'supplyApy' as SortKey, label: 'Supply APY', align: 'text-right', hide: '' },
                          { key: 'borrowApy' as SortKey, label: 'Borrow APY', align: 'text-right', hide: 'hidden lg:table-cell' },
                          { key: 'util' as SortKey, label: 'Util / Expiry', align: 'text-left', hide: 'hidden md:table-cell' },
                        ]).map(col => (
                          <th
                            key={col.key}
                            className={`${col.align} py-3 px-3 ${col.hide} cursor-pointer select-none hover:text-foreground transition-colors`}
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {sortKey === col.key ? (
                                sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )}
                            </span>
                          </th>
                        ))}
                        <th className="text-right py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((pool) => {
                          const price = parseAmount(pool.price_usd);
                          const deposited = parseAmount(pool.total_deposits);
                          const util = parsePercent(pool.utilization);
                          const supplyApy = parsePercent(pool.supply_apy);
                          const borrowApy = parsePercent(pool.borrow_apy);

                          return (
                            <tr
                              key={`pool-${pool.asset}`}
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
                                      <TooltipContent><p className="text-xs">Railgun ZK shielding available</p></TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <VenueBadge label={sourceLabel(pool.source)} source={pool.source} />
                              </td>
                              <td className="py-3 px-3 text-right font-mono hidden md:table-cell">
                                <div>${price < 10 ? price.toFixed(4) : price.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">{formatUsd(deposited * price)} dep.</div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`font-mono ${supplyApy >= 8 ? 'text-emerald-400 font-bold' : supplyApy >= 4 ? 'text-emerald-400' : supplyApy >= 2 ? 'text-amber-400' : 'text-zinc-400'}`}>{supplyApy.toFixed(2)}%</span>
                                <span className="text-muted-foreground text-xs ml-1">~</span>
                              </td>
                              <td className="py-3 px-3 text-right hidden lg:table-cell">
                                <span className="font-mono text-amber-400">{borrowApy.toFixed(2)}%</span>
                              </td>
                              <td className="py-3 px-3 hidden md:table-cell">
                                <UtilizationBar percent={util} />
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
            {!loading && !error && filteredRows.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery || myDepositsOnly ? 'No matching assets found' : 'No lending pools available'}</p>
                {myDepositsOnly && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setMyDepositsOnly(false)}>
                    Show all assets
                  </Button>
                )}
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
