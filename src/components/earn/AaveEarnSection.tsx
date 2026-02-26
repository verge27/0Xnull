import { useState } from 'react';
import { useAaveEarn } from '@/hooks/useAaveEarn';
import { AaveRatesCard } from '@/components/earn/AaveRatesCard';
import { AavePositionCard } from '@/components/earn/AavePositionCard';
import { DepositModal } from '@/components/earn/DepositModal';
import { WithdrawModal as EarnWithdrawModal } from '@/components/earn/WithdrawModal';

interface AaveEarnSectionProps {
  token: string | null;
  shieldedBalances?: Record<string, string>;
  enabled: boolean;
  onToggle: () => void;
}

export function AaveEarnSection({ token, shieldedBalances, enabled, onToggle }: AaveEarnSectionProps) {
  const { rates, positions, loading, error, txPending, deposit, withdraw, refresh } = useAaveEarn(token);
  const [depositAsset, setDepositAsset] = useState<string | null>(null);
  const [withdrawAsset, setWithdrawAsset] = useState<string | null>(null);

  const depositRate = depositAsset ? rates.find((r) => r.asset === depositAsset)?.supply_apy : undefined;
  const withdrawPosition = withdrawAsset ? positions.find((p) => p.asset === withdrawAsset) : undefined;


  const handleWithdraw = async (asset: string, amount: string, destination: "reshield" | "wallet", walletAddress?: string) => {
    const res = await withdraw(asset, amount, destination, walletAddress);
    if (!res.error) refresh();
    return res;
  };

  return (
    <div className="space-y-4">
      {/* Toggle bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Private Yield — Aave V3</h3>
          <p className="text-sm text-zinc-400">Earn on shielded assets via Railgun × Aave on Arbitrum</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          aria-label="Toggle Aave earn"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-[26px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          <AaveRatesCard rates={rates} loading={loading} onDeposit={(asset) => setDepositAsset(asset)} />

          {positions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mt-8 mb-4">Your Earning Positions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {positions.map((pos) => (
                  <AavePositionCard key={pos.asset} position={pos} onWithdraw={(asset) => setWithdrawAsset(asset)} />
                ))}
              </div>
            </div>
          )}

          {depositAsset && (
            <DepositModal
              asset={depositAsset}
              rate={depositRate}
              token={token}
              onClose={() => setDepositAsset(null)}
              onSuccess={refresh}
            />
          )}

          {withdrawAsset && withdrawPosition && (
            <EarnWithdrawModal
              asset={withdrawAsset}
              position={{ balance_formatted: withdrawPosition.balance_formatted, value_usd: withdrawPosition.value_usd }}
              txPending={txPending}
              onWithdraw={handleWithdraw}
              onClose={() => setWithdrawAsset(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
