import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, Trophy, Clock, CheckCircle, ArrowLeft, Banknote, TrendingUp, Receipt } from 'lucide-react';
import { usePredictionBets, type PredictionBet } from '@/hooks/usePredictionBets';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

export default function Payouts() {
  const { bets, checkBetStatus } = usePredictionBets();
  const [refreshing, setRefreshing] = useState(false);

  // Filter for paid bets (won or paid status with payout_tx_hash)
  const paidBets = bets.filter(bet => 
    (bet.status === 'paid' || bet.status === 'won') && bet.payout_tx_hash
  );

  // Filter for pending payouts (won but not yet paid)
  const pendingPayouts = bets.filter(bet => 
    bet.status === 'won' && !bet.payout_tx_hash
  );

  // Calculate totals
  const totalPaidOut = paidBets.reduce((sum, bet) => sum + (bet.payout_xmr || 0), 0);
  const pendingAmount = pendingPayouts.reduce((sum, bet) => sum + (bet.payout_xmr || 0), 0);

  const refreshStatuses = async () => {
    setRefreshing(true);
    try {
      // Check status for all bets that might have pending payouts
      const relevantBets = bets.filter(bet => 
        bet.status === 'won' || bet.status === 'confirmed'
      );
      await Promise.all(relevantBets.map(bet => checkBetStatus(bet.bet_id)));
    } catch (e) {
      console.error('Failed to refresh statuses:', e);
    }
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateTxid = (txid: string) => {
    if (txid.length <= 20) return txid;
    return `${txid.slice(0, 10)}...${txid.slice(-10)}`;
  };

  const getPayoutTypeLabel = (type?: string) => {
    switch (type) {
      case 'winner_takes_pool':
        return { label: 'Winner Payout', color: 'bg-emerald-600' };
      case 'refund_one_sided':
        return { label: 'One-Sided Refund', color: 'bg-amber-600' };
      case 'refund_all_losers':
        return { label: 'Full Refund', color: 'bg-blue-600' };
      default:
        return { label: 'Payout', color: 'bg-zinc-600' };
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/my-slips">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Payout History
            </h1>
            <p className="text-muted-foreground mt-1">
              Track all your prediction market payouts and transaction IDs
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshStatuses}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Statuses'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-emerald-950/20 border-emerald-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Banknote className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {totalPaidOut.toFixed(4)} XMR
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-950/20 border-amber-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold text-amber-400 font-mono">
                    {pendingAmount.toFixed(4)} XMR
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid Transactions</p>
                  <p className="text-2xl font-bold">
                    {paidBets.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payouts Section */}
        {pendingPayouts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Payouts ({pendingPayouts.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPayouts.map(bet => (
                <Card key={bet.bet_id} className="border-amber-600/30 bg-amber-950/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono truncate">
                        {bet.market_id}
                      </CardTitle>
                      <Badge className="bg-amber-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Position</span>
                        <Badge variant={bet.side === 'YES' ? 'default' : 'destructive'}>
                          {bet.side}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Stake</span>
                        <span className="font-mono text-sm">{bet.amount_xmr.toFixed(4)} XMR</span>
                      </div>
                      {bet.payout_xmr && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Expected Payout</span>
                          <span className="font-mono text-sm text-emerald-400">
                            +{bet.payout_xmr.toFixed(4)} XMR
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="text-xs">{formatDate(bet.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Paid Out Section */}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Completed Payouts ({paidBets.length})
          </h2>
          
          {paidBets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  When you win prediction markets, your payouts will appear here with transaction IDs.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link to="/esports-predictions">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Esports Markets
                    </Button>
                  </Link>
                  <Link to="/sports-predictions">
                    <Button variant="outline" size="sm">
                      <Trophy className="w-4 h-4 mr-2" />
                      Sports Markets
                    </Button>
                  </Link>
                  <Link to="/predictions">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Crypto Markets
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paidBets.map(bet => {
                const payoutType = getPayoutTypeLabel(bet.payout_type);
                return (
                  <Card key={bet.bet_id} className="border-emerald-600/30 bg-emerald-950/10">
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Market Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={bet.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                              {bet.side}
                            </Badge>
                            <Badge className={payoutType.color + ' text-xs'}>
                              {payoutType.label}
                            </Badge>
                          </div>
                          <p className="font-mono text-sm text-muted-foreground truncate">
                            {bet.market_id}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(bet.created_at)}
                          </p>
                        </div>

                        {/* Amounts */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Stake</p>
                            <p className="font-mono text-sm">{bet.amount_xmr.toFixed(4)} XMR</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Payout</p>
                            <p className="font-mono text-lg font-bold text-emerald-400">
                              +{(bet.payout_xmr || 0).toFixed(4)} XMR
                            </p>
                          </div>
                        </div>

                        {/* Transaction Link */}
                        {bet.payout_tx_hash && (
                          <a
                            href={`${XMR_EXPLORER_URL}/${bet.payout_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 transition-colors group"
                          >
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Transaction ID</p>
                              <p className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                                {truncateTxid(bet.payout_tx_hash)}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}