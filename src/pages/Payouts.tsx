import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, Trophy, CheckCircle, ArrowLeft, Banknote, TrendingUp, RefreshCw } from 'lucide-react';
import { api, type PayoutEntry } from '@/services/api';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

export default function Payouts() {
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getPredictionPayouts();
      setPayouts(data.payouts || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to fetch payouts:', e);
      setError('Failed to load payouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Calculate totals
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.payout_xmr, 0);
  const winPayouts = payouts.filter(p => p.payout_type === 'win');
  const refundPayouts = payouts.filter(p => p.payout_type === 'refund');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/predict">
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
              All prediction market payouts across the platform
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchPayouts}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
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

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Winner Payouts</p>
                  <p className="text-2xl font-bold">
                    {winPayouts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-950/20 border-blue-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Refunds</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {refundPayouts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts List */}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            All Payouts ({payouts.length})
          </h2>
          
          {loading ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading payouts...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={fetchPayouts}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : payouts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  When markets resolve, payouts will appear here with transaction IDs.
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
            <div className="space-y-3">
              {payouts.map(payout => (
                <Card 
                  key={payout.bet_id} 
                  className={payout.payout_type === 'win' 
                    ? 'border-emerald-600/30 bg-emerald-950/10' 
                    : 'border-blue-600/30 bg-blue-950/10'
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Market Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={payout.payout_type === 'win' ? 'bg-emerald-600' : 'bg-blue-600'}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {payout.payout_type === 'win' ? 'Winner' : 'Refund'}
                          </Badge>
                          <Badge variant={payout.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                            {payout.side}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Outcome: {payout.outcome}
                          </Badge>
                        </div>
                        <p className="font-medium truncate">{payout.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payout.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payout.resolved_at)}
                        </p>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Stake</p>
                          <p className="font-mono text-sm">{payout.stake_xmr.toFixed(4)} XMR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Payout</p>
                          <p className="font-mono text-lg font-bold text-emerald-400">
                            {payout.payout_xmr.toFixed(4)} XMR
                          </p>
                        </div>
                      </div>

                      {/* Transaction Link */}
                      <a
                        href={`${XMR_EXPLORER_URL}/${payout.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 transition-colors group"
                      >
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Transaction ID</p>
                          <p className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                            {truncateTxid(payout.tx_hash)}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}