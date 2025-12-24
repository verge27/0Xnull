import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, Clock, CheckCircle, ChevronDown, Shield, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { PlaceBetResponse, BetStatusResponse } from '@/hooks/usePredictionBets';
import { api } from '@/services/api';
import { formatBettingClosesAt } from '@/components/BettingCountdown';
import { extractSportInfo, parseMatchupFromTitle } from '@/lib/sportLabels';

interface BetDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betData: PlaceBetResponse | null;
  onCheckStatus: (betId: string) => Promise<BetStatusResponse | null>;
  onConfirmed: () => void;
  bettingClosesAt?: number;
  marketTitle?: string; // Optional: for displaying full match context
}

export function BetDepositModal({
  open,
  onOpenChange,
  betData,
  onCheckStatus,
  onConfirmed,
  bettingClosesAt,
  marketTitle,
}: BetDepositModalProps) {
  const [copied, setCopied] = useState<'address' | 'amount' | 'viewKey' | null>(null);
  const [status, setStatus] = useState<string>(betData?.status || 'awaiting_deposit');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [polling, setPolling] = useState(false);
  const [payoutAddress, setPayoutAddress] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Sync status with betData when it changes (e.g., bet already confirmed)
  useEffect(() => {
    if (betData?.status) {
      setStatus(betData.status);
    }
  }, [betData?.bet_id, betData?.status]);

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

  // Poll for status updates - using refs to avoid dependency issues
  const onCheckStatusRef = useRef(onCheckStatus);
  const onConfirmedRef = useRef(onConfirmed);
  onCheckStatusRef.current = onCheckStatus;
  onConfirmedRef.current = onConfirmed;

  useEffect(() => {
    if (!open || !betData || status === 'confirmed') return;

    setPolling(true);
    let isMounted = true;
    
    const pollStatus = async () => {
      if (!isMounted) return;
      try {
        const result = await onCheckStatusRef.current(betData.bet_id);
        if (result && isMounted) {
          setStatus(result.status);
          if (result.status === 'confirmed') {
            toast.success('Deposit confirmed!');
            onConfirmedRef.current();
          }
        }
      } catch (e) {
        console.error('Poll status error:', e);
      }
    };

    // Initial check
    pollStatus();

    // Poll every 10 seconds
    const interval = setInterval(pollStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      setPolling(false);
    };
  }, [open, betData?.bet_id, status]);

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
          {/* Bet summary with full match context */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            {/* Sport/League and Match context */}
            {betData.market_id && (() => {
              const sportInfo = extractSportInfo(betData.market_id);
              const title = marketTitle || '';
              const { matchup } = parseMatchupFromTitle(title);
              return (
                <div className="border-b border-border/50 pb-2 mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {sportInfo.sportEmoji} {sportInfo.leagueLabel || sportInfo.sportLabel}
                  </p>
                  {matchup && (
                    <p className="text-sm font-medium">{matchup}</p>
                  )}
                </div>
              );
            })()}
            
            <div className="flex items-center justify-between">
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
          </div>

          {status === 'confirmed' ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <div>
                <p className="text-lg font-medium">Deposit Confirmed!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your bet has been placed. Good luck!
                </p>
              </div>
              <Button className="w-full" onClick={() => onOpenChange(false)}>
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
                <Label className="text-xs text-muted-foreground">Amount</Label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  You can send any amount - larger bets get proportionally larger winnings
                </p>
              </div>


              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {polling && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Your bet will be confirmed after 1 blockchain confirmation</span>
              </div>

              {/* Betting cutoff warning */}
              {bettingClosesAt && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-500">
                        Betting closes: {formatBettingClosesAt(bettingClosesAt)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Deposits received AFTER betting closes will be automatically refunded to your payout address with no fee.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Blockchain confirmation info */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  <strong>How confirmation works:</strong> Monero has a ~2 minute block time. Your bet is confirmed after just 1 blockchain confirmation.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your wallet's block explorer to track the transaction status.
                </p>
              </div>

              {/* Important note */}
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-xs text-primary">
                  <strong>Important:</strong> Save your bet ID:{' '}
                  <code className="bg-background px-1 py-0.5 rounded">{betData.bet_id}</code>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is your only reference for this bet. Keep it safe.
                </p>
              </div>

              {/* Pool Verification Section */}
              {betData.view_key && (
                <Collapsible open={verifyOpen} onOpenChange={setVerifyOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        Verify Pool
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${verifyOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Import both into Cake Wallet or Feather to independently verify all deposits in this pool.
                    </p>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Pool Address</Label>
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

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View Key
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          readOnly
                          value={betData.view_key}
                          className="font-mono text-xs"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(betData.view_key!, 'viewKey')}
                        >
                          {copied === 'viewKey' ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
