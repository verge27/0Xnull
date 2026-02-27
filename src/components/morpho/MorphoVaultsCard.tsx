import { useMemo } from 'react';
import { Vault } from 'lucide-react';
import type { MorphoVault } from '@/types/morpho';

interface MorphoVaultsCardProps {
  vaults: Record<string, MorphoVault[]>;
  loading: boolean;
  onDeposit: (vault: MorphoVault) => void;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

const CURATOR_COLORS: Record<string, string> = {
  steakhouse: 'bg-amber-500/20 text-amber-400',
  gauntlet: 'bg-blue-500/20 text-blue-400',
  hyperithm: 'bg-violet-500/20 text-violet-400',
};

function curatorBadge(curator: string): string {
  return CURATOR_COLORS[curator.toLowerCase()] || 'bg-zinc-700 text-zinc-300';
}

export function MorphoVaultsCard({ vaults, loading, onDeposit }: MorphoVaultsCardProps) {
  const allVaults = useMemo(() => {
    const flat: MorphoVault[] = [];
    for (const arr of Object.values(vaults)) flat.push(...arr);
    return flat.sort((a, b) => b.tvl_human - a.tvl_human);
  }, [vaults]);

  const assetGroups = useMemo(() => Object.keys(vaults).sort(), [vaults]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Vault className="w-4 h-4 text-purple-400" />
          Morpho Vaults
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Curated yield vaults on Arbitrum · Multiple strategies per asset
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-800 rounded-lg h-40" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && allVaults.length === 0 && (
        <p className="text-zinc-500 text-sm mt-6">No active Morpho vaults found</p>
      )}

      {/* Grouped by asset */}
      {!loading && assetGroups.map((asset) => (
        <div key={asset} className="mt-6">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">{asset} Vaults</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaults[asset].map((vault) => (
              <div
                key={vault.address}
                className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600 transition flex flex-col"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white font-medium text-sm leading-tight">{vault.name}</span>
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 flex-shrink-0">
                    {vault.asset}
                  </span>
                </div>

                {/* Curator badge */}
                <div className="mt-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${curatorBadge(vault.curator)}`}>
                    {vault.curator}
                  </span>
                </div>

                {/* TVL */}
                <div className="mt-3">
                  <span className="text-xs text-zinc-500">TVL</span>
                  <p className="text-xl font-bold text-white font-mono">{formatTvl(vault.tvl_human)}</p>
                </div>

                {/* Button */}
                <button
                  onClick={() => onDeposit(vault)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition"
                >
                  Deposit {vault.asset}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
