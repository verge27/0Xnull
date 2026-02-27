import { useState, useMemo } from 'react';
import { Lock, TrendingUp, AlertTriangle } from 'lucide-react';
import { AssetIcon } from '@/components/lending/AssetIcon';
import { useAaveEarn } from '@/hooks/useAaveEarn';
import { usePendleEarn } from '@/hooks/usePendleEarn';
import { DepositModal } from '@/components/earn/DepositModal';
import { PendleDepositModal } from '@/components/pendle/PendleDepositModal';
import type { AaveRate } from '@/types/earn';
import type { PendleMarket } from '@/types/pendle';

interface EarnTabProps {
  token: string | null;
}

// ── Unified venue type ──────────────────────────────────

interface Venue {
  type: 'aave' | 'pendle';
  label: string;
  apy: number;
  isVariable: boolean;
  tvl?: number;
  liquidity?: string;
  expiry?: string;
  market_address?: string;
  // references for modals
  aaveRate?: AaveRate;
  pendleMarket?: PendleMarket;
}

interface AssetGroup {
  asset: string;
  venues: Venue[];
  bestApy: number;
}

// ── Helpers ─────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function apyColor(apy: number): string {
  if (apy >= 8) return 'text-emerald-400 font-bold';
  if (apy >= 4) return 'text-emerald-400';
  if (apy >= 2) return 'text-amber-400';
  return 'text-zinc-400';
}

const ASSET_BORDER: Record<string, string> = {
  DAI: 'border-l-amber-500',
  USDC: 'border-l-blue-500',
  WETH: 'border-l-indigo-500',
  wstETH: 'border-l-cyan-500',
  USDT: 'border-l-green-500',
};

// ── Component ───────────────────────────────────────────

