import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { PlaceBetResponse, BetStatusResponse } from '@/hooks/usePredictionBets';

interface BetDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betData: PlaceBetResponse | null;
  onCheckStatus: (betId: string) => Promise<BetStatusResponse | null>;
  onConfirmed: () => void;
}

export function BetDepositModal({
  open,
  onOpenChange,
  betData,
  onCheckStatus,
  onConfirmed,
}: BetDepositModalProps) {
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [status, setStatus] = useState<'awaiting_deposit' | 'confirmed' | string>('awaiting_deposit');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [polling, setPolling] = useState(false);

  // Calculate time left
  useEffect(() => {
    if (!betData?.expires_at) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const expires = new Date(betData.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [betData?.expires_at]);

  // Poll for status updates
  useEffect(() => {
    if (!open || !betData || status === 'confirmed') return;

    setPolling(true);
    
    const pollStatus = async () => {
      const result = await onCheckStatus(betData.bet_id);
      if (result) {
        setStatus(result.status);
        if (result.status === 'confirmed') {
          toast.success('Deposit confirmed!');
          onConfirmed();
        }
      }
    };

    // Initial check
    pollStatus();

    // Poll every 10 seconds
    const interval = setInterval(pollStatus, 10000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [open, betData, status, onCheckStatus, onConfirmed]);

  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (!betData) return null;

  const moneroUri = `monero:${betData.deposit_address}?tx_amount=${betData.amount_xmr}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'confirmed' ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Bet Confirmed!
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting for Deposit
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Bet summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">
                Bet on{' '}
                <Badge className={betData.side === 'YES' ? 'bg-emerald-600' : 'bg-red-600'}>
                  {betData.side}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ${betData.amount_usd.toFixed(2)} USD
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">{betData.amount_xmr.toFixed(6)} XMR</p>
              <p className="text-xs text-muted-foreground">
                @ ${betData.xmr_price.toFixed(2)}/XMR
              </p>
            </div>
          </div>

          {status === 'confirmed' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Your bet has been placed!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your position has been recorded. Good luck!
              </p>
              <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={moneroUri} size={180} level="M" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Scan with your Monero wallet
                </p>
              </div>

              {/* Address */}
              <div>
                <Label className="text-xs text-muted-foreground">Send exactly to this address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    readOnly
                    value={betData.deposit_address}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(betData.deposit_address, 'address')}
                  >
                    {copied === 'address' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label className="text-xs text-muted-foreground">Amount (exact)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    readOnly
                    value={`${betData.amount_xmr.toFixed(12)} XMR`}
                    className="font-mono text-lg font-bold"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(betData.amount_xmr.toFixed(12), 'amount')}
                  >
                    {copied === 'amount' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Timer and status */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Expires in:</span>
                </div>
                <span className="font-mono font-medium text-orange-500">{timeLeft}</span>
              </div>

              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {polling && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Checking for payment every 10s...</span>
              </div>

              {/* Important note */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-500">
                  <strong>Important:</strong> Save your bet ID:{' '}
                  <code className="bg-background px-1 py-0.5 rounded">{betData.bet_id}</code>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is your only reference for this bet. Keep it safe.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
