import type { MorphoPosition } from '@/types/morpho';

interface MorphoPositionCardProps {
  position: MorphoPosition;
  onWithdraw: (position: MorphoPosition) => void;
}

const CURATOR_COLORS: Record<string, string> = {
  steakhouse: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  gauntlet: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  hyperithm: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
};

function curatorBadge(curator: string): string {
  return CURATOR_COLORS[curator.toLowerCase()] || 'bg-zinc-700 text-zinc-300 border-zinc-700';
}

function fmtAmount(n: number, asset: string): string {
  const dec = ['USDC', 'USDT'].includes(asset) ? 2 : 4;
  return `${n.toFixed(dec)} ${asset}`;
}

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function MorphoPositionCard({ position, onWithdraw }: MorphoPositionCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">{position.asset_symbol}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs border capitalize ${curatorBadge(position.curator)}`}>
            {position.curator}
          </span>
        </div>
        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400">Morpho</span>
      </div>

      {/* Vault name */}
      <p className="text-sm text-zinc-400 mt-1">{position.vault_name}</p>

      {/* Balance */}
      <div className="mt-3">
        <span className="text-xs text-zinc-500">Balance</span>
        <p className="text-xl text-white font-mono">{fmtAmount(position.assets_human, position.asset_symbol)}</p>
      </div>

      {/* Max withdraw */}
      <div className="mt-2 bg-zinc-800/50 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Max withdraw</span>
          <span className="text-white font-mono">{fmtAmount(position.max_withdraw_human, position.asset_symbol)}</span>
        </div>
      </div>

      {/* Vault address */}
      <div className="flex justify-between text-xs text-zinc-600 mt-2">
        <span>Vault</span>
        <a
          href={`https://arbiscan.io/address/${position.vault_address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 transition font-mono"
        >
          {truncateAddr(position.vault_address)}
        </a>
      </div>

      {/* Withdraw */}
      <button
        onClick={() => onWithdraw(position)}
        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition"
      >
        Withdraw
      </button>
    </div>
  );
}
