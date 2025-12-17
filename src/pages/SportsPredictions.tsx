import { useState, useEffect } from 'react';
import sportsBackground from '@/assets/sports-background.jpg';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useSportsEvents, getSportLabel as getLegacySportLabel, getSportEmoji, type SportsEvent } from '@/hooks/useSportsEvents';
import { useSportsCategories, useSportsMatches, useSportsOdds, PRIORITY_SPORTS, getSportLabel, getCategoryLabel, type SportsMatch } from '@/hooks/useSportsCategories';
import { api, type PredictionMarket } from '@/services/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TeamLogo } from '@/components/TeamLogo';
import { SportsCategoryPills } from '@/components/SportsCategoryPills';
import { SportsLeagueSelect } from '@/components/SportsLeagueSelect';
import { SportsMatchCard } from '@/components/SportsMatchCard';
import { toast } from 'sonner';
import { TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Trophy, Calendar, ArrowRight, Filter, HelpCircle, Tv, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoHighlight {
  title: string;
  competition: string;
  matchviewUrl: string;
  thumbnail: string;
  date: string;
  videos: Array<{
    title: string;
    embed: string;
  }>;
}

export default function SportsPredictions() {
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { createSportsMarket, liveScores, startLiveScorePolling, stopLiveScorePolling, pollingActive, lastUpdated } = useSportsEvents();
  const { categories, loading: categoriesLoading } = useSportsCategories();
  const { matches, loading: matchesLoading, fetchByCategory, fetchBySport, fetchAll } = useSportsMatches();
  const { odds, fetchOdds } = useSportsOdds();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  // Category/League filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; match: SportsMatch | null }>({
    open: false,
    match: null,
  });
  const [creating, setCreating] = useState(false);
  
  // Video highlights
  const [highlights, setHighlights] = useState<VideoHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  // Get available leagues for selected category
  const availableLeagues = selectedCategory ? categories[selectedCategory] || [] : [];
  
  // Sort leagues by priority
  const sortedLeagues = [...availableLeagues].sort((a, b) => {
    const aPriority = PRIORITY_SPORTS.indexOf(a);
    const bPriority = PRIORITY_SPORTS.indexOf(b);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });

  useEffect(() => {
    fetchMarkets();
    fetchAll();
    fetchHighlights();
    
    const interval = setInterval(() => {
      fetchMarkets();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      stopLiveScorePolling();
    };
  }, [fetchAll, stopLiveScorePolling]);

  const fetchHighlights = async () => {
    setHighlightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scorebat-videos');
      if (error) throw error;
      
      // API returns { response: [...videos...] }
      const videos = data?.response && Array.isArray(data.response) ? data.response.slice(0, 12) : [];
      setHighlights(videos);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setHighlightsLoading(false);
    }
  };

  // Fetch matches when category/league changes
  useEffect(() => {
    if (selectedLeague) {
      fetchBySport(selectedLeague);
      fetchOdds(selectedLeague);
    } else if (selectedCategory) {
      fetchByCategory(selectedCategory);
    } else {
      fetchAll();
    }
  }, [selectedCategory, selectedLeague, fetchByCategory, fetchBySport, fetchAll, fetchOdds]);

  // Start polling for live scores
  useEffect(() => {
    const now = Date.now() / 1000;
    const liveEvents = matches.filter(m => {
      const gameStarted = m.commence_timestamp <= now;
      const withinWindow = m.commence_timestamp > now - 14400;
      return gameStarted && withinWindow;
    }).map(m => ({
      ...m,
      commence_time: new Date(m.commence_timestamp * 1000).toISOString(),
    })) as SportsEvent[];
    
    if (liveEvents.length > 0) {
      startLiveScorePolling(liveEvents);
    } else {
      stopLiveScorePolling();
    }
  }, [matches, startLiveScorePolling, stopLiveScorePolling]);

  const fetchMarkets = async () => {
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'sports'));
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedLeague(null);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amountUsd = parseFloat(betAmountUsd);
    if (isNaN(amountUsd) || amountUsd < 1) {
      toast.error('Minimum bet is $1');
      return;
    }
    
    setPlacingBet(true);
    
    try {
      const response = await api.placePredictionBet({
        market_id: selectedMarket.market_id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
      });
      
      storeBet(response);
      setCurrentBetData(response);
      setBetDialogOpen(false);
      setDepositModalOpen(true);
      setBetAmountUsd('');
      
      toast.success('Bet created! Send XMR to confirm.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bet';
      toast.error(message);
    } finally {
      setPlacingBet(false);
    }
  };
  
  const handleBetConfirmed = () => {
    fetchMarkets();
  };

  const handleCreateMarket = async (match: SportsMatch, team: string) => {
    setCreating(true);
    const event: SportsEvent = {
      ...match,
      commence_time: new Date(match.commence_timestamp * 1000).toISOString(),
    };
    const success = await createSportsMarket(event, team);
    setCreating(false);
    setTeamSelectDialog({ open: false, match: null });
    if (success) {
      fetchMarkets();
    }
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

  // Get odds for a match
  const getMatchOdds = (match: SportsMatch) => {
    return odds.find(o => o.event_id === match.event_id);
  };

  // Sort matches with priority sports first
  const sortedMatches = [...matches].sort((a, b) => {
    const aPriority = PRIORITY_SPORTS.indexOf(a.sport);
    const bPriority = PRIORITY_SPORTS.indexOf(b.sport);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return a.commence_timestamp - b.commence_timestamp;
  });

  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${sportsBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      </div>
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                Sports Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on sports events worldwide with XMR</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/predictions">
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Crypto
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => { fetchMarkets(); fetchAll(); }} disabled={loading || matchesLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${(loading || matchesLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Banners */}
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Need XMR to place bets?</p>
              <Link to="/swaps" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Get XMR <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Worried about your browsing being watched?</p>
              <Link to="/tor-guide" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Use Tor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-between">
              <p className="text-sm text-muted-foreground">New to parimutuel betting?</p>
              <Link to="/how-betting-works" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <HelpCircle className="w-4 h-4" /> Learn How It Works
              </Link>
            </div>
          </div>

          {/* Video Highlights */}
          <div className="mb-6">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  Latest Match Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {highlightsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading highlights...</div>
                ) : highlights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No highlights available</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {highlights.map((highlight, idx) => (
                      <div 
                        key={idx} 
                        className="group cursor-pointer"
                        onClick={() => {
                          if (highlight.matchviewUrl) {
                            window.open(highlight.matchviewUrl, '_blank');
                          } else {
                            toast.error('No video URL available for this match');
                          }
                        }}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={highlight.thumbnail} 
                            alt={highlight.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-8 h-8 text-white" />
                          </div>
                          <Badge className="absolute bottom-2 left-2 bg-black/70 text-xs">
                            {highlight.competition}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium line-clamp-2">{highlight.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(highlight.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Pills */}
          <div className="mb-6">
            {!categoriesLoading && (
              <SportsCategoryPills
                categories={Object.keys(categories)}
                selectedCategory={selectedCategory}
                onSelect={handleCategoryChange}
              />
            )}
          </div>

          {/* League Filter */}
          {selectedCategory && availableLeagues.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SportsLeagueSelect
                leagues={sortedLeagues}
                selectedLeague={selectedLeague}
                onSelect={setSelectedLeague}
              />
            </div>
          )}

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            </TabsList>

            {/* Upcoming Events Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Matches
                  {matches.length > 0 && (
                    <Badge variant="secondary">{matches.length}</Badge>
                  )}
                </h2>
                {lastUpdated && pollingActive && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {matchesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading events...</div>
              ) : sortedMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedCategory || selectedLeague 
                    ? 'No upcoming events in this category' 
                    : 'No upcoming events'}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedMatches.map(match => {
                    const marketStatus = getMatchMarketStatus(match);
                    const matchOdds = getMatchOdds(match);
                    const now = Date.now() / 1000;
                    const isLive = match.commence_timestamp <= now && match.commence_timestamp > now - 14400;
                    
                    return (
                      <SportsMatchCard
                        key={match.event_id}
                        match={match}
                        odds={matchOdds}
                        onBetClick={(m) => setTeamSelectDialog({ open: true, match: m })}
                        isLive={isLive}
                        hasMarket={marketStatus !== 'none'}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Markets Tab */}
            <TabsContent value="markets" className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Markets ({activeMarkets.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
              ) : activeMarkets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No active markets yet.</p>
                    <p className="text-sm text-muted-foreground">Go to Upcoming tab to create markets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeMarkets.map((market) => {
                    const odds = getOdds(market);
                    const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                    
                    return (
                      <Card key={market.market_id} className="hover:border-primary/50 transition-colors bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{market.title}</CardTitle>
                              {market.description && (
                                <CardDescription className="mt-1 text-sm">{market.description}</CardDescription>
                              )}
                            </div>
                            {getStatusBadge(market)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{odds.yes}%</div>
                                <div className="text-xs text-muted-foreground">YES</div>
                              </div>
                              <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                <div className="text-2xl font-bold text-red-400">{odds.no}%</div>
                                <div className="text-xs text-muted-foreground">NO</div>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground text-center">
                              Total Pool: {totalPool.toFixed(4)} XMR
                            </div>
                            
                            {/* Pool Transparency */}
                            <PoolTransparency marketId={market.market_id} />
                            
                            
                            {!market.resolved && (
                              <Button 
                                className="w-full" 
                                onClick={() => { setSelectedMarket(market); setBetDialogOpen(true); }}
                              >
                                Place Bet
                              </Button>
                            )}
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
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resolved Markets ({resolvedMarkets.length})
              </h2>
              
              {resolvedMarkets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No resolved markets yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {resolvedMarkets.map((market) => (
                    <Card key={market.market_id} className="bg-card/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{market.title}</CardTitle>
                          {getStatusBadge(market)}
                        </div>
                        {market.description && (
                          <CardDescription className="text-sm">{market.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Resolved: {new Date(market.resolution_time * 1000).toLocaleDateString()}
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

          {/* Scorebat Live Scores */}
          <div className="mt-8">
            <Card className="bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  Live Football Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src="https://www.scorebat.com/embed/livescore/"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  allowFullScreen={true}
                  className="border-0"
                />
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>

      {/* Team Selection Dialog */}
      <Dialog 
        open={teamSelectDialog.open} 
        onOpenChange={(open) => setTeamSelectDialog({ open, match: open ? teamSelectDialog.match : null })}
      >
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Select Team to Bet On</DialogTitle>
            <DialogDescription>
              Choose which team you think will win
            </DialogDescription>
          </DialogHeader>
          
          {teamSelectDialog.match && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.home_team)}
                  disabled={creating}
                >
                  <TeamLogo teamName={teamSelectDialog.match.home_team} sport={teamSelectDialog.match.sport} size="md" />
                  <span className="font-medium">{teamSelectDialog.match.home_team}</span>
                  <span className="text-xs text-muted-foreground">Home</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.away_team)}
                  disabled={creating}
                >
                  <TeamLogo teamName={teamSelectDialog.match.away_team} sport={teamSelectDialog.match.sport} size="md" />
                  <span className="font-medium">{teamSelectDialog.match.away_team}</span>
                  <span className="text-xs text-muted-foreground">Away</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
            <DialogDescription>
              {selectedMarket?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMarket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={betSide === 'yes' ? 'default' : 'outline'}
                  onClick={() => setBetSide('yes')}
                  className={betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  YES
                </Button>
                <Button
                  variant={betSide === 'no' ? 'default' : 'outline'}
                  onClick={() => setBetSide('no')}
                  className={betSide === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  NO
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Bet Amount (USD)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={betAmountUsd}
                  onChange={(e) => setBetAmountUsd(e.target.value)}
                  placeholder="Enter amount in USD"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handlePlaceBet}
                disabled={placingBet || !betAmountUsd}
              >
                {placingBet ? 'Creating Bet...' : 'Create Bet'}
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
          onConfirmed={handleBetConfirmed}
        />
      )}
    </div>
  );
}
