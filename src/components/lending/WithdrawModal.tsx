import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lendingApi, parseAmount } from '@/lib/lending';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  asset: string;
  currentBalance: string;
  interestEarned: string;
  onSuccess?: () => void;
}

export const WithdrawModal = ({ open, onClose, token, asset, currentBalance, interestEarned, onSuccess }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      await lendingApi.withdraw(token, asset, amount);
      setSuccess(true);
      toast.success(`Withdrew ${amount} ${asset}`);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw {asset}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold">Withdrawal successful</p>
            <p className="text-sm text-muted-foreground">Withdrew {amount} {asset}</p>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-mono">{currentBalance} {asset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Earned</span>
                <span className="font-mono text-green-400">+{interestEarned} {asset}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                  step="any"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(currentBalance)}
                >
                  MAX
                </Button>
              </div>
            </div>
            <Button onClick={handleWithdraw} disabled={loading || !amount} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Withdrawing...</> : `Withdraw ${asset}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
