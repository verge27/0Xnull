import { useState, useCallback } from 'react';
import { usePendleEarn } from '@/hooks/usePendleEarn';
import { PendleMarketsCard } from '@/components/pendle/PendleMarketsCard';
import { PendlePositionCard } from '@/components/pendle/PendlePositionCard';
import { PendleDepositModal } from '@/components/pendle/PendleDepositModal';
import { PendleWithdrawModal } from '@/components/pendle/PendleWithdrawModal';
import type { PendleMarket, PendlePosition } from '@/types/pendle';

interface PendleEarnSectionProps {
  token: string | null;
  enabled: boolean;
  onToggle: () => void;
}

export function PendleEarnSection({ token, enabled, onToggle }: PendleEarnSectionProps) {
  const { markets, comparisons, bestAdvantage, positions, loading, error, txPending, deposit, withdraw, refresh } = usePendleEarn(token);
  const [depositMarket, setDepositMarket] = useState<PendleMarket | null>(null);
  const [withdrawPosition, setWithdrawPosition] = useState<PendlePosition | null>(null);

  const handleDeposit = useCallback(async (marketAddress: string, amount: number, userAddress: string) => {
    const res = await deposit(marketAddress, amount, userAddress);
    if (!res.error) {
      refresh();
      setDepositMarket(null);
    }
    return res;
  }, [deposit, refresh]);

  const handleWithdraw = useCallback(async (positionId: string, userAddress: string) => {
    const res = await withdraw(positionId, userAddress);
    if (!res.error) {
      refresh();
      setWithdrawPosition(null);
    }
    return res;
  }, [withdraw, refresh]);

  const depositComparison = depositMarket
    ? comparisons.find((c) => c.market_address === depositMarket.market_address)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Toggle bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Fixed Yield — Pendle V2</h3>
          <p className="text-sm text-zinc-400">Lock in guaranteed rates on Arbitrum · Aave comparison included</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          aria-label="Toggle Pendle earn"
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

          <PendleMarketsCard
            markets={markets}
            comparisons={comparisons}
            bestAdvantage={bestAdvantage}
            loading={loading}
            onDeposit={(mkt) => setDepositMarket(mkt)}
          />

          {positions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">Your Fixed-Yield Positions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {positions.map((pos) => (
                  <PendlePositionCard key={pos.id} position={pos} onWithdraw={(p) => setWithdrawPosition(p)} />
                ))}
              </div>
            </div>
          )}

          {depositMarket && (
            <PendleDepositModal
              market={depositMarket}
              comparison={depositComparison}
              txPending={txPending}
              onDeposit={handleDeposit}
              onClose={() => setDepositMarket(null)}
            />
          )}

          {withdrawPosition && (
            <PendleWithdrawModal
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
