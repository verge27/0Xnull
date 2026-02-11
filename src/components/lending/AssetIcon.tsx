import { ASSET_META } from '@/lib/lending';

const ICON_COLORS: Record<string, string> = {
  XMR: 'bg-orange-500/20 text-orange-400',
  USDC: 'bg-blue-500/20 text-blue-400',
  USDT: 'bg-emerald-500/20 text-emerald-400',
  DAI: 'bg-amber-500/20 text-amber-400',
  LUSD: 'bg-blue-400/20 text-blue-300',
  GHO: 'bg-purple-500/20 text-purple-400',
  WETH: 'bg-indigo-500/20 text-indigo-400',
  WBTC: 'bg-orange-600/20 text-orange-500',
  ARB: 'bg-blue-600/20 text-blue-500',
  wstETH: 'bg-cyan-500/20 text-cyan-400',
};

interface AssetIconProps {
  asset: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const AssetIcon = ({ asset, size = 'md', showName = false }: AssetIconProps) => {
  const meta = ASSET_META[asset];
  const colorClass = ICON_COLORS[asset] || 'bg-muted text-muted-foreground';
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold font-mono flex-shrink-0`}>
        {asset.slice(0, 2)}
      </div>
      {showName && meta && (
        <div className="min-w-0">
          <div className="font-semibold text-foreground">{asset}</div>
          <div className="text-xs text-muted-foreground truncate">{meta.name}</div>
        </div>
      )}
    </div>
  );
};
