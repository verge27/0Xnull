import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Clock, Loader2, Eye, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { MultibetSlip } from '@/services/api';
import { playConfirmationSound } from '@/lib/sounds';
import { roundUpXmr } from '@/lib/utils';

interface MultibetDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slip: MultibetSlip | null;
  onCheckStatus: (slipId: string) => Promise<MultibetSlip>;
  onUpdatePayoutAddress: (slipId: string, address: string) => Promise<any>;
  onConfirmed: () => void;
}

// Default expiry is 60 minutes from creation
const EXPIRY_MINUTES = 60;

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
  const [betsOpen, setBetsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(EXPIRY_MINUTES * 60);

  // Calculate time remaining
  useEffect(() => {
    if (!slip || status === 'confirmed' || status === 'resolved' || status === 'paid') return;

    const toMs = (value: unknown): number | null => {
      if (value == null) return null;
      const n = typeof value === 'string' ? Number(value) : (value as number);
      if (typeof n !== 'number' || !Number.isFinite(n)) return null;
      // seconds -> ms
      if (n > 0 && n < 1_000_000_000_000) return n * 1000;
      return n;
    };

    const createdAtMs = toMs((slip as any).created_at);
    if (!createdAtMs) {
      setTimeLeft(EXPIRY_MINUTES * 60);
      return;
    }

    const expiresAt = createdAtMs + EXPIRY_MINUTES * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [slip?.created_at, status]);

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
            playConfirmationSound();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!slip) return null;

  const isConfirmed = status === 'confirmed' || status === 'resolved' || status === 'paid';
  const moneroUri = `monero:${slip.xmr_address}?tx_amount=${slip.total_amount_xmr}`;
  const isExpiringSoon = timeLeft < 300; // Less than 5 minutes
  const isExpired = timeLeft === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gradient-to-b from-background to-background/95">
        {/* Header with gradient */}
        <DialogHeader className="p-4 pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-amber-500/20">
          <DialogTitle className="flex items-center gap-2">
            {isConfirmed ? (
              <>
                <div className="p-1.5 rounded-full bg-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-emerald-500">Bets Confirmed!</span>
              </>
            ) : (
              <>
                <div className="p-1.5 rounded-full bg-amber-500/20 animate-pulse">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Awaiting Deposit
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 p-4">
          {/* Countdown Timer */}
          {!isConfirmed && (
            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border ${
              isExpired 
                ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                : isExpiringSoon 
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 animate-pulse' 
                  : 'bg-primary/5 border-primary/20 text-primary'
            }`}>
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isExpired ? 'Address Expired' : `Expires in ${formatTime(timeLeft)}`}
              </span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-3 text-center border border-primary/20 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Legs</p>
              <p className="text-2xl font-bold text-primary">{slip.legs.length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl p-3 text-center border border-emerald-500/20 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">USD</p>
              <p className="text-xl font-bold text-emerald-500">${slip.total_amount_usd.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl p-3 text-center border border-amber-500/20 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XMR</p>
              <p className="text-sm font-bold font-mono text-amber-500">{roundUpXmr(slip.total_amount_xmr)} XMR</p>
            </div>
          </div>

          {/* QR Code and Address */}
          {!isConfirmed && !isExpired && (
            <div className="space-y-3">
              {/* QR Code with decorative border */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-sm opacity-50" />
                  <div className="relative bg-white p-4 rounded-xl border-2 border-amber-500/50 shadow-xl shadow-amber-500/20">
                    <QRCodeSVG value={moneroUri} size={130} />
                  </div>
                </div>
              </div>

              {/* Deposit Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                  Deposit Address
                </label>
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border border-amber-500/20">
                  <code className="flex-1 text-xs font-mono truncate text-foreground/80">
                    {slip.xmr_address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-amber-500/20 text-amber-500"
                    onClick={() => copyToClipboard(slip.xmr_address, 'address')}
                  >
                    {copied === 'address' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                  Amount
                </label>
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
                  <code className="flex-1 text-sm font-mono font-bold text-foreground">
                    {roundUpXmr(slip.total_amount_xmr)} XMR
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-orange-500/20 text-orange-500"
                    onClick={() => copyToClipboard(roundUpXmr(slip.total_amount_xmr), 'amount')}
                  >
                    {copied === 'amount' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Polling Status */}
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm py-2 px-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-lg border border-amber-500/30">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Checking for deposit...</span>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Bets Section */}
          <Collapsible open={betsOpen} onOpenChange={setBetsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between bg-muted/30 hover:bg-muted/50 border border-border/50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  Your Bets ({slip.legs.length})
                </span>
                {betsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 animate-accordion-down">
              {slip.legs.map((leg) => (
                <div
                  key={leg.leg_id}
                  className="flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent rounded-lg p-3 border border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate text-muted-foreground">{leg.market_id}</p>
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
                    <p className="font-mono text-sm text-amber-500">{leg.amount_xmr.toFixed(4)} XMR</p>
                    <p className="text-xs text-muted-foreground">${leg.amount_usd.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* View Key */}
          <Collapsible open={showViewKey} onOpenChange={setShowViewKey}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2 text-xs">
                  <Eye className="w-3 h-3" />
                  View Key (verification)
                </span>
                {showViewKey ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 animate-accordion-down">
              <div className="flex gap-2 p-2 bg-muted/30 rounded-lg">
                <Input
                  value={slip.view_key}
                  readOnly
                  className="font-mono text-xs h-8"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(slip.view_key, 'viewKey')}
                >
                  {copied === 'viewKey' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Payout Address */}
          {isConfirmed && !slip.payout_address && (
            <div className="space-y-2 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Set Payout Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Your Monero address..."
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  className="text-sm"
                />
                <Button
                  onClick={handleSubmitPayoutAddress}
                  disabled={!payoutAddress || submittingPayout}
                  className="bg-emerald-500 hover:bg-emerald-600"
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
            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-lg p-3">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Payout address set: {slip.payout_address.slice(0, 12)}...
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border/50 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
