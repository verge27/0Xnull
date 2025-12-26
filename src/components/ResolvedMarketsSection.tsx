import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Wallet, Clock, Trophy, Banknote, ExternalLink } from 'lucide-react';
import { type PredictionMarket } from '@/services/api';

interface UserBet {
  side: string;
  status?: string;
  payout_tx_hash?: string;
  payout_xmr?: number;
}

interface ResolvedMarketsSectionProps {
  markets: PredictionMarket[];
  getBetsForMarket: (marketId: string) => UserBet[];
}

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

export function ResolvedMarketsSection({ markets, getBetsForMarket }: ResolvedMarketsSectionProps) {
  if (markets.length === 0) return null;

  const getOdds = (market: PredictionMarket) => {
    const total = market.yes_pool_xmr + market.no_pool_xmr;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.yes_pool_xmr / total) * 100),
      no: Math.round((market.no_pool_xmr / total) * 100),
    };
  };

  const formatResolutionDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine payout status based on user's bets for this market
  const getPayoutStatus = (market: PredictionMarket, marketBets: UserBet[]) => {
    // Check if any user bets have been paid out with tx hash
    const paidBets = marketBets.filter(bet => bet.status === 'paid' && bet.payout_tx_hash);
    if (paidBets.length > 0) {
      return { 
        status: 'paid', 
        label: 'Paid Out', 
        icon: Wallet, 
        color: 'bg-emerald-600',
        txids: paidBets.map(b => b.payout_tx_hash).filter(Boolean) as string[]
      };
    }
    
    // Check if any bets are won but awaiting payout
    const wonBets = marketBets.filter(bet => bet.status === 'won');
    if (wonBets.length > 0) {
      return { status: 'pending', label: 'Payout Pending', icon: Clock, color: 'bg-amber-600', txids: [] };
    }
    
    // Check if market has payout_txid or payout_status fields from API
    if ((market as any).payout_status === 'paid' || (market as any).payout_txid) {
      return { 
        status: 'paid', 
        label: 'Paid Out', 
        icon: Wallet, 
        color: 'bg-emerald-600',
        txids: (market as any).payout_txid ? [(market as any).payout_txid] : []
      };
    }
    if ((market as any).payout_status === 'pending') {
      return { status: 'pending', label: 'Payout Pending', icon: Clock, color: 'bg-amber-600', txids: [] };
    }
    
    // Default: assume processing if recently resolved
    const resolvedRecently = market.resolution_time && 
      (Date.now() / 1000 - market.resolution_time) < 3600; // Within 1 hour
    if (resolvedRecently) {
      return { status: 'processing', label: 'Processing', icon: Clock, color: 'bg-blue-600', txids: [] };
    }
    return { status: 'complete', label: 'Complete', icon: CheckCircle, color: 'bg-zinc-600', txids: [] };
  };

  const truncateTxid = (txid: string) => {
    if (txid.length <= 16) return txid;
    return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Resolved Markets ({markets.length})
          <Badge variant="secondary" className="text-xs">Results</Badge>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map(market => {
          const odds = getOdds(market);
          const marketBets = getBetsForMarket(market.market_id);
          const payoutInfo = getPayoutStatus(market, marketBets);
          const PayoutIcon = payoutInfo.icon;
          const isWinner = market.outcome?.toUpperCase() === 'YES';
          
          return (
            <Card 
              key={market.market_id}
              className={`border-2 ${isWinner ? 'border-emerald-600/30 bg-emerald-950/10' : 'border-red-600/30 bg-red-950/10'}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{market.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{market.description}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {isWinner ? (
                      <Badge className="bg-emerald-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        YES Won
                      </Badge>
                    ) : (
                      <Badge className="bg-red-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        NO Won
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Final Odds */}
                <div className="flex gap-2 mb-3">
                  <div className={`flex-1 p-2 rounded text-center ${isWinner ? 'bg-emerald-600/30 border border-emerald-500' : 'bg-emerald-600/10 border border-emerald-600/20'}`}>
                    <div className={`text-lg font-bold ${isWinner ? 'text-emerald-400' : 'text-emerald-500/50'}`}>{odds.yes}%</div>
                    <div className="text-xs text-muted-foreground">YES</div>
                    <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                  </div>
                  <div className={`flex-1 p-2 rounded text-center ${!isWinner ? 'bg-red-600/30 border border-red-500' : 'bg-red-600/10 border border-red-600/20'}`}>
                    <div className={`text-lg font-bold ${!isWinner ? 'text-red-400' : 'text-red-500/50'}`}>{odds.no}%</div>
                    <div className="text-xs text-muted-foreground">NO</div>
                    <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
                  </div>
                </div>
                
                {/* Pool Info */}
                <div className="text-xs text-muted-foreground mb-3 text-center">
                  Total Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                </div>

                {/* Payout Status */}
                <div className={`flex items-center justify-center gap-2 p-2 rounded ${payoutInfo.color}/20 border border-current/30`}>
                  <PayoutIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{payoutInfo.label}</span>
                  {payoutInfo.status === 'paid' && (
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                {/* Payout Transaction IDs */}
                {payoutInfo.txids.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {payoutInfo.txids.map((txid, idx) => (
                      <a
                        key={idx}
                        href={`${XMR_EXPLORER_URL}/${txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
                      >
                        <span>TX: {truncateTxid(txid)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Resolution Date */}
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Resolved: {formatResolutionDate(market.resolution_time)}
                </div>
                
                {/* User's bets on this market */}
                {marketBets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      You had {marketBets.length} bet(s) on this market
                    </p>
                    {marketBets.map((bet, i) => {
                      const betWon = bet.side?.toUpperCase() === market.outcome?.toUpperCase();
                      return (
                        <div key={i} className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={bet.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                              {bet.side}
                            </Badge>
                            {bet.payout_xmr && bet.payout_xmr > 0 && (
                              <span className="text-xs font-mono text-emerald-400">
                                +{bet.payout_xmr.toFixed(4)} XMR
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${betWon ? 'text-emerald-400' : 'text-red-400'}`}>
                              {betWon ? '✓ Won' : '✗ Lost'}
                            </span>
                            {bet.payout_tx_hash && (
                              <a
                                href={`${XMR_EXPLORER_URL}/${bet.payout_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300"
                                title="View payout transaction"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}