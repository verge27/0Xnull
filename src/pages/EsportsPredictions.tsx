import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import esportsBackground from '@/assets/esports-background.jpg';
import { useEsportsEvents, ESPORTS_GAMES, getGameLabel, getGameIcon, type EsportsEvent } from '@/hooks/useEsportsEvents';
import { api, type PredictionMarket } from '@/services/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { MyBets } from '@/components/MyBets';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Gamepad2, Calendar, Users, Swords } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function EsportsPredictions() {
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { events, liveEvents, loading: eventsLoading, fetchEvents, fetchLiveEvents, createEsportsMarket } = useEsportsEvents();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: EsportsEvent | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMarkets();
    fetchEvents();
    fetchLiveEvents();
    
    const interval = setInterval(() => {
      fetchMarkets();
      fetchLiveEvents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchEvents, fetchLiveEvents]);

  const fetchMarkets = async () => {
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'esports'));
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

  const handleCreateMarket = async (event: EsportsEvent, team: string) => {
    setCreating(true);
    const success = await createEsportsMarket(event, team);
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
    return new Date(timestamp * 1000).toLocaleString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC';
  };

  const getEventMarketStatus = (event: EsportsEvent) => {
    const teamASlug = event.team_a.toLowerCase().replace(/\s+/g, '_');
    const teamBSlug = event.team_b.toLowerCase().replace(/\s+/g, '_');
    const teamAExists = markets.some(m => m.market_id === `esports_${event.id}_${teamASlug}`);
    const teamBExists = markets.some(m => m.market_id === `esports_${event.id}_${teamBSlug}`);
    
    if (teamAExists && teamBExists) return 'both';
    if (teamAExists || teamBExists) return 'partial';
    return 'none';
  };

  const filteredEvents = selectedGame === 'all' 
    ? events 
    : events.filter(e => e.game === selectedGame);

  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${esportsBackground})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/80 via-background/70 to-background/95" />
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-primary" />
                Esports Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on LoL, CS2, Dota 2, Valorant & more with XMR</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/predictions">
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Crypto
                </Button>
              </Link>
              <Link to="/sports-predictions">
                <Button variant="outline" size="sm">
                  <Swords className="w-4 h-4 mr-2" />
                  Sports
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
                    Upcoming Matches
                    <span className="text-xs font-normal text-muted-foreground">(Times in UTC)</span>
                  </CardTitle>
                  {liveEvents.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      {liveEvents.length} live match{liveEvents.length > 1 ? 'es' : ''}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedGame} onValueChange={(v) => {
                    setSelectedGame(v);
                    if (v === 'all') fetchEvents();
                    else fetchEvents(v);
                  }}>
                    <TabsList className="mb-4 w-full flex-wrap h-auto gap-1">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      {ESPORTS_GAMES.map(game => (
                        <TabsTrigger key={game.key} value={game.key} className="text-xs" title={game.name}>
                          {game.icon}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value={selectedGame} className="mt-0">
                      {eventsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                      ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No upcoming matches</div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {filteredEvents.map(event => {
                            const marketStatus = getEventMarketStatus(event);
                            const isLive = event.status === 'live';
                            
                            return (
                              <div
                                key={event.id}
                                className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span title={getGameLabel(event.game)}>{getGameIcon(event.game)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getGameLabel(event.game)}
                                    </Badge>
                                    {isLive && (
                                      <Badge className="bg-red-600 text-xs animate-pulse flex items-center gap-1">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        LIVE
                                      </Badge>
                                    )}
                                    {marketStatus === 'both' && (
                                      <Badge variant="secondary" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 font-medium text-sm mb-1">
                                  {event.team_a_image && (
                                    <img src={event.team_a_image} alt={event.team_a} className="w-5 h-5 object-contain" />
                                  )}
                                  <span>{event.team_a}</span>
                                  <span className="text-muted-foreground">vs</span>
                                  <span>{event.team_b}</span>
                                  {event.team_b_image && (
                                    <img src={event.team_b_image} alt={event.team_b} className="w-5 h-5 object-contain" />
                                  )}
                                </div>
                                
                                <p className="text-xs text-muted-foreground mb-2 truncate">{event.tournament}</p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatGameTime(event.start_timestamp)}
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
                    <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No esports markets yet.</p>
                    <p className="text-sm text-muted-foreground">Select a match from the left panel to create markets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Active Markets */}
                  {activeMarkets.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Active Markets ({activeMarkets.length})
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {activeMarkets.map(market => {
                          const odds = getOdds(market);
                          const marketBets = getBetsForMarket(market.market_id);
                          
                          return (
                            <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{market.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">{market.description}</p>
                                  </div>
                                  {getStatusBadge(market)}
                                </div>
                              </CardHeader>
                              <CardContent>
                                {/* Odds Display */}
                                <div className="flex gap-2 mb-4">
                                  <div className="flex-1 p-2 rounded bg-emerald-600/20 border border-emerald-600/30 text-center">
                                    <div className="text-lg font-bold text-emerald-500">{odds.yes}%</div>
                                    <div className="text-xs text-muted-foreground">YES</div>
                                  </div>
                                  <div className="flex-1 p-2 rounded bg-red-600/20 border border-red-600/30 text-center">
                                    <div className="text-lg font-bold text-red-500">{odds.no}%</div>
                                    <div className="text-xs text-muted-foreground">NO</div>
                                  </div>
                                </div>
                                
                                {/* Pool Info */}
                                <div className="text-xs text-muted-foreground mb-4 flex justify-between">
                                  <span>Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR</span>
                                  <span>Resolves: {new Date(market.resolution_time * 1000).toLocaleDateString()}</span>
                                </div>
                                
                                {/* Bet Buttons */}
                                <div className="flex gap-2">
                                  <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => {
                                      setSelectedMarket(market);
                                      setBetSide('yes');
                                      setBetDialogOpen(true);
                                    }}
                                  >
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    Bet YES
                                  </Button>
                                  <Button 
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                    onClick={() => {
                                      setSelectedMarket(market);
                                      setBetSide('no');
                                      setBetDialogOpen(true);
                                    }}
                                  >
                                    <TrendingDown className="w-4 h-4 mr-1" />
                                    Bet NO
                                  </Button>
                                </div>
                                
                                {marketBets.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-muted-foreground">You have {marketBets.length} bet(s) on this market</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resolved Markets */}
                  {resolvedMarkets.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Resolved Markets ({resolvedMarkets.length})
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          {resolvedMarkets.map(market => {
                            const odds = getOdds(market);
                            return (
                              <Card key={market.market_id} className="opacity-75">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{market.title}</CardTitle>
                                    {getStatusBadge(market)}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex gap-2">
                                    <div className={`flex-1 p-2 rounded text-center ${market.outcome === 'YES' ? 'bg-emerald-600/30' : 'bg-muted'}`}>
                                      <div className="text-lg font-bold">{odds.yes}%</div>
                                      <div className="text-xs text-muted-foreground">YES</div>
                                    </div>
                                    <div className={`flex-1 p-2 rounded text-center ${market.outcome === 'NO' ? 'bg-red-600/30' : 'bg-muted'}`}>
                                      <div className="text-lg font-bold">{odds.no}%</div>
                                      <div className="text-xs text-muted-foreground">NO</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
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
                    bets={bets} 
                    onStatusUpdate={checkBetStatus}
                    onPayoutSubmit={submitPayoutAddress}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Team Selection Dialog */}
      <Dialog open={teamSelectDialog.open} onOpenChange={(open) => setTeamSelectDialog({ open, event: teamSelectDialog.event })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>
              Select which team you want to create a prediction market for.
            </DialogDescription>
          </DialogHeader>
          {teamSelectDialog.event && (
            <div className="space-y-3">
              <Button
                className="w-full justify-start h-auto py-3"
                variant="outline"
                onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.team_a)}
                disabled={creating}
              >
                <div className="flex items-center gap-3">
                  {teamSelectDialog.event.team_a_image && (
                    <img src={teamSelectDialog.event.team_a_image} alt="" className="w-8 h-8 object-contain" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{teamSelectDialog.event.team_a}</div>
                    <div className="text-xs text-muted-foreground">Will {teamSelectDialog.event.team_a} win?</div>
                  </div>
                </div>
              </Button>
              <Button
                className="w-full justify-start h-auto py-3"
                variant="outline"
                onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.team_b)}
                disabled={creating}
              >
                <div className="flex items-center gap-3">
                  {teamSelectDialog.event.team_b_image && (
                    <img src={teamSelectDialog.event.team_b_image} alt="" className="w-8 h-8 object-contain" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{teamSelectDialog.event.team_b}</div>
                    <div className="text-xs text-muted-foreground">Will {teamSelectDialog.event.team_b} win?</div>
                  </div>
                </div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              {selectedMarket?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={betSide === 'yes' ? 'default' : 'outline'}
                className={betSide === 'yes' ? 'flex-1 bg-emerald-600' : 'flex-1'}
                onClick={() => setBetSide('yes')}
              >
                YES
              </Button>
              <Button
                variant={betSide === 'no' ? 'default' : 'outline'}
                className={betSide === 'no' ? 'flex-1 bg-red-600' : 'flex-1'}
                onClick={() => setBetSide('no')}
              >
                NO
              </Button>
            </div>
            
            <div>
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={betAmountUsd}
                onChange={(e) => setBetAmountUsd(e.target.value)}
                placeholder="Enter amount in USD"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum: $1</p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handlePlaceBet}
              disabled={placingBet || !betAmountUsd}
            >
              {placingBet ? 'Creating Bet...' : 'Place Bet'}
            </Button>
          </div>
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
    </div>
  );
}
