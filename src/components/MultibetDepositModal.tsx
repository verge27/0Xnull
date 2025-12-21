import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Clock, Loader2, ExternalLink, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { MultibetSlip } from '@/services/api';

interface MultibetDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slip: MultibetSlip | null;
  onCheckStatus: (slipId: string) => Promise<MultibetSlip>;
  onUpdatePayoutAddress: (slipId: string, address: string) => Promise<any>;
  onConfirmed: () => void;
}

export function MultibetDepositModal({
  open,
  onOpenChange,
  slip,
  onCheckStatus,
  onUpdatePayoutAddress,
  onConfirmed,
}: MultibetDepositModalProps) {
  const [copied, setCopied] = useState<'address' | 'amount' | 'viewKey' | null>(null);
  const [status, setStatus] = useState<string>(slip?.status || 'awaiting_deposit');
  const [polling, setPolling] = useState(false);
  const [payoutAddress, setPayoutAddress] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [showViewKey, setShowViewKey] = useState(false);

  // Sync status with slip when it changes
  useEffect(() => {
    if (slip?.status) {
      setStatus(slip.status);
    }
  }, [slip?.slip_id, slip?.status]);

  // Poll for status updates
  const onCheckStatusRef = useRef(onCheckStatus);
  const onConfirmedRef = useRef(onConfirmed);
  onCheckStatusRef.current = onCheckStatus;
  onConfirmedRef.current = onConfirmed;

  useEffect(() => {
    if (!open || !slip || status === 'confirmed' || status === 'resolved' || status === 'paid') return;

    setPolling(true);
    let isMounted = true;

    const pollStatus = async () => {
      if (!isMounted) return;
      try {
        const result = await onCheckStatusRef.current(slip.slip_id);
        if (result && isMounted) {
          setStatus(result.status);
          if (result.status === 'confirmed') {
            toast.success('Deposit confirmed! Bets are now active.');
            onConfirmedRef.current();
          }
        }
      } catch (e) {
        console.error('Poll status error:', e);
      }
    };

    // Initial check
    pollStatus();

    // Poll every 15 seconds
    const interval = setInterval(pollStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      setPolling(false);
    };
  }, [open, slip?.slip_id, status]);

  const copyToClipboard = async (text: string, type: 'address' | 'amount' | 'viewKey') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSubmitPayoutAddress = async () => {
    if (!slip || !payoutAddress) return;

    if (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8')) {
      toast.error('Invalid Monero address');
      return;
    }

    setSubmittingPayout(true);
    try {
      await onUpdatePayoutAddress(slip.slip_id, payoutAddress);
      toast.success('Payout address updated');
      setPayoutAddress('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update address';
      toast.error(message);
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (!slip) return null;

  const isConfirmed = status === 'confirmed' || status === 'resolved' || status === 'paid';
  const moneroUri = `monero:${slip.xmr_address}?tx_amount=${slip.total_amount_xmr}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] max-h-[90vh] flex flex-col p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            {isConfirmed ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Bets Confirmed!
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                Awaiting Deposit
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Summary */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-2 border border-primary/20">
            <div className="flex justify-between text-center gap-1">
              <div className="bg-background/50 rounded-md p-2 flex-1">
                <p className="text-xs text-muted-foreground">Legs</p>
                <p className="text-lg font-bold text-primary">{slip.legs.length}</p>
              </div>
              <div className="bg-background/50 rounded-md p-2 flex-1">
                <p className="text-xs text-muted-foreground">USD</p>
                <p className="text-base font-bold text-emerald-500">${slip.total_amount_usd.toFixed(2)}</p>
              </div>
              <div className="bg-background/50 rounded-md p-2 flex-1">
                <p className="text-xs text-muted-foreground">XMR</p>
                <p className="text-xs font-bold font-mono text-amber-500">{slip.total_amount_xmr.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* QR Code and Address */}
          {!isConfirmed && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-lg border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <QRCodeSVG value={moneroUri} size={140} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-amber-500">Deposit Address</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={slip.xmr_address}
                    readOnly
                    className="font-mono text-xs bg-muted/50 border-amber-500/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-amber-500/30 hover:bg-amber-500/10 flex-shrink-0"
                    onClick={() => copyToClipboard(slip.xmr_address, 'address')}
                  >
                    {copied === 'address' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-amber-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-amber-500">Amount</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${slip.total_amount_xmr.toFixed(12)} XMR`}
                    readOnly
                    className="font-mono text-sm bg-muted/50 border-amber-500/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-amber-500/30 hover:bg-amber-500/10 flex-shrink-0"
                    onClick={() => copyToClipboard(slip.total_amount_xmr.toString(), 'amount')}
                  >
                    {copied === 'amount' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-amber-500" />
                    )}
                  </Button>
                </div>
              </div>

              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-amber-500 bg-amber-500/10 rounded-md py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking for deposit...
                </div>
              )}
            </div>
          )}

            {/* Legs */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Your Bets</h3>
              <div className="space-y-2">
                {slip.legs.map((leg) => (
                  <div
                    key={leg.leg_id}
                    className="flex items-center justify-between bg-muted/30 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{leg.market_id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={leg.side === 'YES' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {leg.side}
                        </Badge>
                        {leg.outcome && (
                          <Badge 
                            variant={leg.outcome === leg.side ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {leg.outcome === leg.side ? 'Won' : 'Lost'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{leg.amount_xmr.toFixed(6)} XMR</p>
                      <p className="text-xs text-muted-foreground">${leg.amount_usd.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* View Key */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowViewKey(!showViewKey)}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Key (for verification)
                </span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              {showViewKey && (
                <div className="flex gap-2">
                  <Input
                    value={slip.view_key}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(slip.view_key, 'viewKey')}
                  >
                    {copied === 'viewKey' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Payout Address */}
            {isConfirmed && !slip.payout_address && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Set Payout Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Your Monero address..."
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                  />
                  <Button
                    onClick={handleSubmitPayoutAddress}
                    disabled={!payoutAddress || submittingPayout}
                  >
                    {submittingPayout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {slip.payout_address && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Payout address set: {slip.payout_address.slice(0, 12)}...
                </p>
              </div>
            )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
