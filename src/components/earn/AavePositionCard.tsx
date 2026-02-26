import type { EarnPosition } from '@/types/earn';

interface AavePositionCardProps {
  position: EarnPosition;
  onWithdraw: (asset: string) => void;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AavePositionCard({ position, onWithdraw }: AavePositionCardProps) {
  const interest = parseFloat(position.accrued_interest) || 0;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{position.asset}</span>
        {interest > 0 && (
          <span className="text-xs text-emerald-400 font-mono">+{formatUsd(interest)} earned</span>
        )}
      </div>

      <p className="text-xl font-bold text-foreground font-mono">{position.balance_formatted}</p>
      <p className="text-xs text-zinc-400">{formatUsd(position.value_usd)}</p>
      <p className="text-xs text-zinc-500">APY at entry: {(position.apy_at_entry * 100).toFixed(2)}%</p>

      <button
        onClick={() => onWithdraw(position.asset)}
        className="mt-auto w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        Withdraw
      </button>

      <p className="text-[11px] text-zinc-500 text-center">Deposited {formatDate(position.deposited_at)}</p>
    </div>
  );
}
