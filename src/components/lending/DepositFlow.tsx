import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DepositStatusTracker } from './DepositStatusTracker';
import { lendingApi, ASSET_META, type DepositRequest } from '@/lib/lending';
import { Copy, Check, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface DepositFlowProps {
  open: boolean;
  onClose: () => void;
  asset?: string;
  token: string;
  onSuccess?: () => void;
}

interface PendingDeposit {
  deposit_id: string;
  asset: string;
  amount: string;
  status: string;
  confirmations?: number;
  confirmations_required?: number;
  txid?: string;
  seen_at?: string;
}

export const DepositFlow = ({ open, onClose, asset: defaultAsset, token, onSuccess }: DepositFlowProps) => {
  const [step, setStep] = useState<'input' | 'awaiting'>('input');
  const [asset, setAsset] = useState(defaultAsset || 'USDC');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [deposit, setDeposit] = useState<DepositRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PendingDeposit | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meta = ASSET_META[asset];
  const isXmr = asset === 'XMR';

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const result = await lendingApi.requestDeposit(token, asset, amount);
      setDeposit(result);
      setStep('awaiting');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const prevSeenRef = useRef(false);

  const pollStatus = useCallback(async () => {
    if (!deposit) return;
    try {
      const res = await lendingApi.getPendingDeposits(token);
      const list = res.deposits || (res as any).pending || [];
      const match = list.find((d: PendingDeposit) => d.deposit_id === deposit.deposit_id);
      if (match) {
        prevSeenRef.current = true;
        setPendingStatus(match);
        if (match.status === 'confirmed') {
          if (pollRef.current) clearInterval(pollRef.current);
          toast.success('Deposit confirmed!');
          onSuccess?.();
          setTimeout(() => handleClose(), 3000);
        }
      } else if (prevSeenRef.current) {
        // Deposit disappeared from pending — treat as confirmed
        if (pollRef.current) clearInterval(pollRef.current);
        toast.success('Deposit confirmed!');
        onSuccess?.();
        setTimeout(() => handleClose(), 3000);
      }
    } catch { /* silently retry */ }
  }, [deposit, token, onSuccess]);

  useEffect(() => {
    if (step === 'awaiting' && deposit) {
      pollRef.current = setInterval(pollStatus, 15000);
      const t = setTimeout(pollStatus, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        clearTimeout(t);
      };
    }
  }, [step, deposit, pollStatus]);

  const copyAddress = () => {
    if (deposit?.deposit_address) {
      navigator.clipboard.writeText(deposit.deposit_address);
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep('input');
    setAmount('');
    setDeposit(null);
    setPendingStatus(null);
    prevSeenRef.current = false;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Supply {asset}
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Asset</Label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.keys(ASSET_META).map((a) => (
                  <option key={a} value={a}>{a} — {ASSET_META[a].name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input
                type="number"
                placeholder={`0.00 ${asset}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono mt-1"
                step="any"
                min="0"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading || !amount} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating deposit...</> : `Supply ${asset}`}
            </Button>
          </div>
        )}

        {step === 'awaiting' && deposit && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Deposit ID</span>
                <span className="font-mono text-xs">{deposit.deposit_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-mono font-bold">{deposit.amount} {deposit.asset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isXmr ? 'Network' : 'Chain'}
                </span>
                <span className="text-xs">{isXmr ? 'Monero' : deposit.chain || 'Arbitrum One'}</span>
              </div>
            </div>

            {deposit.deposit_address && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={isXmr ? `monero:${deposit.deposit_address}?tx_amount=${deposit.amount}` : deposit.deposit_address} size={180} />
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Deposit Address</Label>
              <div className="flex gap-2 mt-1">
                <Input value={deposit.deposit_address} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyAddress}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {deposit.token_contract && (
              <div className="text-xs text-muted-foreground">
                Token Contract: <span className="font-mono">{deposit.token_contract}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Expires in {deposit.expires}</span>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              {isXmr
                ? `Send exactly ${deposit.amount} XMR to the address above. Your position will be credited after 3 confirmations (~6 minutes).`
                : `Send ${deposit.amount} ${deposit.asset} on Arbitrum One to the address above. For maximum privacy, shield your tokens via Railgun first.`
              }
            </div>

            {/* Granular status tracking */}
            <DepositStatusTracker
              deposit={pendingStatus || {
                deposit_id: deposit.deposit_id,
                asset: deposit.asset,
                amount: deposit.amount,
                status: 'awaiting_deposit',
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
