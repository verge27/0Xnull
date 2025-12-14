import { useState, useEffect } from 'react';
import sportsBackground from '@/assets/sports-background.jpg';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useSportsEvents, getSportLabel, getSportEmoji, type SportsEvent } from '@/hooks/useSportsEvents';
import { api, type PredictionMarket } from '@/services/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { MyBets } from '@/components/MyBets';
import { TeamLogo } from '@/components/TeamLogo';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Wallet, Trophy, Calendar, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const SPORTS = ['nfl', 'premier_league', 'ufc'] as const;

export default function SportsPredictions() {
  const { bets, storeBet, checkBetStatus, getBetsForMarket, submitPayoutAddress } = usePredictionBets();
  const { events, loading: eventsLoading, fetchEvents, createSportsMarket, liveScores, startLiveScorePolling, stopLiveScorePolling, pollingActive, lastUpdated } = useSportsEvents();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: SportsEvent | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);
  

  useEffect(() => {
    fetchMarkets();
    fetchEvents();
    
    const interval = setInterval(() => {
      fetchMarkets();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      stopLiveScorePolling();
    };
  }, [fetchEvents, stopLiveScorePolling]);

  // Start polling for live scores when we have live events
  useEffect(() => {
    const now = Date.now() / 1000;
    // Only poll for events that have started and are within a reasonable game duration
    const liveEvents = events.filter(e => {
      const gameStarted = e.commence_timestamp <= now;
      const withinWindow = e.commence_timestamp > now - 14400; // Within last 4 hours
      return gameStarted && withinWindow;
    });
    
    if (liveEvents.length > 0) {
      startLiveScorePolling(liveEvents);
    } else {
      stopLiveScorePolling();
    }
  }, [events, startLiveScorePolling, stopLiveScorePolling]);

  const fetchMarkets = async () => {
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      // Filter to only sports markets
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'sports'));
    } catch (error) {
      console.error('Error fetching markets:', error);
      toast.error('Failed to load markets');
    } finally {
      setLoading(false);
    }
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

  const handleCreateMarket = async (event: SportsEvent, team: string) => {
    setCreating(true);
    const success = await createSportsMarket(event, team);
    setCreating(false);
    setTeamSelectDialog({ open: false, event: null });
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

  const formatGameTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventMarketStatus = (event: SportsEvent) => {
    const homeSlug = event.home_team.toLowerCase().replace(/\s+/g, '_');
    const awaySlug = event.away_team.toLowerCase().replace(/\s+/g, '_');
    const homeExists = markets.some(m => m.market_id === `sports_${event.event_id}_${homeSlug}`);
    const awayExists = markets.some(m => m.market_id === `sports_${event.event_id}_${awaySlug}`);
    
    if (homeExists && awayExists) return 'both';
    if (homeExists || awayExists) return 'partial';
    return 'none';
  };

  // Filter events
  const filteredEvents = selectedSport === 'all' 
    ? events 
    : events.filter(e => e.sport === selectedSport);

  // Separate active and resolved markets
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Sports Predictions
            </h1>
            <p className="text-muted-foreground mt-1">Bet on NFL, Premier League & UFC with XMR</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/predictions">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Crypto
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={fetchMarkets} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events
                </CardTitle>
                {lastUpdated && pollingActive && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <Tabs value={selectedSport} onValueChange={(v) => {
                  setSelectedSport(v);
                  if (v === 'all') fetchEvents();
                  else fetchEvents(v);
                }}>
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    {SPORTS.map(sport => (
                      <TabsTrigger key={sport} value={sport} className="flex-1">
                        {getSportEmoji(sport)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={selectedSport} className="mt-0">
                    {eventsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No upcoming events</div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {filteredEvents.map(event => {
                          const marketStatus = getEventMarketStatus(event);
                          const now = Date.now() / 1000;
                          const isLive = event.commence_timestamp <= now;
                          
                          return (
                            <div
                              key={event.event_id}
                              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span>{getSportEmoji(event.sport)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getSportLabel(event.sport)}
                                  </Badge>
                                  {liveScores[event.event_id]?.completed ? (
                                    <Badge className="bg-muted text-muted-foreground text-xs">
                                      FINAL
                                    </Badge>
                                  ) : isLive && (
                                    <Badge className="bg-red-600 text-xs animate-pulse flex items-center gap-1">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                      </span>
                                      LIVE
                                    </Badge>
                                  )}
                                  {liveScores[event.event_id]?.statusDetail && !liveScores[event.event_id]?.completed && (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {liveScores[event.event_id].statusDetail}
                                    </Badge>
                                  )}
                                  {marketStatus === 'both' && (
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 font-medium text-sm mb-1">
                                {(() => {
                                  const score = liveScores[event.event_id];
                                  const awayScore = score?.scores.find(s => 
                                    s.name.toLowerCase().includes(event.away_team.toLowerCase()) || 
                                    event.away_team.toLowerCase().includes(s.name.toLowerCase())
                                  )?.score || '0';
                                  const homeScore = score?.scores.find(s => 
                                    s.name.toLowerCase().includes(event.home_team.toLowerCase()) || 
                                    event.home_team.toLowerCase().includes(s.name.toLowerCase())
                                  )?.score || '0';
                                  const awayWon = score?.completed && parseInt(awayScore) > parseInt(homeScore);
                                  const homeWon = score?.completed && parseInt(homeScore) > parseInt(awayScore);
                                  
                                  return (
                                    <>
                                      <TeamLogo teamName={event.away_team} sport={event.sport} size="sm" />
                                      <span className={awayWon ? 'text-emerald-500 font-semibold' : ''}>{event.away_team}</span>
                                      {score && (
                                        <span className={`font-bold ${awayWon ? 'text-emerald-500' : score.completed ? 'text-muted-foreground' : 'text-primary'}`}>
                                          {awayScore}
                                        </span>
                                      )}
                                      <span className="text-muted-foreground">@</span>
                                      {score && (
                                        <span className={`font-bold ${homeWon ? 'text-emerald-500' : score.completed ? 'text-muted-foreground' : 'text-primary'}`}>
                                          {homeScore}
                                        </span>
                                      )}
                                      <TeamLogo teamName={event.home_team} sport={event.sport} size="sm" />
                                      <span className={homeWon ? 'text-emerald-500 font-semibold' : ''}>{event.home_team}</span>
                                    </>
                                  );
                                })()}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatGameTime(event.commence_timestamp)}
                                </span>
                                
                                {marketStatus !== 'both' && !isLive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setTeamSelectDialog({ open: true, event })}
                                  >
                                    <Users className="w-3 h-3 mr-1" />
                                    Create
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Markets */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
            ) : activeMarkets.length === 0 && resolvedMarkets.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No sports markets yet.</p>
                  <p className="text-sm text-muted-foreground">Select an event from the left panel or click "Auto-Create 24h" to create markets.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Active Markets */}
                {activeMarkets.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Active Markets ({activeMarkets.length})
                    </h2>
                    <div className="grid gap-4">
                      {activeMarkets.map((market) => {
                        const odds = getOdds(market);
                        const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                        const pendingBets = getBetsForMarket(market.market_id);
                        
                        return (
                          <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">🏆 Sports</Badge>
                                  </div>
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
                                {/* Odds bar */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-emerald-500 font-medium">YES {odds.yes}%</span>
                                    <span className="text-red-500 font-medium">NO {odds.no}%</span>
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
                                    <span>{market.yes_pool_xmr.toFixed(4)} XMR</span>
                                    <span>Pool: {totalPool.toFixed(4)} XMR</span>
                                    <span>{market.no_pool_xmr.toFixed(4)} XMR</span>
                                  </div>
                                </div>
                                
                                {/* Pending bets */}
                                {pendingBets.length > 0 && (
                                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-amber-500" />
                                      Your Pending Bets
                                    </p>
                                    {pendingBets.map((bet) => (
                                      <div key={bet.bet_id} className="flex justify-between text-sm">
                                        <span className={bet.side === 'YES' ? 'text-emerald-500' : 'text-red-500'}>
                                          ${bet.amount_usd.toFixed(2)} on {bet.side}
                                        </span>
                                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                                          {bet.status === 'awaiting_deposit' ? 'Awaiting Deposit' : bet.status}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Actions */}
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
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Resolved Markets */}
                {resolvedMarkets.length > 0 && (
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between mb-4 hover:bg-muted/50">
                        <span className="flex items-center gap-2 text-lg font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          Resolved Markets ({resolvedMarkets.length})
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-4">
                        {resolvedMarkets.map((market) => {
                          const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                          
                          return (
                            <Card key={market.market_id} className="opacity-75">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{market.title}</CardTitle>
                                  </div>
                                  <Badge 
                                    className={market.outcome === 'YES' 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                    }
                                  >
                                    {market.outcome === 'YES' ? 'YES Won' : 'NO Won'}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">
                                  Pool: {totalPool.toFixed(4)} XMR
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* My Bets */}
                <MyBets 
                  bets={bets.filter(b => b.market_id.startsWith('sports_'))} 
                  onStatusUpdate={checkBetStatus} 
                  onPayoutSubmit={submitPayoutAddress}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Team Selection Dialog */}
      <Dialog 
        open={teamSelectDialog.open} 
        onOpenChange={(open) => setTeamSelectDialog({ open, event: open ? teamSelectDialog.event : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sports Market</DialogTitle>
            <DialogDescription>
              Select which team you want to create a "Will they win?" market for.
            </DialogDescription>
          </DialogHeader>
          
          {teamSelectDialog.event && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                {getSportEmoji(teamSelectDialog.event.sport)} {getSportLabel(teamSelectDialog.event.sport)} •{' '}
                {formatGameTime(teamSelectDialog.event.commence_timestamp)}
              </div>
              
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-16 text-lg justify-start px-6"
                  onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.home_team)}
                  disabled={creating || markets.some(m => 
                    m.market_id === `sports_${teamSelectDialog.event!.event_id}_${teamSelectDialog.event!.home_team.toLowerCase().replace(/\s+/g, '_')}`
                  )}
                >
                  <TeamLogo teamName={teamSelectDialog.event.home_team} sport={teamSelectDialog.event.sport} size="lg" className="mr-3" />
                  {teamSelectDialog.event.home_team}
                  {markets.some(m => 
                    m.market_id === `sports_${teamSelectDialog.event!.event_id}_${teamSelectDialog.event!.home_team.toLowerCase().replace(/\s+/g, '_')}`
                  ) && <Badge variant="secondary" className="ml-auto">Exists</Badge>}
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 text-lg justify-start px-6"
                  onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.away_team)}
                  disabled={creating || markets.some(m => 
                    m.market_id === `sports_${teamSelectDialog.event!.event_id}_${teamSelectDialog.event!.away_team.toLowerCase().replace(/\s+/g, '_')}`
                  )}
                >
                  <TeamLogo teamName={teamSelectDialog.event.away_team} sport={teamSelectDialog.event.sport} size="lg" className="mr-3" />
                  {teamSelectDialog.event.away_team}
                  {markets.some(m => 
                    m.market_id === `sports_${teamSelectDialog.event!.event_id}_${teamSelectDialog.event!.away_team.toLowerCase().replace(/\s+/g, '_')}`
                  ) && <Badge variant="secondary" className="ml-auto">Exists</Badge>}
                </Button>
              </div>
              
              {creating && (
                <div className="text-center text-sm text-muted-foreground">
                  Creating market...
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Place Bet: <Badge className={betSide === 'yes' ? 'bg-emerald-600' : 'bg-red-600'}>{betSide.toUpperCase()}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedMarket && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedMarket.title}</p>
              
              <div className="space-y-2">
                <Label htmlFor="bet-amount">Bet Amount (USD)</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount in USD"
                  value={betAmountUsd}
                  onChange={(e) => setBetAmountUsd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Minimum bet: $1</p>
              </div>
              
              <Button 
                onClick={handlePlaceBet} 
                disabled={placingBet || !betAmountUsd}
                className="w-full"
              >
                {placingBet ? 'Creating Bet...' : 'Get Deposit Address'}
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
          onConfirmed={handleBetConfirmed}
          onCheckStatus={checkBetStatus}
        />
      )}

        <Footer />
      </div>
    </div>
  );
}
