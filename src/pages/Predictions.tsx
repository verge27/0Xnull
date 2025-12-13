import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Market {
  id: string;
  question: string;
  description: string | null;
  resolution_date: string | null;
  resolution_criteria: string | null;
  status: string;
  total_yes_pool: number;
  total_no_pool: number;
  created_at: string;
  creator_id: string | null;
  creator_pk_id: string | null;
}

interface Position {
  id: string;
  market_id: string;
  side: string;
  amount: number;
  payout_address: string;
  created_at: string;
}

const PLATFORM_FEE = 0.02;

export default function Predictions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { privateKeyUser: pkUser, isAuthenticated: isPkAuthenticated } = usePrivateKeyAuth();
  const { isAdmin } = useIsAdmin();
  
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newResolutionDate, setNewResolutionDate] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  
  // Bet form
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');

  useEffect(() => {
    fetchMarkets();
    if (user || pkUser) {
      fetchUserPositions();
    }
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('prediction-markets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prediction_markets' }, () => {
        fetchMarkets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_positions' }, () => {
        fetchMarkets();
        if (user || pkUser) fetchUserPositions();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pkUser]);

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching markets:', error);
    } else {
      setMarkets(data || []);
    }
    setLoading(false);
  };

  const fetchUserPositions = async () => {
    let query = supabase.from('market_positions').select('*');
    
    if (user) {
      query = query.eq('user_id', user.id);
    } else if (pkUser) {
      query = query.eq('user_pk_id', pkUser.id);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setUserPositions(data);
    }
  };

  const handleCreateMarket = async () => {
    if (!newQuestion.trim()) {
      toast.error('Question is required');
      return;
    }
    
    const marketData = {
      question: newQuestion.trim(),
      description: newDescription.trim() || null,
      resolution_date: newResolutionDate || null,
      resolution_criteria: newCriteria.trim() || null,
      creator_id: user?.id || null,
      creator_pk_id: pkUser?.id || null,
    };
    
    const { error } = await supabase.from('prediction_markets').insert(marketData);
    
    if (error) {
      toast.error('Failed to create market');
      console.error(error);
    } else {
      toast.success('Market created!');
      setCreateOpen(false);
      setNewQuestion('');
      setNewDescription('');
      setNewResolutionDate('');
      setNewCriteria('');
      fetchMarkets();
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    
    if (!payoutAddress.trim()) {
      toast.error('Payout address is required');
      return;
    }
    
    const positionData = {
      market_id: selectedMarket.id,
      side: betSide,
      amount,
      payout_address: payoutAddress.trim(),
      user_id: user?.id || null,
      user_pk_id: pkUser?.id || null,
    };
    
    const { error: posError } = await supabase.from('market_positions').insert(positionData);
    
    if (posError) {
      toast.error('Failed to place bet');
      console.error(posError);
      return;
    }
    
    // Update pool
    const poolField = betSide === 'yes' ? 'total_yes_pool' : 'total_no_pool';
    const currentPool = betSide === 'yes' ? selectedMarket.total_yes_pool : selectedMarket.total_no_pool;
    
    const { error: updateError } = await supabase
      .from('prediction_markets')
      .update({ [poolField]: currentPool + amount })
      .eq('id', selectedMarket.id);
    
    if (updateError) {
      console.error('Failed to update pool:', updateError);
    }
    
    toast.success(`Placed ${amount} XMR on ${betSide.toUpperCase()}`);
    setBetDialogOpen(false);
    setBetAmount('');
    setPayoutAddress('');
    fetchMarkets();
    fetchUserPositions();
  };

  const handleResolveMarket = async (outcome: 'yes' | 'no' | 'cancelled') => {
    if (!selectedMarket) return;
    
    const status = outcome === 'cancelled' ? 'cancelled' : `resolved_${outcome}`;
    
    const { error } = await supabase
      .from('prediction_markets')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', selectedMarket.id);
    
    if (error) {
      toast.error('Failed to resolve market');
    } else {
      toast.success(`Market resolved: ${outcome.toUpperCase()}`);
      setResolveDialogOpen(false);
      fetchMarkets();
    }
  };

  const getOdds = (market: Market) => {
    const total = market.total_yes_pool + market.total_no_pool;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.total_yes_pool / total) * 100),
      no: Math.round((market.total_no_pool / total) * 100),
    };
  };

  const calculatePotentialPayout = (market: Market, side: 'yes' | 'no', amount: number) => {
    const total = market.total_yes_pool + market.total_no_pool + amount;
    const winnerPool = side === 'yes' 
      ? market.total_yes_pool + amount 
      : market.total_no_pool + amount;
    const afterFee = total * (1 - PLATFORM_FEE);
    return (amount / winnerPool) * afterFee;
  };

  const getUserPositionForMarket = (marketId: string) => {
    return userPositions.filter(p => p.market_id === marketId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
      case 'closed':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      case 'resolved_yes':
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Resolved YES</Badge>;
      case 'resolved_no':
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Resolved NO</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canResolve = (market: Market) => {
    if (isAdmin) return true;
    if (user && market.creator_id === user.id) return true;
    if (pkUser && market.creator_pk_id === pkUser.id) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Prediction Markets</h1>
            <p className="text-muted-foreground mt-1">Bet on outcomes with XMR</p>
          </div>
          
          {(user || pkUser) && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Market
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Prediction Market</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="question">Question *</Label>
                    <Input
                      id="question"
                      placeholder="BTC above $100K on Jan 1 2026?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional context and rules..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resolution-date">Resolution Date</Label>
                    <Input
                      id="resolution-date"
                      type="datetime-local"
                      value={newResolutionDate}
                      onChange={(e) => setNewResolutionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="criteria">Resolution Criteria</Label>
                    <Textarea
                      id="criteria"
                      placeholder="Based on CoinGecko price at midnight UTC"
                      value={newCriteria}
                      onChange={(e) => setNewCriteria(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateMarket} className="w-full">
                    Create Market
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
        ) : markets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No markets yet. Be the first to create one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {markets.map((market) => {
              const odds = getOdds(market);
              const positions = getUserPositionForMarket(market.id);
              const totalPool = market.total_yes_pool + market.total_no_pool;
              
              return (
                <Card key={market.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{market.question}</CardTitle>
                        {market.description && (
                          <CardDescription className="mt-2">{market.description}</CardDescription>
                        )}
                      </div>
                      {getStatusBadge(market.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Odds bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> YES {odds.yes}%
                          </span>
                          <span className="text-red-500 font-medium flex items-center gap-1">
                            NO {odds.no}% <TrendingDown className="w-4 h-4" />
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 transition-all duration-300"
                            style={{ width: `${odds.yes}%` }}
                          />
                          <div 
                            className="bg-red-500 transition-all duration-300"
                            style={{ width: `${odds.no}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{market.total_yes_pool.toFixed(4)} XMR</span>
                          <span>Pool: {totalPool.toFixed(4)} XMR</span>
                          <span>{market.total_no_pool.toFixed(4)} XMR</span>
                        </div>
                      </div>

                      {/* User positions */}
                      {positions.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">Your Positions</p>
                          {positions.map((pos) => {
                            const potentialPayout = calculatePotentialPayout(
                              market,
                              pos.side as 'yes' | 'no',
                              0 // Already in pool
                            );
                            return (
                              <div key={pos.id} className="flex justify-between text-sm">
                                <span className={pos.side === 'yes' ? 'text-emerald-500' : 'text-red-500'}>
                                  {pos.amount.toFixed(4)} XMR on {pos.side.toUpperCase()}
                                </span>
                                <span className="text-muted-foreground">
                                  Potential: ~{((pos.amount / (pos.side === 'yes' ? market.total_yes_pool : market.total_no_pool)) * (totalPool * (1 - PLATFORM_FEE))).toFixed(4)} XMR
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {market.resolution_date && (
                          <span>Resolves: {new Date(market.resolution_date).toLocaleDateString()}</span>
                        )}
                        {market.resolution_criteria && (
                          <span>Criteria: {market.resolution_criteria}</span>
                        )}
                        <span>Created: {new Date(market.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      {market.status === 'open' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedMarket(market);
                              setBetSide('yes');
                              setBetDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="w-4 h-4 mr-2" /> Buy YES
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              setSelectedMarket(market);
                              setBetSide('no');
                              setBetDialogOpen(true);
                            }}
                          >
                            <TrendingDown className="w-4 h-4 mr-2" /> Buy NO
                          </Button>
                          {canResolve(market) && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedMarket(market);
                                setResolveDialogOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Place Bet on {betSide.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedMarket && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{selectedMarket.question}</p>
              
              <div>
                <Label htmlFor="bet-amount">Amount (XMR)</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                />
                {betAmount && parseFloat(betAmount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Potential payout if {betSide.toUpperCase()} wins: ~
                    {calculatePotentialPayout(selectedMarket, betSide, parseFloat(betAmount)).toFixed(4)} XMR
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="payout-address">XMR Payout Address</Label>
                <Input
                  id="payout-address"
                  placeholder="4..."
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where to send your winnings if you win
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p>Platform fee: 2%</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Winners split the total pot minus the fee
                </p>
              </div>
              
              <Button 
                onClick={handlePlaceBet} 
                className={`w-full ${betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                variant={betSide === 'no' ? 'destructive' : 'default'}
              >
                Confirm {betAmount || '0'} XMR on {betSide.toUpperCase()}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Market</DialogTitle>
          </DialogHeader>
          {selectedMarket && (
            <div className="space-y-4 mt-4">
              <p className="font-medium">{selectedMarket.question}</p>
              {selectedMarket.resolution_criteria && (
                <p className="text-sm text-muted-foreground">
                  Criteria: {selectedMarket.resolution_criteria}
                </p>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleResolveMarket('yes')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> YES
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleResolveMarket('no')}
                >
                  <XCircle className="w-4 h-4 mr-2" /> NO
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResolveMarket('cancelled')}
                >
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. Make sure to verify the outcome before resolving.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
