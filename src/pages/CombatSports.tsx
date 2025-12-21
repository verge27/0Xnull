import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Swords, ChevronRight, HelpCircle, ArrowRight, RefreshCw, Clock, CheckCircle, XCircle, Trophy, TrendingUp, TrendingDown, Calendar, Users } from 'lucide-react';
import { useSportsEvents, type SportsEvent } from '@/hooks/useSportsEvents';
import { useSportsMatches, getSportLabel, type SportsMatch } from '@/hooks/useSportsCategories';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { api, type PredictionMarket } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { BetDepositModal } from '@/components/BetDepositModal';
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TrillerTVEmbed } from '@/components/TrillerTVEmbed';
import { toast } from 'sonner';

const COMBAT_SPORTS = ['ufc', 'boxing'];

export default function CombatSports() {
  const location = useLocation();
  const path = location.pathname;
  
  // Determine active filter from URL
  const getInitialFilter = () => {
    if (path.includes('/mma')) return 'mma';
    if (path.includes('/boxing')) return 'boxing';
    return 'all';
  };
  
  const [activeFilter, setActiveFilter] = useState(getInitialFilter());
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const { matches, loading: matchesLoading, fetchBySport } = useSportsMatches();
  const { createSportsMarket } = useSportsEvents();
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { xmrUsdRate } = useExchangeRate();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedMarketId, setNewlyCreatedMarketId] = useState<string | null>(null);
  const marketsRef = useRef<HTMLDivElement>(null);
  
  // Bet dialog state
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  // Multibet slip
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
  // Team selection dialog
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; match: SportsMatch | null }>({
    open: false,
    match: null,
  });

  // Fetch combat sports matches
  useEffect(() => {
    const fetchCombatMatches = async () => {
      if (activeFilter === 'all') {
        // Fetch both UFC and boxing
        await Promise.all(COMBAT_SPORTS.map(sport => fetchBySport(sport)));
      } else if (activeFilter === 'mma') {
        await fetchBySport('ufc');
      } else if (activeFilter === 'boxing') {
        await fetchBySport('boxing');
      }
    };
    fetchCombatMatches();
  }, [activeFilter, fetchBySport]);

  // Fetch markets
  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      const { markets: apiMarkets } = await api.getPredictionMarkets();
      // Filter for sports markets that are combat-related (ufc, boxing, mma)
      const combatMarkets = apiMarkets.filter(m => {
        if (m.oracle_type !== 'sports') return false;
        const desc = m.description?.toLowerCase() || '';
        return desc.includes('ufc') || desc.includes('boxing') || desc.includes('mma') || desc.includes('bellator') || desc.includes('pfl');
      });

      const unblockedMarkets = combatMarkets.filter(m => !blockedIds.has(m.market_id));
      setMarkets(unblockedMarkets);
    } catch (error) {
      console.error('Error fetching markets:', error);
      toast.error('Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  // Filter matches based on active filter
  const filteredMatches = matches.filter(m => {
    if (activeFilter === 'all') return COMBAT_SPORTS.includes(m.sport);
    if (activeFilter === 'mma') return m.sport === 'ufc';
    if (activeFilter === 'boxing') return m.sport === 'boxing';
    return false;
  }).sort((a, b) => Number(a.commence_timestamp) - Number(b.commence_timestamp));

  const handleCreateMarket = async (match: SportsMatch, team: string) => {
    setCreating(true);
    try {
      const teamSlug = team.toLowerCase().replace(/\s+/g, '_');
      const marketId = `sports_${match.event_id}_${teamSlug}`;
      
      await createSportsMarket({
        event_id: match.event_id,
        sport: match.sport,
        sport_key: match.sport,
        home_team: match.home_team,
        away_team: match.away_team,
        commence_time: new Date(Number(match.commence_timestamp) * 1000).toISOString(),
        commence_timestamp: Number(match.commence_timestamp),
      }, team);
      
      setNewlyCreatedMarketId(marketId);
      await fetchMarkets();
      setActiveTab('markets');
      setTimeout(() => {
        marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setTimeout(() => setNewlyCreatedMarketId(null), 5000);
    } catch (error) {
      console.error('Error creating market:', error);
    } finally {
      setCreating(false);
      setTeamSelectDialog({ open: false, match: null });
    }
  };

  const getMatchMarketStatus = (match: SportsMatch) => {
    if (!match.home_team || !match.away_team) return 'none';
    const homeSlug = match.home_team.toLowerCase().replace(/\s+/g, '_');
    const awaySlug = match.away_team.toLowerCase().replace(/\s+/g, '_');
    const homeExists = markets.some(m => m.market_id === `sports_${match.event_id}_${homeSlug}`);
    const awayExists = markets.some(m => m.market_id === `sports_${match.event_id}_${awaySlug}`);
    
    if (homeExists && awayExists) return 'both';
    if (homeExists || awayExists) return 'partial';
    return 'none';
  };

  const getOdds = (market: PredictionMarket) => {
    const total = market.yes_pool_xmr + market.no_pool_xmr;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.yes_pool_xmr / total) * 100),
      no: Math.round((market.no_pool_xmr / total) * 100),
    };
  };

  const getStatusBadge = (market: PredictionMarket) => {
    const now = Date.now() / 1000;
    if (market.resolved) {
      if (market.outcome === 'YES') {
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> YES Won</Badge>;
      } else {
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> NO Won</Badge>;
      }
    }
    if (market.resolution_time <= now) {
      return <Badge className="bg-amber-600 animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Resolving...</Badge>;
    }
    return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
  };

  const formatMatchTime = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    const date = new Date(ts * 1000);
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amountUsd = parseFloat(betAmountUsd);
    if (isNaN(amountUsd) || amountUsd < 1) {
      toast.error('Minimum bet is $1');
      return;
    }

    if (!payoutAddress || (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8'))) {
      toast.error('Please enter a valid Monero address');
      return;
    }
    
    setPlacingBet(true);
    try {
      const response = await api.placePredictionBet({
        market_id: selectedMarket.market_id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
        payout_address: payoutAddress,
      });
      
      storeBet(response);
      setCurrentBetData(response);
      setBetDialogOpen(false);
      setDepositModalOpen(true);
      setBetAmountUsd('');
      setPayoutAddress('');
      
      toast.success('Bet created! Send XMR to confirm.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place bet');
    } finally {
      setPlacingBet(false);
    }
  };

  const now = Date.now() / 1000;
  const activeMarkets = markets.filter(m => m.resolved === 0 && m.resolution_time > now);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/predict" className="hover:text-foreground">Predictions</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/sports-predictions" className="hover:text-foreground">Sports</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Combat</span>
          </div>

          {/* Hero */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Swords className="w-8 h-8 text-red-500" />
                Combat Sports
              </h1>
              <p className="text-muted-foreground mt-1">UFC • Boxing • MMA</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchMarkets(); }} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Banners */}
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Need XMR to place bets?</p>
              <Link to="/swaps" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Get XMR <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-between">
              <p className="text-sm text-muted-foreground">New to parimutuel betting?</p>
              <Link to="/how-betting-works" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <HelpCircle className="w-4 h-4" /> Learn How It Works
              </Link>
            </div>
          </div>

          {/* Live Combat TV */}
          <div className="mb-6">
            <TrillerTVEmbed />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'outline'} 
              onClick={() => setActiveFilter('all')}
              className={activeFilter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              🥊 All Combat
            </Button>
            <Button 
              variant={activeFilter === 'mma' ? 'default' : 'outline'} 
              onClick={() => setActiveFilter('mma')}
              className={activeFilter === 'mma' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              🥋 MMA / UFC
            </Button>
            <Button 
              variant={activeFilter === 'boxing' ? 'default' : 'outline'} 
              onClick={() => setActiveFilter('boxing')}
              className={activeFilter === 'boxing' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              🥊 Boxing
            </Button>
            <Button 
              variant="outline" 
              asChild
            >
              <Link to="/slap">👋 Slap Fighting</Link>
            </Button>
            <Button 
              variant="outline" 
              asChild
            >
              <Link to="/russian-mma">🐻 Eastern MMA</Link>
            </Button>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            </TabsList>

            {/* Upcoming Matches */}
            <TabsContent value="upcoming" className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Fights
              </h2>
              
              {matchesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading fights...</p>
                </div>
              ) : filteredMatches.length === 0 ? (
                <Card className="bg-secondary/30">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No upcoming {activeFilter === 'all' ? 'combat' : activeFilter} fights found</p>
                    <p className="text-sm text-muted-foreground mt-2">Check back later for new events</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredMatches.map((match) => {
                    const marketStatus = getMatchMarketStatus(match);
                    return (
                      <Card key={match.event_id} className="hover:border-red-500/50 transition-colors">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {match.sport === 'ufc' ? '🥋 UFC' : '🥊 Boxing'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatMatchTime(match.commence_timestamp)}
                                </span>
                              </div>
                              <div className="text-lg font-semibold">
                                {match.home_team} vs {match.away_team}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {marketStatus === 'both' ? (
                                <Badge className="bg-green-600">Markets Open</Badge>
                              ) : marketStatus === 'partial' ? (
                                <Badge className="bg-amber-600">Partial</Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => setTeamSelectDialog({ open: true, match })}
                                  disabled={creating}
                                >
                                  Create Market
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Markets Tab */}
            <TabsContent value="markets" ref={marketsRef} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Open Markets ({activeMarkets.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading markets...</p>
                </div>
              ) : activeMarkets.length === 0 ? (
                <Card className="bg-secondary/30">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No open combat markets</p>
                    <p className="text-sm text-muted-foreground mt-2">Create one from the Upcoming tab</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeMarkets.map((market) => {
                    const odds = getOdds(market);
                    const marketBets = getBetsForMarket(market.market_id);
                    
                    return (
                      <Card 
                        key={market.market_id} 
                        className={`hover:border-red-500/50 transition-all cursor-pointer ${
                          newlyCreatedMarketId === market.market_id 
                            ? 'animate-pulse ring-2 ring-red-500 shadow-lg shadow-red-500/20' 
                            : ''
                        }`}
                        onClick={() => { setSelectedMarket(market); setBetDialogOpen(true); }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            {getStatusBadge(market)}
                            <span className="text-xs text-muted-foreground">
                              Resolves: {new Date(market.resolution_time * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-lg">{market.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{market.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium">YES</span>
                              </div>
                              <div className="text-xl font-bold text-emerald-500">{odds.yes}%</div>
                              <div className="text-xs text-muted-foreground">
                                {market.yes_pool_xmr.toFixed(4)} XMR
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">NO</span>
                              </div>
                              <div className="text-xl font-bold text-red-500">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">
                                {market.no_pool_xmr.toFixed(4)} XMR
                              </div>
                            </div>
                          </div>
                          {marketBets.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground">
                                You have {marketBets.length} bet(s) on this market
                              </p>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t flex justify-end">
                            <AddToSlipButton
                              marketId={market.market_id}
                              marketTitle={market.title}
                              yesPool={market.yes_pool_xmr || 0}
                              noPool={market.no_pool_xmr || 0}
                              onAdd={betSlip.addToBetSlip}
                              onOpenSlip={() => betSlip.setIsOpen(true)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <h2 className="text-xl font-semibold">Resolved Markets</h2>
              {resolvedMarkets.length === 0 ? (
                <Card className="bg-secondary/30">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No resolved markets yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {resolvedMarkets.map((market) => (
                    <Card key={market.market_id} className="opacity-75">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(market)}
                        </div>
                        <CardTitle className="text-lg">{market.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{market.description}</p>
                        <div className="mt-2 text-sm">
                          Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Bets Tab */}
            <TabsContent value="my-bets">
              <MyBets 
                bets={bets}
                onStatusUpdate={checkBetStatus}
                onPayoutSubmit={submitPayoutAddress}
              />
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="mt-12 grid sm:grid-cols-2 gap-4">
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🥋 Eastern Combat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  ONE Championship, Top Dog FC, Road FC
                </p>
                <Link to="/predictions/sports/combat/eastern">
                  <Button variant="outline" size="sm">View Markets →</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">👋 Slap Fighting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Power Slap, Punchdown
                </p>
                <Link to="/predictions/sports/combat/slap">
                  <Button variant="outline" size="sm">View Markets →</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Team Select Dialog */}
      <Dialog open={teamSelectDialog.open} onOpenChange={(open) => setTeamSelectDialog({ open, match: teamSelectDialog.match })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>
              Select which fighter to create a market for
            </DialogDescription>
          </DialogHeader>
          {teamSelectDialog.match && (
            <div className="grid gap-3">
              <Button 
                onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.home_team)}
                disabled={creating}
                className="bg-red-600 hover:bg-red-700"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {teamSelectDialog.match.home_team} wins?
              </Button>
              <Button 
                onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.away_team)}
                disabled={creating}
                variant="outline"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {teamSelectDialog.match.away_team} wins?
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
            <DialogDescription>{selectedMarket?.title}</DialogDescription>
          </DialogHeader>
          {selectedMarket && (
            <div className="space-y-4">
              <PoolTransparency marketId={selectedMarket.market_id} />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={betSide === 'yes' ? 'default' : 'outline'}
                  onClick={() => setBetSide('yes')}
                  className={betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  YES ({getOdds(selectedMarket).yes}%)
                </Button>
                <Button
                  variant={betSide === 'no' ? 'default' : 'outline'}
                  onClick={() => setBetSide('no')}
                  className={betSide === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  NO ({getOdds(selectedMarket).no}%)
                </Button>
              </div>
              <div>
                <Label>Bet Amount (USD)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={betAmountUsd}
                  onChange={(e) => setBetAmountUsd(e.target.value)}
                  min="1"
                />
                {betAmountUsd && xmrUsdRate > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {(parseFloat(betAmountUsd) / xmrUsdRate).toFixed(6)} XMR
                  </p>
                )}
              </div>
              <div>
                <Label>Payout Address (Monero)</Label>
                <Input
                  placeholder="4... or 8..."
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                />
              </div>
              <Button 
                onClick={handlePlaceBet} 
                disabled={placingBet}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {placingBet ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Place Bet
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      {currentBetData && (
        <BetDepositModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
          betData={currentBetData}
          onCheckStatus={checkBetStatus}
          onConfirmed={() => fetchMarkets()}
        />
      )}

      {/* Multibet Slip */}
      <BetSlipPanel
        items={betSlip.items}
        isOpen={betSlip.isOpen}
        onOpenChange={betSlip.setIsOpen}
        onRemove={betSlip.removeFromBetSlip}
        onUpdateAmount={betSlip.updateAmount}
        onClear={betSlip.clearBetSlip}
        onReorder={betSlip.reorderItems}
        onUndo={betSlip.undoRemove}
        lastRemoved={betSlip.lastRemoved}
        totalUsd={betSlip.totalUsd}
        calculatePotentialPayout={betSlip.calculatePotentialPayout}
        calculateTotalPotentialPayout={betSlip.calculateTotalPotentialPayout}
        isCheckingOut={betSlip.isCheckingOut}
        onCheckout={async (payoutAddress) => {
          if (betSlip.activeSlip && betSlip.activeSlip.status === 'awaiting_deposit') {
            setMultibetDepositOpen(true);
            return betSlip.activeSlip;
          }
          const slip = await betSlip.checkout(payoutAddress);
          if (slip) {
            setMultibetDepositOpen(true);
          }
          return slip;
        }}
        activeSlip={betSlip.activeSlip}
        onViewActiveSlip={() => setMultibetDepositOpen(true)}
        awaitingDepositCount={betSlip.savedSlips.filter(s => s.status === 'awaiting_deposit').length}
        onCheckResolvedMarkets={betSlip.checkAndRemoveResolvedMarkets}
      />

      {betSlip.activeSlip && (
        <MultibetDepositModal
          open={multibetDepositOpen}
          onOpenChange={setMultibetDepositOpen}
          slip={betSlip.activeSlip}
          onCheckStatus={betSlip.checkSlipStatus}
          onUpdatePayoutAddress={betSlip.updatePayoutAddress}
          onConfirmed={() => {
            betSlip.clearBetSlip();
            fetchMarkets();
          }}
        />
      )}
    </div>
  );
}
