import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, Trophy, CheckCircle, ArrowLeft, Banknote, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

interface MarketPayout {
  id: string;
  market_id: string;
  position_id: string;
  amount: number;
  txid: string | null;
  created_at: string;
}

export default function Payouts() {
  const [payouts, setPayouts] = useState<MarketPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayouts = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('market_payouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (e) {
      console.error('Failed to fetch payouts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Calculate totals
  const completedPayouts = payouts.filter(p => p.txid);
  const pendingPayouts = payouts.filter(p => !p.txid);
  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

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

  const truncateId = (id: string) => {
    if (id.length <= 16) return id;
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
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
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">
                    {payouts.length}
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
                  key={payout.id} 
                  className={payout.txid 
                    ? 'border-emerald-600/30 bg-emerald-950/10' 
                    : 'border-amber-600/30 bg-amber-950/10'
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Market Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={payout.txid ? 'bg-emerald-600' : 'bg-amber-600'}>
                            {payout.txid ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="font-mono text-sm text-muted-foreground truncate">
                          Market: {truncateId(payout.market_id)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payout.created_at)}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Payout Amount</p>
                        <p className="font-mono text-lg font-bold text-emerald-400">
                          {payout.amount.toFixed(4)} XMR
                        </p>
                      </div>

                      {/* Transaction Link */}
                      {payout.txid ? (
                        <a
                          href={`${XMR_EXPLORER_URL}/${payout.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 transition-colors group"
                        >
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Transaction ID</p>
                            <p className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                              {truncateTxid(payout.txid)}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                        </a>
                      ) : (
                        <div className="px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-600/30">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm text-amber-400">Awaiting TX</p>
                        </div>
                      )}
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