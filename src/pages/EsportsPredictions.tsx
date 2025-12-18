import { useState, useEffect } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import esportsBackground from '@/assets/esports-background.jpg';
import { useEsportsEvents, ESPORTS_GAMES, getGameLabel, getGameIcon, type EsportsEvent } from '@/hooks/useEsportsEvents';
import { api, type PredictionMarket } from '@/services/api';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';

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
import { PoolTransparency } from '@/components/PoolTransparency';
import { TwitchStreamEmbed } from '@/components/TwitchStreamEmbed';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Gamepad2, Calendar, Users, Swords, ArrowRight, HelpCircle, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Radio } from 'lucide-react';

export default function EsportsPredictions() {
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { events, liveEvents, loading: eventsLoading, fetchEvents, fetchLiveEvents, createEsportsMarket } = useEsportsEvents();
  const { xmrUsdRate } = useExchangeRate();
  const { isAdmin } = useIsAdmin();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
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
    setLoading(true);
    setMarkets([]);
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      const { markets: apiMarkets } = await api.getPredictionMarkets();
      const esportsMarkets = apiMarkets.filter(m => m.oracle_type === 'esports');

      // Filter out blocked markets
      const unblockedMarkets = esportsMarkets.filter(m => !blockedIds.has(m.market_id));

      const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
        new Promise<T>((resolve, reject) => {
          const id = setTimeout(() => reject(new Error('timeout')), ms);
          promise
            .then((v) => {
              clearTimeout(id);
              resolve(v);
            })
            .catch((e) => {
              clearTimeout(id);
              reject(e);
            });
        });

      const validatePools = async (marketsToValidate: PredictionMarket[]) => {
        const concurrency = 6;
        const valid: PredictionMarket[] = [];
        let i = 0;

        const workers = Array.from({ length: Math.min(concurrency, marketsToValidate.length) }, async () => {
          while (i < marketsToValidate.length) {
            const market = marketsToValidate[i++];
            try {
              const result = await withTimeout(api.checkPool(market.market_id), 4000);
              if (result?.exists) valid.push(market);
            } catch {
              // Invalid / missing pool -> exclude
            }
          }
        });

        await Promise.all(workers);
        return valid;
      };

      const validMarkets = await validatePools(unblockedMarkets);
      setMarkets(validMarkets);
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

    // Validate payout address
    if (!payoutAddress || (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8'))) {
      toast.error('Please enter a valid Monero address starting with 4 or 8');
      return;
    }
    if (payoutAddress.length < 95) {
      toast.error('Monero address is too short');
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
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return 'TBD';
    }
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC';
  };

  const getCountdown = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return null;
    }
    const now = Date.now();
    const eventTime = timestamp * 1000;
    const diff = eventTime - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `Starts in ${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`;
    }
    return `Starts in ${minutes}m`;
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

  const getGameColors = (game: string) => {
    switch (game) {
      case 'lol':
        return { border: 'border-yellow-500/30', bg: 'from-yellow-950/30', accent: 'text-yellow-400', glow: 'hover:shadow-[0_0_15px_hsl(45_100%_50%/0.2)]' };
      case 'csgo':
        return { border: 'border-orange-500/30', bg: 'from-orange-950/30', accent: 'text-orange-400', glow: 'hover:shadow-[0_0_15px_hsl(25_100%_50%/0.2)]' };
      case 'valorant':
        return { border: 'border-red-500/30', bg: 'from-red-950/30', accent: 'text-red-400', glow: 'hover:shadow-[0_0_15px_hsl(0_100%_50%/0.2)]' };
      case 'dota2':
        return { border: 'border-red-600/30', bg: 'from-red-900/30', accent: 'text-red-500', glow: 'hover:shadow-[0_0_15px_hsl(0_70%_45%/0.2)]' };
      case 'ow':
        return { border: 'border-orange-400/30', bg: 'from-orange-900/30', accent: 'text-orange-300', glow: 'hover:shadow-[0_0_15px_hsl(35_100%_60%/0.2)]' };
      case 'rl':
        return { border: 'border-blue-500/30', bg: 'from-blue-950/30', accent: 'text-blue-400', glow: 'hover:shadow-[0_0_15px_hsl(210_100%_50%/0.2)]' };
      case 'cod':
        return { border: 'border-green-500/30', bg: 'from-green-950/30', accent: 'text-green-400', glow: 'hover:shadow-[0_0_15px_hsl(120_100%_40%/0.2)]' };
      case 'r6siege':
        return { border: 'border-amber-500/30', bg: 'from-amber-950/30', accent: 'text-amber-400', glow: 'hover:shadow-[0_0_15px_hsl(40_100%_50%/0.2)]' };
      default:
        return { border: 'border-cyan-500/30', bg: 'from-cyan-950/30', accent: 'text-cyan-400', glow: 'hover:shadow-[0_0_15px_hsl(180_100%_50%/0.2)]' };
    }
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

          {/* Need XMR Banner */}
          <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Need XMR to place bets?</p>
            <Link to="/swaps" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Get XMR <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tor Banner */}
          <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Worried about your browsing being watched?</p>
            <Link to="/tor-guide" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Use Tor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* How Betting Works Banner */}
          <div className="mb-6 p-3 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-between">
            <p className="text-sm text-muted-foreground">New to parimutuel betting?</p>
            <Link to="/how-betting-works" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <HelpCircle className="w-4 h-4" /> Learn How It Works
            </Link>
          </div>

          {/* Twitch Stream - Full width at top */}
          <div className="mb-6">
            <div className="max-w-4xl mx-auto">
              <TwitchStreamEmbed selectedGame={selectedGame} />
            </div>
          </div>



          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            </TabsList>

            {/* Upcoming Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Matches
                </h2>
              </div>
              
              <Tabs value={selectedGame} onValueChange={(v) => {
                setSelectedGame(v);
                if (v === 'all') fetchEvents();
                else fetchEvents(v);
              }}>
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  {ESPORTS_GAMES.map(game => (
                    <TabsTrigger key={game.key} value={game.key} className="text-xs" title={game.name}>
                      {game.icon}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {eventsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading events...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No upcoming matches</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map(event => {
                    const marketStatus = getEventMarketStatus(event);
                    const isLive = event.status === 'live';
                    const colors = getGameColors(event.game);
                    
                    return (
                      <Card key={event.id} className={`hover:border-primary/50 transition-colors ${colors.border}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getGameIcon(event.game)}</span>
                              <Badge variant="outline" className="text-xs">
                                {getGameLabel(event.game)}
                              </Badge>
                              {isLive && (
                                <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
                              )}
                            </div>
                            {marketStatus === 'both' && (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              {event.team_a_image ? (
                                <img src={event.team_a_image} alt={event.team_a} className="w-8 h-8 object-contain" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                  {event.team_a.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm truncate">{event.team_a}</span>
                            </div>
                            <span className="text-muted-foreground font-bold">VS</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-medium text-sm truncate">{event.team_b}</span>
                              {event.team_b_image ? (
                                <img src={event.team_b_image} alt={event.team_b} className="w-8 h-8 object-contain" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                  {event.team_b.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 truncate">{event.tournament}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatGameTime(event.start_timestamp)}
                            </span>
                            {marketStatus !== 'both' && !isLive && (
                              <Button
                                size="sm"
                                onClick={() => setTeamSelectDialog({ open: true, event })}
                              >
                                Bet Now
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
                    <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No active markets yet.</p>
                    <p className="text-sm text-muted-foreground">Go to Upcoming tab to create markets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          
                          <div className="text-xs text-muted-foreground mb-4 text-center">
                            Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                          </div>
                          
                          {/* Pool Transparency */}
                          <PoolTransparency marketId={market.market_id} className="mb-3" />
                          
                          
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
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No resolved markets yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div>
              <Label>Payout Address (XMR)</Label>
              <Input
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
                placeholder="4... or 8... (your Monero address)"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Where winnings will be sent if you win
              </p>
            </div>
            
            {betAmountUsd && parseFloat(betAmountUsd) > 0 && selectedMarket && xmrUsdRate && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>≈ XMR Amount</span>
                  <span className="font-mono font-bold">
                    {(parseFloat(betAmountUsd) / xmrUsdRate).toFixed(6)} XMR
                  </span>
                </div>
                {(() => {
                  const betXmr = parseFloat(betAmountUsd) / xmrUsdRate;
                  const currentYesPool = selectedMarket.yes_pool_xmr;
                  const currentNoPool = selectedMarket.no_pool_xmr;
                  const yesPoolAfterBet = betSide === 'yes' ? currentYesPool + betXmr : currentYesPool;
                  const noPoolAfterBet = betSide === 'no' ? currentNoPool + betXmr : currentNoPool;
                  const totalPoolAfterBet = yesPoolAfterBet + noPoolAfterBet;
                  const yourPoolAfterBet = betSide === 'yes' ? yesPoolAfterBet : noPoolAfterBet;
                  const yourShare = betXmr / yourPoolAfterBet;
                  const potentialPayout = yourShare * totalPoolAfterBet;
                  const profit = potentialPayout - betXmr;
                  const multiplier = potentialPayout / betXmr;
                  const yesPercentAfterBet = totalPoolAfterBet > 0 ? (yesPoolAfterBet / totalPoolAfterBet) * 100 : 50;
                  
                  return (
                    <div className="pt-2 border-t border-primary/20 space-y-3">
                      {/* Dynamic Pool Ratio Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="text-emerald-500">YES {yesPercentAfterBet.toFixed(1)}%</span>
                          <span className="text-red-500">NO {(100 - yesPercentAfterBet).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                            style={{ width: `${yesPercentAfterBet}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground/70">
                          <span>{yesPoolAfterBet.toFixed(4)} XMR</span>
                          <span>{noPoolAfterBet.toFixed(4)} XMR</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className={betSide === 'yes' ? 'text-emerald-500' : 'text-red-500'}>
                          If {betSide.toUpperCase()} wins
                        </span>
                        <span className="font-mono font-bold text-emerald-500">
                          ~{potentialPayout.toFixed(4)} XMR
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Potential profit
                          <Popover>
                            <PopoverTrigger asChild>
                              <Info className="w-3 h-3 cursor-help" />
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs text-sm">
                              <p className="mb-2">Parimutuel betting pools all bets together. Winners split the total pool proportionally to their stake.</p>
                              <Link to="/how-betting-works" className="text-primary hover:underline text-xs">Learn more →</Link>
                            </PopoverContent>
                          </Popover>
                        </span>
                        <span className="text-emerald-500">+{profit.toFixed(4)} XMR ({multiplier.toFixed(2)}x)</span>
                      </div>
                      <p className="text-xs text-muted-foreground/70 italic">
                        Actual payout may vary as pool size changes before market resolution
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handlePlaceBet}
              disabled={placingBet || !betAmountUsd || !payoutAddress}
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
