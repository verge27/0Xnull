import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader2, Wallet, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { type PredictionBet } from '@/hooks/usePredictionBets';
import { api } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

interface MyBetsProps {
  bets: PredictionBet[];
  onStatusUpdate: (betId: string) => Promise<unknown>;
  onPayoutSubmit: (betId: string, address: string) => Promise<boolean>;
}

export function MyBets({ bets, onStatusUpdate, onPayoutSubmit }: MyBetsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [pollingBets, setPollingBets] = useState<Set<string>>(new Set());
  const [payoutInputs, setPayoutInputs] = useState<Record<string, string>>({});
  const [submittingPayout, setSubmittingPayout] = useState<string | null>(null);
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, string>>({});

  // Track status changes and show notifications
  useEffect(() => {
    bets.forEach(bet => {
      const prevStatus = previousStatuses[bet.bet_id];
      if (prevStatus && prevStatus !== bet.status) {
        if (bet.status === 'confirmed') {
          toast.success(`Deposit confirmed! Your ${bet.side} bet of $${bet.amount_usd} is now active.`, {
            duration: 8000,
          });
        } else if (bet.status === 'won') {
          toast.success(`You won! Your ${bet.side} bet on ${bet.market_id} was successful!`, {
            duration: 10000,
          });
        } else if (bet.status === 'lost') {
          toast.error(`Your ${bet.side} bet on ${bet.market_id} did not win.`, {
            duration: 8000,
          });
        } else if (bet.status === 'paid') {
          toast.success(`Payout sent for your winning bet!`, {
            duration: 8000,
          });
        }
      }
    });
    
    // Update previous statuses
    const newStatuses: Record<string, string> = {};
    bets.forEach(bet => {
      newStatuses[bet.bet_id] = bet.status;
    });
    setPreviousStatuses(newStatuses);
  }, [bets]);

  // Use ref to avoid effect re-runs when onStatusUpdate changes
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;

  // Poll for status updates on awaiting_deposit bets
  useEffect(() => {
    const awaitingBetIds = bets
      .filter(bet => bet.status === 'awaiting_deposit')
      .map(bet => bet.bet_id);
    
    if (awaitingBetIds.length === 0) return;

    const interval = setInterval(() => {
      awaitingBetIds.forEach(betId => {
        onStatusUpdateRef.current(betId);
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [bets.map(b => `${b.bet_id}:${b.status}`).join(',')]);

  const handleRefresh = async (betId: string) => {
    setPollingBets(prev => new Set(prev).add(betId));
    try {
      await onStatusUpdate(betId);
    } finally {
      setPollingBets(prev => {
        const next = new Set(prev);
        next.delete(betId);
        return next;
      });
    }
  };

  const handlePayoutSubmit = async (betId: string) => {
    const address = payoutInputs[betId];
    if (!address) {
      toast.error('Please enter a payout address');
      return;
    }
    if (!address.startsWith('4') && !address.startsWith('8')) {
      toast.error('Invalid Monero address (must start with 4 or 8)');
      return;
    }
    if (address.length < 95) {
      toast.error('Monero address too short');
      return;
    }

    setSubmittingPayout(betId);
    const success = await onPayoutSubmit(betId, address);
    setSubmittingPayout(null);

    if (success) {
      toast.success('Payout address saved!');
      setPayoutInputs(prev => {
        const next = { ...prev };
        delete next[betId];
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (bet: PredictionBet) => {
    switch (bet.status) {
      case 'awaiting_deposit':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Awaiting Deposit</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/20 text-blue-400 gap-1"><CheckCircle className="w-3 h-3" />Confirmed</Badge>;
      case 'won':
        return <Badge className="bg-emerald-500/20 text-emerald-400 gap-1"><CheckCircle className="w-3 h-3" />Won!</Badge>;
      case 'lost':
        return <Badge className="bg-red-500/20 text-red-400 gap-1"><XCircle className="w-3 h-3" />Lost</Badge>;
      case 'paid':
        return (
          <Badge className="bg-primary/20 text-primary gap-1">
            <Wallet className="w-3 h-3" />
            Paid {bet.payout_xmr ? `${bet.payout_xmr.toFixed(4)} XMR` : ''}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{bet.status}</Badge>;
    }
  };

  const getPayoutTypeMessage = (bet: PredictionBet) => {
    if (!bet.payout_type) return null;
    switch (bet.payout_type) {
      case 'refund_one_sided':
        return { text: 'Market was one-sided - full stake refunded', color: 'text-amber-500' };
      case 'refund_all_losers':
        return { text: 'No winners - full stake refunded', color: 'text-amber-500' };
      case 'winner_takes_pool':
        return { text: 'You won! Share of the pool paid out', color: 'text-emerald-500' };
      default:
        return null;
    }
  };

  const hasBets = bets.length > 0;

  const sortedBets = [...bets].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                My Bets ({bets.length})
              </CardTitle>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {!hasBets ? (
              <div className="text-center py-4 text-muted-foreground">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bets yet. Place a bet to get started!</p>
              </div>
            ) : (
              sortedBets.map((bet) => (
                <div
                  key={bet.bet_id}
                  className="p-4 rounded-lg border border-border bg-card/50 space-y-3"
                >
                    <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={bet.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                          {bet.side}
                        </Badge>
                        {getStatusBadge(bet)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Market: {bet.market_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">${bet.amount_usd.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{bet.amount_xmr.toFixed(6)} XMR</p>
                    </div>
                  </div>

                  {bet.status === 'awaiting_deposit' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Deposit Address:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleRefresh(bet.bet_id)}
                          disabled={pollingBets.has(bet.bet_id)}
                        >
                          <RefreshCw className={`w-3 h-3 ${pollingBets.has(bet.bet_id) ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                          {bet.deposit_address.slice(0, 20)}...{bet.deposit_address.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(bet.deposit_address)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-yellow-500">
                        Expires {formatDistanceToNow(new Date(bet.expires_at), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  {bet.status === 'confirmed' && !bet.payout_address && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">Enter payout address for winnings:</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="4... or 8... Monero address"
                          value={payoutInputs[bet.bet_id] || ''}
                          onChange={(e) => setPayoutInputs(prev => ({ ...prev, [bet.bet_id]: e.target.value }))}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handlePayoutSubmit(bet.bet_id)}
                          disabled={submittingPayout === bet.bet_id}
                        >
                          {submittingPayout === bet.bet_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {bet.status === 'paid' && bet.payout_tx_hash && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1">
                      {(() => {
                        const payoutMsg = getPayoutTypeMessage(bet);
                        return payoutMsg ? (
                          <div className={`font-medium ${payoutMsg.color}`}>{payoutMsg.text}</div>
                        ) : null;
                      })()}
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-500 font-medium">
                          Received {bet.payout_xmr?.toFixed(4) || '?'} XMR
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(bet.payout_tx_hash!)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> TX
                        </Button>
                      </div>
                      <code className="text-xs opacity-60">
                        {bet.payout_tx_hash.slice(0, 12)}...{bet.payout_tx_hash.slice(-8)}
                      </code>
                    </div>
                  )}

                  {bet.payout_address && bet.status !== 'paid' && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Payout: {bet.payout_address.slice(0, 12)}...{bet.payout_address.slice(-6)}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2">
                    Placed {formatDistanceToNow(new Date(bet.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
