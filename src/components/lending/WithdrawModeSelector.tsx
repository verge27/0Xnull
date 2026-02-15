import { Shield, Zap, Clock, DollarSign, Link2Off, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseAmount, formatBalance } from '@/lib/lending';

export type WithdrawMode = 'direct' | 'shielded';

interface WithdrawModeSelectorProps {
  mode: WithdrawMode;
  onModeChange: (mode: WithdrawMode) => void;
  amount: string;
  asset: string;
}

const SHIELD_FEE_PERCENT = 0.0025; // 0.25%

export function getShieldFee(amount: string): number {
  return parseAmount(amount) * SHIELD_FEE_PERCENT;
}

export function getNetAmount(amount: string, mode: WithdrawMode): number {
  const amt = parseAmount(amount);
  if (mode === 'shielded') return amt - getShieldFee(amount);
  return amt;
}

export function WithdrawModeSelector({ mode, onModeChange, amount, asset }: WithdrawModeSelectorProps) {
  const amtNum = parseAmount(amount);
  const shieldFee = amtNum * SHIELD_FEE_PERCENT;
  const hasAmount = amtNum > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Withdrawal Method</p>
      <div className="grid grid-cols-2 gap-2">
        {/* Direct */}
        <Card
          className={`cursor-pointer transition-all ${mode === 'direct' ? 'border-primary ring-1 ring-primary/30' : 'border-border/50 hover:border-border'}`}
          onClick={() => onModeChange('direct')}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Direct</span>
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~5 seconds</div>
              <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ~$0.003 gas</div>
              <div className="flex items-center gap-1"><Link2 className="w-3 h-3" /> On-chain link visible</div>
            </div>
            {hasAmount && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">You receive</p>
                <p className="text-xs font-mono font-medium">{formatBalance(amtNum, asset)} {asset}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shielded */}
        <Card
          className={`cursor-pointer transition-all relative ${mode === 'shielded' ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-border/50 hover:border-border'}`}
          onClick={() => onModeChange('shielded')}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Shielded</span>
              <Badge className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/30 ml-auto">Coming Soon</Badge>
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~30-60 seconds</div>
              <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ~$0.15 gas + 0.25% fee</div>
              <div className="flex items-center gap-1"><Link2Off className="w-3 h-3 text-emerald-400" /> No on-chain link</div>
            </div>
            {hasAmount && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">Shield fee (0.25%)</p>
                <p className="text-[10px] font-mono text-amber-400">-{formatBalance(shieldFee, asset)} {asset}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">You receive</p>
                <p className="text-xs font-mono font-medium">{formatBalance(amtNum - shieldFee, asset)} {asset}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