export function EarnTab({ token }: EarnTabProps) {
  const aave = useAaveEarn(token);
  const pendle = usePendleEarn(token);

  const [depositAaveAsset, setDepositAaveAsset] = useState<string | null>(null);
  const [depositPendleMarket, setDepositPendleMarket] = useState<PendleMarket | null>(null);

  const loading = aave.loading && pendle.loading;
  const partialError = (aave.error && !pendle.error) || (!aave.error && pendle.error);

  // Build unified asset map
  const groups: AssetGroup[] = useMemo(() => {
    const map = new Map<string, Venue[]>();

    // Aave rates
    for (const r of aave.rates) {
      const key = r.asset;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        type: 'aave',
        label: 'Aave V3',
        apy: r.supply_apy * 100, // decimal → pct
        isVariable: true,
        liquidity: r.liquidity_formatted,
        aaveRate: r,
      });
    }

    // Pendle markets
    for (const m of pendle.markets) {
      const key = m.deposit_token;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        type: 'pendle',
        label: m.name,
        apy: m.fixed_apy_pct,
        isVariable: false,
        tvl: m.tvl_usd,
        expiry: m.expiry,
        market_address: m.market_address,
        pendleMarket: m,
      });
    }

    // Sort venues within each group by APY desc
    const result: AssetGroup[] = [];
    for (const [asset, venues] of map) {
      venues.sort((a, b) => b.apy - a.apy);
      result.push({ asset, venues, bestApy: venues[0]?.apy ?? 0 });
    }

    // Sort groups by best APY desc
    result.sort((a, b) => b.bestApy - a.bestApy);
    return result;
  }, [aave.rates, pendle.markets]);

  // Find overall best
  const bestOverall = useMemo(() => {
    let best: { asset: string; label: string; apy: number } | null = null;
    for (const g of groups) {
      for (const v of g.venues) {
        if (!best || v.apy > best.apy) best = { asset: g.asset, label: v.label, apy: v.apy };
      }
    }
    return best;
  }, [groups]);

  // Find Aave rate for a given asset (for spread calculation)
  const aaveApyMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of aave.rates) m.set(r.asset, r.supply_apy * 100);
    return m;
  }, [aave.rates]);

  // Deposit modal helpers
  const depositAaveRate = depositAaveAsset ? aave.rates.find((r) => r.asset === depositAaveAsset)?.supply_apy : undefined;
  const depositPendleComparison = depositPendleMarket
    ? pendle.comparisons.find((c) => c.market_address === depositPendleMarket.market_address)
    : undefined;

  // Position count for badge
  const positionCount = aave.positions.length + pendle.positions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Earn</h2>
          <p className="text-sm text-zinc-400">Deposit into Aave (variable) or Pendle (fixed) on Arbitrum</p>
        </div>
        {bestOverall && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1 text-emerald-400 text-sm whitespace-nowrap">
            <TrendingUp className="w-3.5 h-3.5" />
            {bestOverall.asset} → {bestOverall.label} at {bestOverall.apy.toFixed(2)}% {bestOverall.label !== 'Aave V3' ? 'fixed' : 'variable'}
          </span>
        )}
      </div>

      {/* Partial error warning */}
      {partialError && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Some rates unavailable — showing partial data
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-800 rounded-lg h-12" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && groups.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No earn opportunities found</p>
        </div>
      )}

      {/* Unified table */}
      {!loading && groups.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">Asset</th>
                <th className="text-left py-3 px-3">Venue</th>
                <th className="text-left py-3 px-3">Type</th>
                <th className="text-right py-3 px-3">APY</th>
                <th className="text-right py-3 px-3 hidden md:table-cell">TVL</th>
                <th className="text-right py-3 px-3 hidden md:table-cell">Expiry</th>
                <th className="text-right py-3 px-3">vs Aave</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const borderColor = ASSET_BORDER[group.asset] || 'border-l-zinc-600';
                const aaveApy = aaveApyMap.get(group.asset);

                return group.venues.map((venue, idx) => {
                  const isFirst = idx === 0;
                  const spread = venue.type === 'pendle' && aaveApy !== undefined ? venue.apy - aaveApy : null;
                  const days = venue.expiry ? daysUntil(venue.expiry) : 0;
                  const daysColor = days < 7 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-zinc-500';

                  return (
                    <tr
                      key={`${group.asset}-${venue.type}-${venue.label}-${idx}`}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${isFirst ? 'border-t border-zinc-800' : ''}`}
                    >
                      {/* Asset */}
                      <td className={`py-3 px-4 ${isFirst ? `border-l-2 ${borderColor}` : 'border-l-2 border-l-transparent'}`}>
                        {isFirst && (
                          <div className="flex items-center gap-1.5">
                            <AssetIcon asset={group.asset} showName />
                          </div>
                        )}
                      </td>

                      {/* Venue */}
                      <td className="py-3 px-3">
                        <span className="text-white">{venue.label}</span>
                        {venue.type === 'aave' && (
                          <span className="ml-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400">Aave</span>
                        )}
                        {venue.type === 'pendle' && (
                          <span className="ml-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] bg-teal-500/20 text-teal-400">Pendle</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">
                        {venue.isVariable ? (
                          <span className="text-zinc-400 text-xs flex items-center gap-1">
                            <span className="text-base leading-none">~</span> Variable
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Fixed
                          </span>
                        )}
                      </td>

                      {/* APY */}
                      <td className={`py-3 px-3 text-right font-mono ${apyColor(venue.apy)}`}>
                        {venue.apy.toFixed(2)}%
                      </td>

                      {/* TVL */}
                      <td className="py-3 px-3 text-right text-xs text-zinc-500 hidden md:table-cell">
                        {venue.tvl ? formatCompact(venue.tvl) : venue.liquidity ? formatCompact(parseFloat(venue.liquidity)) : '—'}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-3 text-right hidden md:table-cell">
                        {venue.expiry ? (
                          <span className={`text-xs ${daysColor}`}>
                            {fmtExpiry(venue.expiry)} <span className="opacity-70">({days}d)</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Spread */}
                      <td className="py-3 px-3 text-right font-mono text-xs">
                        {venue.type === 'aave' ? (
                          <span className="text-zinc-600">—</span>
                        ) : spread !== null ? (
                          <span className={spread >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {venue.type === 'aave' ? (
                          <button
                            onClick={() => setDepositAaveAsset(venue.aaveRate?.asset || group.asset)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition"
                          >
                            Supply
                          </button>
                        ) : (
                          <button
                            onClick={() => venue.pendleMarket && setDepositPendleMarket(venue.pendleMarket)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition"
                          >
                            Lock Fixed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {depositAaveAsset && (
        <DepositModal
          asset={depositAaveAsset}
          rate={depositAaveRate}
          token={token}
          onClose={() => setDepositAaveAsset(null)}
          onSuccess={aave.refresh}
        />
      )}

      {depositPendleMarket && (
        <PendleDepositModal
          market={depositPendleMarket}
          comparison={depositPendleComparison}
          txPending={pendle.txPending}
          onDeposit={async (ma, amt, addr) => {
            const res = await pendle.deposit(ma, amt, addr);
            if (!res.error) {
              pendle.refresh();
              setDepositPendleMarket(null);
            }
            return res;
          }}
          onClose={() => setDepositPendleMarket(null)}
        />
      )}
    </div>
  );
}
