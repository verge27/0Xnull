import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HealthFactorBadge } from './HealthFactorBadge';
import { lendingApi, parseAmount } from '@/lib/lending';
import { Loader2, CheckCircle, Copy, Check, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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

interface RepayRequest {
  status: string;
  repay_id: string;
  position_id: string;
  asset: string;
  amount: string;
  current_debt: string;
  deposit_address: string;
  note: string;
}

interface PendingRepay {
  repay_id: string;
  position_id: string;
  asset: string;
  amount: string;
  status: string;
  confirmations?: number;
  confirmations_required?: number;
  txid?: string;
  seen_at?: string;
}

type Step = 'input' | 'address' | 'polling' | 'done';

export const RepayModal = ({ open, onClose, token, positionId, collateral, borrowed, currentDebt, healthFactor, onSuccess }: RepayModalProps) => {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [repayRequest, setRepayRequest] = useState<RepayRequest | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingRepay | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const debtNum = parseAmount(currentDebt);
  const amtNum = parseFloat(amount || '0');
  const isFullRepay = amtNum >= debtNum;

  // Step 1 → Step 2: Request repay address
  const handleRequestAddress = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await lendingApi.requestRepay(token, positionId, amount);
      setRepayRequest(res);
      setStep('address');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Repay request failed');
    } finally {
      setLoading(false);
    }
  };

  const prevSeenRef = useRef(false);

  // Polling for confirmation
  const pollStatus = useCallback(async () => {
    if (!repayRequest) return;
    try {
      const res = await lendingApi.getPendingRepays(token);
      const match = res.pending?.find((p: PendingRepay) => p.repay_id === repayRequest.repay_id);
      if (match) {
        prevSeenRef.current = true;
        setPendingStatus(match);
        if (match.status === 'confirmed') {
          setStep('done');
          toast.success('Repayment complete!');
          onSuccess?.();
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (match.status === 'seen' || match.status === 'confirming') {
          if (step !== 'polling') setStep('polling');
        }
      } else if (prevSeenRef.current) {
        // Repay disappeared from pending — treat as confirmed
        setStep('done');
        toast.success('Repayment complete!');
        onSuccess?.();
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch { /* silently retry */ }
  }, [repayRequest, token, step, onSuccess]);

  useEffect(() => {
    if (step === 'address' || step === 'polling') {
      pollRef.current = setInterval(pollStatus, 15000);
      // Initial poll after short delay
      const t = setTimeout(pollStatus, 3000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        clearTimeout(t);
      };
    }
  }, [step, pollStatus]);

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep('input');
    setAmount('');
    setRepayRequest(null);
    setPendingStatus(null);
    prevSeenRef.current = false;
    onClose();
  };

  const copyAddress = () => {
    if (repayRequest?.deposit_address) {
      navigator.clipboard.writeText(repayRequest.deposit_address);
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confirmProgress = pendingStatus
    ? ((pendingStatus.confirmations || 0) / (pendingStatus.confirmations_required || 3)) * 100
    : 0;

  const isXmr = repayRequest?.asset === 'XMR';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay Loan</DialogTitle>
        </DialogHeader>

        {/* Step 1: Input amount */}
        {step === 'input' && (
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
            <Button onClick={handleRequestAddress} disabled={loading || !amount} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Requesting...</> : 'Get Repay Address'}
            </Button>
          </div>
        )}

        {/* Step 2: Show deposit address */}
        {step === 'address' && repayRequest && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount to Send</span>
                <span className="font-mono font-bold">{repayRequest.amount} {repayRequest.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Debt</span>
                <span className="font-mono">{repayRequest.current_debt}</span>
              </div>
            </div>

            {isXmr && repayRequest.deposit_address && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={`monero:${repayRequest.deposit_address}?tx_amount=${repayRequest.amount}`} size={180} />
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Deposit Address</Label>
              <div className="flex gap-2 mt-1">
                <Input value={repayRequest.deposit_address} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyAddress}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {repayRequest.note && (
              <p className="text-xs text-muted-foreground">{repayRequest.note}</p>
            )}

            <div className="flex items-center gap-2 justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Waiting for transaction...</span>
            </div>
          </div>
        )}

        {/* Step 3: Polling / confirming */}
        {step === 'polling' && pendingStatus && (
          <div className="space-y-4 py-4">
            {pendingStatus.status === 'seen' && (
              <div className="text-center space-y-3">
                <Eye className="w-10 h-10 text-green-400 mx-auto" />
                <p className="font-semibold">Transaction detected!</p>
                {pendingStatus.txid && (
                  <p className="text-xs text-muted-foreground font-mono">{pendingStatus.txid.slice(0, 20)}...</p>
                )}
                <p className="text-sm text-muted-foreground">Waiting for confirmations...</p>
              </div>
            )}

            {pendingStatus.status === 'confirming' && (
              <div className="text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="font-semibold">Confirming</p>
                <div className="space-y-1">
                  <Progress value={confirmProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {pendingStatus.confirmations}/{pendingStatus.confirmations_required} confirmations
                  </p>
                </div>
                {pendingStatus.txid && (
                  <p className="text-xs text-muted-foreground font-mono">{pendingStatus.txid.slice(0, 20)}...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold">{isFullRepay ? 'Loan Fully Repaid' : 'Repayment Complete'}</p>
            <p className="text-sm text-muted-foreground">
              Repaid {repayRequest?.amount} {repayRequest?.asset}
            </p>
            {isFullRepay && (
              <p className="text-sm text-green-400">Collateral has been released</p>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
