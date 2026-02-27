import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import type { PendleMarket, PendleComparison } from '@/types/pendle';

interface PendleMarketsCardProps {
  markets: PendleMarket[];
  comparisons: PendleComparison[];
  bestAdvantage: PendleComparison | null;
  loading: boolean;
  onDeposit: (market: PendleMarket) => void;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(2)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const now = Date.now();
  const exp = new Date(iso).getTime();
  return Math.max(0, Math.ceil((exp - now) / 86_400_000));
}

function apyColor(apy: number): string {
  if (apy >= 6) return 'text-emerald-400';
  if (apy >= 3) return 'text-amber-400';
  return 'text-zinc-300';
}

export function PendleMarketsCard({ markets, comparisons, bestAdvantage, loading, onDeposit }: PendleMarketsCardProps) {
  const compMap = useMemo(() => {
    const m = new Map<string, PendleComparison>();
    comparisons.forEach((c) => m.set(c.market_address, c));
    return m;
  }, [comparisons]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Fixed Yield — Pendle V2
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Lock in guaranteed rates on Arbitrum. Currently beating Aave on all assets.
        </p>

        {bestAdvantage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mt-3">
            <p className="text-sm text-emerald-300">
              Best opportunity: <span className="font-medium text-emerald-200">{bestAdvantage.asset}</span> at{' '}
              <span className="font-bold text-emerald-200">{bestAdvantage.pendle_fixed_apy}%</span> fixed vs{' '}
              {bestAdvantage.aave_variable_apy}% variable on Aave{' '}
              <span className="text-emerald-400 font-medium">(+{bestAdvantage.apy_difference.toFixed(2)}%)</span>
            </p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-800 rounded-lg h-48" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && markets.length === 0 && (
        <p className="text-zinc-500 text-sm mt-6">No active Pendle markets found</p>
      )}

      {/* Grid */}
      {!loading && markets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {markets.map((mkt) => {
            const comp = compMap.get(mkt.market_address);
            const days = daysUntil(mkt.expiry);

            return (
              <div
                key={mkt.market_address}
                className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600 transition flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{mkt.name}</span>
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    {mkt.deposit_token}
                  </span>
                </div>

                {/* APY */}
                <div className="mt-3">
                  <span className="text-xs text-zinc-500">Fixed APY</span>
                  <p className={`text-2xl font-bold ${apyColor(mkt.fixed_apy_pct)}`}>
                    {mkt.fixed_apy_pct.toFixed(2)}%
                  </p>
                  {comp && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      vs {comp.aave_variable_apy}% variable on Aave
                      {comp.apy_difference > 0 && (
                        <span className="text-emerald-500 ml-1">(+{comp.apy_difference.toFixed(2)}%)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="flex justify-between text-xs text-zinc-500 mt-3">
                  <span>TVL: {formatTvl(mkt.tvl_usd)}</span>
                  <span>{formatExpiry(mkt.expiry)}</span>
                  <span className={days < 30 ? 'text-amber-400' : ''}>{days}d left</span>
                </div>

                {/* Button */}
                <button
                  onClick={() => onDeposit(mkt)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition"
                >
                  Lock {mkt.fixed_apy_pct.toFixed(2)}% Fixed
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
