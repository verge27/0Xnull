import { useState, useCallback } from 'react';
import { useMorphoEarn } from '@/hooks/useMorphoEarn';
import { MorphoVaultsCard } from '@/components/morpho/MorphoVaultsCard';
import { MorphoPositionCard } from '@/components/morpho/MorphoPositionCard';
import { MorphoDepositModal } from '@/components/morpho/MorphoDepositModal';
import { MorphoWithdrawModal } from '@/components/morpho/MorphoWithdrawModal';
import type { MorphoVault, MorphoPosition } from '@/types/morpho';

interface MorphoEarnSectionProps {
  token: string | null;
  enabled: boolean;
  onToggle: () => void;
}

export function MorphoEarnSection({ token, enabled, onToggle }: MorphoEarnSectionProps) {
  const { vaults, positions, loading, error, txPending, deposit, withdraw, refresh } = useMorphoEarn(token);
  const [depositVault, setDepositVault] = useState<MorphoVault | null>(null);
  const [withdrawPosition, setWithdrawPosition] = useState<MorphoPosition | null>(null);

  const handleDeposit = useCallback(async (asset: string, amount: number, vaultAddress?: string) => {
    const res = await deposit(asset, amount, vaultAddress);
    if (!res.error) {
      refresh();
      setDepositVault(null);
    }
    return res;
  }, [deposit, refresh]);

  const handleWithdraw = useCallback(async (asset: string, amount: number, vaultAddress?: string, destinationAddress?: string) => {
    const res = await withdraw(asset, amount, vaultAddress, destinationAddress);
    if (!res.error) {
      refresh();
      setWithdrawPosition(null);
    }
    return res;
  }, [withdraw, refresh]);

  const allVaultsForAsset = depositVault ? (vaults[depositVault.asset] || [depositVault]) : [];

  return (
    <div className="space-y-4">
      {/* Toggle bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Curated Vaults — Morpho</h3>
          <p className="text-sm text-zinc-400">Earn yield through curated vault strategies on Arbitrum</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          aria-label="Toggle Morpho earn"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-[26px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">{error}</div>
          )}

          <MorphoVaultsCard vaults={vaults} loading={loading} onDeposit={(v) => setDepositVault(v)} />

          {positions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">Your Morpho Positions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {positions.map((pos) => (
                  <MorphoPositionCard key={pos.vault_address} position={pos} onWithdraw={(p) => setWithdrawPosition(p)} />
                ))}
              </div>
            </div>
          )}

          {depositVault && (
            <MorphoDepositModal
              vault={depositVault}
              allVaultsForAsset={allVaultsForAsset}
              txPending={txPending}
              onDeposit={handleDeposit}
              onClose={() => setDepositVault(null)}
            />
          )}

          {withdrawPosition && (
            <MorphoWithdrawModal
              position={withdrawPosition}
              txPending={txPending}
              onWithdraw={handleWithdraw}
              onClose={() => setWithdrawPosition(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
