import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssetIcon } from './AssetIcon';
import { HealthFactorBadge } from './HealthFactorBadge';
import {
  lendingApi, ASSET_META, RISK_PARAMS,
  calcHealthFactor, calcLiquidationPrice,
  parseAmount, formatUsd, healthFactorColor,
  type BorrowResponse,
} from '@/lib/lending';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BorrowFlowProps {
  open: boolean;
  onClose: () => void;
  token: string;
  prices: Record<string, string>;
  defaultCollateral?: string;
  defaultBorrow?: string;
  onSuccess?: () => void;
}

const collateralAssets = Object.entries(RISK_PARAMS).filter(([, r]) => r.can_collateral).map(([a]) => a);
const borrowAssets = Object.entries(RISK_PARAMS).filter(([, r]) => r.can_borrow).map(([a]) => a);

export const BorrowFlow = ({ open, onClose, token, prices, defaultCollateral, defaultBorrow, onSuccess }: BorrowFlowProps) => {
  const [collateralAsset, setCollateralAsset] = useState(defaultCollateral || 'WETH');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAsset, setBorrowAsset] = useState(defaultBorrow || 'USDC');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BorrowResponse | null>(null);

  const collateralPrice = parseAmount(prices[collateralAsset] || '0');
  const borrowPrice = parseAmount(prices[borrowAsset] || '0');
  const risk = RISK_PARAMS[collateralAsset];

  const collateralUsd = parseFloat(collateralAmount || '0') * collateralPrice;
  const borrowUsd = parseFloat(borrowAmount || '0') * borrowPrice;
  const maxBorrowUsd = collateralUsd * (risk?.ltv || 0);
  const maxBorrowAmount = borrowPrice > 0 ? maxBorrowUsd / borrowPrice : 0;

  const projectedHF = useMemo(() => {
    if (borrowUsd <= 0) return Infinity;
    return calcHealthFactor(collateralUsd, risk?.liquidation_threshold || 0.85, borrowUsd);
  }, [collateralUsd, borrowUsd, risk]);

  const liquidationPrice = useMemo(() => {
    const cAmt = parseFloat(collateralAmount || '0');
    if (cAmt <= 0 || borrowUsd <= 0) return 0;
    return calcLiquidationPrice(borrowUsd, cAmt, risk?.liquidation_threshold || 0.85);
  }, [collateralAmount, borrowUsd, risk]);

  const handleBorrow = async () => {
    if (!collateralAmount || !borrowAmount) return;
    setLoading(true);
    try {
      const res = await lendingApi.borrow(token, collateralAsset, collateralAmount, borrowAsset, borrowAmount);
      setResult(res);
      toast.success('Borrow position created');
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Borrow failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCollateralAmount('');
    setBorrowAmount('');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Borrow</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold">Position Created</p>
            <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral</span><span className="font-mono">{result.collateral}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Borrowed</span><span className="font-mono">{result.borrowed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Health Factor</span><HealthFactorBadge value={parseFloat(result.health_factor)} size="sm" /></div>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Collateral */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Collateral</Label>
              <select
                value={collateralAsset}
                onChange={(e) => setCollateralAsset(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {collateralAssets.map((a) => (
                  <option key={a} value={a}>{a} — LTV {((RISK_PARAMS[a]?.ltv || 0) * 100).toFixed(0)}%</option>
                ))}
              </select>
              <Input
                type="number"
                placeholder={`0.00 ${collateralAsset}`}
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="font-mono"
                step="any"
              />
              {collateralUsd > 0 && (
                <p className="text-xs text-muted-foreground">≈ {formatUsd(collateralUsd)}</p>
              )}
            </div>

            {/* Borrow */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Borrow</Label>
              <select
                value={borrowAsset}
                onChange={(e) => setBorrowAsset(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {borrowAssets.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`0.00 ${borrowAsset}`}
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  className="font-mono"
                  step="any"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBorrowAmount(maxBorrowAmount.toFixed(6))}
                  disabled={maxBorrowAmount <= 0}
                >
                  MAX
                </Button>
              </div>
              {maxBorrowUsd > 0 && (
                <p className="text-xs text-muted-foreground">Max borrowable: {formatUsd(maxBorrowUsd)} ({maxBorrowAmount.toFixed(4)} {borrowAsset})</p>
              )}
            </div>

            {/* Health Factor Calculator */}
            {borrowUsd > 0 && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Projected Health Factor</span>
                  <HealthFactorBadge value={projectedHF} />
                </div>
                {liquidationPrice > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Liquidation Price ({collateralAsset})</span>
                    <span className="font-mono text-red-400">{formatUsd(liquidationPrice)}</span>
                  </div>
                )}
                {projectedHF < 1.5 && projectedHF >= 1.2 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Warning: Low health factor. Risk of liquidation if prices move against you.
                  </div>
                )}
                {projectedHF < 1.2 && projectedHF > 0 && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Danger: Very close to liquidation threshold.
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleBorrow}
              disabled={loading || !collateralAmount || !borrowAmount || projectedHF < 1.0}
              className="w-full"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating position...</> : 'Borrow'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
