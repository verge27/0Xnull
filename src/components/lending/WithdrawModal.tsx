import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lendingApi, parseAmount } from '@/lib/lending';
import { isValidDestinationAddress, addressPlaceholder, addressError } from '@/lib/addressValidation';
import { Loader2, CheckCircle, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  asset: string;
  currentBalance: string;
  interestEarned: string;
  availableLiquidity?: string;
  onSuccess?: () => void;
}

interface WithdrawResult {
  status: string;
  amount: string;
  asset: string;
  positions_closed: string[];
  payout?: {
    tx_hash: string;
    fee_xmr: string;
    destination: string;
  };
}

export const WithdrawModal = ({ open, onClose, token, asset, currentBalance, interestEarned, availableLiquidity, onSuccess }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [copied, setCopied] = useState(false);

  const balanceNum = parseAmount(currentBalance);
  const amountNum = parseFloat(amount || '0');
  const liquidityNum = availableLiquidity ? parseAmount(availableLiquidity) : Infinity;
  const addrErr = addressError(asset, destination);
  const isValidAddr = destination.length > 0 && !addrErr;
  const exceedsBalance = amountNum > balanceNum;
  const exceedsLiquidity = amountNum > liquidityNum && liquidityNum < Infinity;

  // Format balance for MAX button — trim trailing zeros but keep meaningful precision
  const maxAmount = balanceNum > 0 ? balanceNum.toString() : '0';

  const handleWithdraw = async () => {
    if (!amount || amountNum <= 0 || !isValidAddr || exceedsBalance) return;
    setLoading(true);
    try {
      const res = await lendingApi.withdraw(token, asset, amount, destination);
      setResult(res as WithdrawResult);
      toast.success(`Withdrew ${(res as WithdrawResult).amount} ${asset}`);
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Withdrawal failed';
      // Parse "Only X available" errors to show a clearer message
      const availMatch = msg.match(/Only\s+([\d.E\-+]+)\s+(\w+)\s+available/i);
      if (availMatch) {
        const availNum = parseFloat(availMatch[1]);
        if (availNum < 0.0001) {
          toast.error(`No ${asset} available to withdraw. The balance may still be settling — please try again in a few minutes.`);
        } else {
          toast.error(`Only ${availNum} ${asset} available to withdraw.`);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDestination('');
    setResult(null);
    onClose();
  };

  const copyTxHash = () => {
    if (result?.payout?.tx_hash) {
      navigator.clipboard.writeText(result.payout.tx_hash);
      setCopied(true);
      toast.success('TX hash copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw {asset}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold">Withdrawal successful</p>
            <p className="text-sm text-muted-foreground">Withdrew {result.amount} {asset}</p>
            {result.payout && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TX Hash</span>
                  <button onClick={copyTxHash} className="flex items-center gap-1 font-mono text-xs hover:text-primary">
                    {result.payout.tx_hash.slice(0, 12)}...
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-mono">{result.payout.fee_xmr} XMR</span>
                </div>
              </div>
            )}
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
              {availableLiquidity && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool Liquidity</span>
                  <span className="font-mono">{availableLiquidity} {asset}</span>
                </div>
              )}
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
                <Button variant="outline" size="sm" onClick={() => setAmount(maxAmount)}>
                  MAX
                </Button>
              </div>
              {exceedsBalance && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Only {maxAmount} {asset} available
                </p>
              )}
              {!exceedsBalance && exceedsLiquidity && (
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Only {availableLiquidity} {asset} available in pool
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Destination Address</Label>
              <Input
                placeholder={addressPlaceholder(asset)}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="font-mono text-xs mt-1"
              />
              {addrErr && destination.length > 0 && (
                <p className="text-xs text-destructive mt-1">{addrErr}</p>
              )}
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={loading || !amount || amountNum <= 0 || !isValidAddr || exceedsBalance || exceedsLiquidity}
              className="w-full"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Withdrawing...</> : `Withdraw ${asset}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
