import { Shield } from 'lucide-react';
import type { AaveRate } from '@/types/earn';

interface AaveRatesCardProps {
  rates: AaveRate[];
  loading: boolean;
  onDeposit: (asset: string) => void;
}

const ICON_COLORS: Record<string, string> = {
  USDC: 'bg-blue-500/20 text-blue-400',
  USDT: 'bg-emerald-500/20 text-emerald-400',
  WETH: 'bg-indigo-500/20 text-indigo-400',
  DAI: 'bg-amber-500/20 text-amber-400',
};

function formatApy(apy: number): string {
  return `${(apy * 100).toFixed(2)}%`;
}

function formatCompactUsd(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num || isNaN(num)) return '$0';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${Math.round(num)}`;
}

export function AaveRatesCard({ rates, loading, onDeposit }: AaveRatesCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h3 className="text-base font-semibold text-foreground">Aave V3 Rates — Arbitrum</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-4">Earn yield on shielded assets via Railgun</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-800 rounded-lg p-4 animate-pulse h-40" />
            ))
          : rates.map((rate) => {
              const color = ICON_COLORS[rate.asset] || 'bg-zinc-700 text-zinc-300';
              return (
                <div key={rate.asset} className="bg-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${color}`}>
                      {rate.asset[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{rate.asset}</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{formatApy(rate.supply_apy)}</p>
                  <p className="text-xs text-zinc-400">Liquidity: {rate.liquidity_formatted}</p>
                  <button
                    onClick={() => onDeposit(rate.asset)}
                    className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Deposit
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
