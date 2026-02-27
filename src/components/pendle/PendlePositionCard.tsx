import type { PendlePosition } from '@/types/pendle';

interface PendlePositionCardProps {
  position: PendlePosition;
  onWithdraw: (position: PendlePosition) => void;
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtAmount(n: number, token: string): string {
  const dec = ['USDC', 'USDT'].includes(token) ? 2 : ['WBTC'].includes(token) ? 6 : 4;
  return `${n.toFixed(dec)} ${token}`;
}

export function PendlePositionCard({ position, onWithdraw }: PendlePositionCardProps) {
  const days = daysUntil(position.expiry);
  const isActive = position.status === 'active';

  const statusBadge = isActive
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    : 'bg-zinc-700 text-zinc-400 border border-zinc-700';

  const daysColor = days < 7 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-zinc-400';

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">{position.deposit_token}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge}`}>{position.status}</span>
        </div>
        <span className="text-emerald-400 font-mono text-lg">{position.fixed_apy_pct.toFixed(2)}% Fixed</span>
      </div>

      {/* Amount */}
      <div className="mt-3">
        <span className="text-xs text-zinc-500">Deposited</span>
        <p className="text-xl text-white font-mono">{fmtAmount(position.amount_deposited, position.deposit_token)}</p>
        {isActive && position.current_value_estimate > 0 && (
          <p className="text-sm text-zinc-400 mt-0.5">
            Est. value: {fmtAmount(position.current_value_estimate, position.deposit_token)}
          </p>
        )}
      </div>

      {/* Maturity */}
      <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
        {position.is_matured ? (
          <>
            <p className="text-emerald-400 text-sm flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              Matured — ready to redeem
            </p>
            <p className="text-xs text-zinc-500 mt-1">Your PT redeems 1:1 for {position.deposit_token}</p>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Matures: {fmtDate(position.expiry)}</span>
            <span className={`text-sm font-medium ${daysColor}`}>{days}d left</span>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-4 flex-1 flex flex-col justify-end">
        {isActive ? (
          position.is_matured ? (
            <button
              onClick={() => onWithdraw(position)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition"
            >
              Redeem
            </button>
          ) : (
            <>
              <button
                onClick={() => onWithdraw(position)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2 text-sm font-medium transition"
              >
                Withdraw Early
              </button>
              <p className="text-xs text-amber-400/70 mt-1.5 text-center">
                Early withdrawal sells PT on market — may incur slippage
              </p>
            </>
          )
        ) : (
          <p className="text-zinc-500 text-sm text-center">Position closed</p>
        )}
      </div>

      {/* Created date */}
      <p className="text-xs text-zinc-600 text-right mt-3">Opened: {fmtDate(position.created_at)}</p>
    </div>
  );
}
