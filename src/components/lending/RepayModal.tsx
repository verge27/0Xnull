import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HealthFactorBadge } from './HealthFactorBadge';
import { lendingApi, parseAmount } from '@/lib/lending';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RepayModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  positionId: string;
  collateral: string;
  borrowed: string;
  currentDebt: string;
  healthFactor: string;
  onSuccess?: () => void;
}

export const RepayModal = ({ open, onClose, token, positionId, collateral, borrowed, currentDebt, healthFactor, onSuccess }: RepayModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ amount_repaid: string; fully_closed: boolean; collateral_released: boolean } | null>(null);

  const debtNum = parseAmount(currentDebt);
  const amtNum = parseFloat(amount || '0');
  const isFullRepay = amtNum >= debtNum;

  const handleRepay = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await lendingApi.repay(token, positionId, amount);
      setResult(res);
      toast.success(`Repaid ${res.amount_repaid}`);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Repay failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay Loan</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold">{result.fully_closed ? 'Loan Fully Repaid' : 'Partial Repayment'}</p>
            <p className="text-sm text-muted-foreground">Repaid {result.amount_repaid}</p>
            {result.collateral_released && (
              <p className="text-sm text-green-400">Collateral has been released</p>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral</span>
                <span className="font-mono">{collateral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrowed</span>
                <span className="font-mono">{borrowed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Debt</span>
                <span className="font-mono font-bold">{currentDebt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Health Factor</span>
                <HealthFactorBadge value={parseAmount(healthFactor)} size="sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Repay Amount</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                  step="any"
                />
                <Button variant="outline" size="sm" onClick={() => setAmount(currentDebt)}>MAX</Button>
              </div>
            </div>
            {isFullRepay && (
              <p className="text-xs text-green-400">Full repay — your collateral ({collateral}) will be released</p>
            )}
            <Button onClick={handleRepay} disabled={loading || !amount} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Repaying...</> : isFullRepay ? 'Full Repay + Release Collateral' : 'Partial Repay'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
