import { useState, useEffect } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse, type BetStatusResponse } from '@/hooks/usePredictionBets';
import { api, type PredictionMarket } from '@/services/api';
import starcraftBackground from '@/assets/starcraft-background.jpg';

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
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Users, Swords, ArrowRight, Trophy, Zap, HelpCircle } from 'lucide-react';
import { Radio } from 'lucide-react';


interface SC2Event {
  event_id: string;
  game: string;
  game_name: string;
  tournament: string;
  series?: string;
  team_a: string;
  team_b: string;
  team_a_image?: string;
  team_b_image?: string;
  scheduled_at?: number;
  status?: string;
}

interface SC2Result {
  event_id: string;
  team_a: string;
  team_b: string;
  winner: string;
  score?: string;
  tournament: string;
}

export default function StarcraftPredictions() {
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { xmrUsdRate } = useExchangeRate();

  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [events, setEvents] = useState<SC2Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<SC2Event[]>([]);
  const [results, setResults] = useState<SC2Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: SC2Event | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMarkets();
    fetchEvents();
    fetchLiveEvents();
    fetchResults();
    
    const interval = setInterval(() => {
      fetchMarkets();
      fetchLiveEvents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMarkets = async () => {
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'esports' && m.description?.toLowerCase().includes('starcraft')));
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/0xnull-proxy?path=${encodeURIComponent('/api/esports/events?game=starcraft-2')}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );
      const data = await response.json();
      if (data?.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching SC2 events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchLiveEvents = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/0xnull-proxy?path=${encodeURIComponent('/api/esports/live?game=starcraft-2')}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );
      const data = await response.json();
      if (data?.events) {
        setLiveEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching live SC2 events:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/0xnull-proxy?path=${encodeURIComponent('/api/esports/results?game=starcraft-2')}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );
      const data = await response.json();
      if (data?.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error fetching SC2 results:', error);
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

  const handleCreateMarket = async (event: SC2Event, player: string) => {
    setCreating(true);
    try {
      // Generate market_id from event_id and player name
      const playerSlug = player.toLowerCase().replace(/\s+/g, '_');
      const marketId = `esports_${event.event_id}_${playerSlug}`;
      
      // Convert scheduled_at to Unix timestamp if it's a string
      let resolutionTime: number;
      if (typeof event.scheduled_at === 'string') {
        resolutionTime = Math.floor(new Date(event.scheduled_at).getTime() / 1000);
      } else if (typeof event.scheduled_at === 'number') {
        resolutionTime = event.scheduled_at;
      } else {
        resolutionTime = Math.floor(Date.now() / 1000) + 86400; // Default: 24 hours from now
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/0xnull-proxy?path=${encodeURIComponent('/api/predictions/markets')}`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            market_id: marketId,
            title: `Will ${player} win?`,
            description: `StarCraft II: ${event.team_a} vs ${event.team_b} - ${event.tournament}`,
            oracle_type: 'esports',
            oracle_asset: event.event_id,
            oracle_condition: player,
            resolution_time: resolutionTime,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail?.[0]?.msg || 'Failed to create market');
      }
      
      toast.success(`Market created for ${player}!`);
      fetchMarkets();
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create market');
    } finally {
      setCreating(false);
      setTeamSelectDialog({ open: false, event: null });
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
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) return 'TBD';
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return 'TBD';
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

  const getEventMarketStatus = (event: SC2Event) => {
    const playerASlug = event.team_a.toLowerCase().replace(/\s+/g, '_');
    const playerBSlug = event.team_b.toLowerCase().replace(/\s+/g, '_');
    const playerAExists = markets.some(m => m.market_id?.includes(event.event_id) && m.market_id?.includes(playerASlug));
    const playerBExists = markets.some(m => m.market_id?.includes(event.event_id) && m.market_id?.includes(playerBSlug));
    
    if (playerAExists && playerBExists) return 'both';
    if (playerAExists || playerBExists) return 'partial';
    return 'none';
  };

  // SC2 Race colors - Terran (blue), Zerg (purple), Protoss (gold)
  const sc2Colors = {
    terran: { border: 'border-blue-500/30', bg: 'from-blue-950/30', accent: 'text-blue-400' },
    zerg: { border: 'border-purple-500/30', bg: 'from-purple-950/30', accent: 'text-purple-400' },
    protoss: { border: 'border-yellow-500/30', bg: 'from-yellow-950/30', accent: 'text-yellow-400' },
    default: { border: 'border-cyan-500/30', bg: 'from-cyan-950/30', accent: 'text-cyan-400' },
  };

  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${starcraftBackground})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/70 via-background/60 to-background/90" />
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-3xl">⚔️</span>
                StarCraft II Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on pro SC2 matches with Monero. No KYC. Instant payouts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/esports-predictions">
                <Button variant="outline" size="sm">
                  <Swords className="w-4 h-4 mr-2" />
                  All Esports
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

          {/* Twitch Stream - SC2 specific */}
          <div className="mb-6">
            <div className="max-w-4xl mx-auto">
              <TwitchStreamEmbed selectedGame="sc2" />
            </div>
          </div>



          {/* Live Matches */}
          {liveEvents.length > 0 && (
            <div className="mb-6">
              <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 via-background to-red-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                    Live Matches
                    <Badge className="bg-red-600 animate-pulse ml-2">{liveEvents.length} LIVE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveEvents.map(event => {
                      const marketStatus = getEventMarketStatus(event);
                      
                      return (
                        <div
                          key={event.event_id}
                          className={`p-4 rounded-lg border-2 ${sc2Colors.default.border} bg-gradient-to-br ${sc2Colors.default.bg} to-background relative overflow-hidden`}
                        >
                          {/* Live indicator */}
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                          
                          {/* Tournament */}
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <p className="text-xs text-muted-foreground truncate">{event.tournament}</p>
                          </div>
                          
                          {/* Players */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              {event.team_a_image ? (
                                <img src={event.team_a_image} alt={event.team_a} className="w-10 h-10 object-contain" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-bold">
                                  {event.team_a.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm">{event.team_a}</span>
                            </div>
                            
                            <span className="text-muted-foreground font-bold">VS</span>
                            
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-medium text-sm">{event.team_b}</span>
                              {event.team_b_image ? (
                                <img src={event.team_b_image} alt={event.team_b} className="w-10 h-10 object-contain" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-bold">
                                  {event.team_b.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Status & Bet Button */}
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="border-red-500/50 text-red-400">
                              <Zap className="w-3 h-3 mr-1" /> In Progress
                            </Badge>
                            {marketStatus !== 'both' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs border-red-500/50 hover:bg-red-500/20"
                                onClick={() => setTeamSelectDialog({ open: true, event })}
                              >
                                Bet Now
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            </TabsList>

            {/* Upcoming Matches */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Matches
                </h2>
              </div>
              
              {eventsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading matches...</div>
              ) : events.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No upcoming SC2 matches found</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map(event => {
                    const marketStatus = getEventMarketStatus(event);
                    
                    return (
                      <Card key={event.event_id} className={`${sc2Colors.default.border} bg-gradient-to-br ${sc2Colors.default.bg} to-background hover:shadow-[0_0_15px_hsl(180_100%_50%/0.2)] transition-shadow`}>
                        <CardContent className="p-4">
                          {/* Tournament */}
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-muted-foreground truncate">{event.tournament}</span>
                            {event.series && (
                              <Badge variant="outline" className="text-xs ml-auto">{event.series}</Badge>
                            )}
                          </div>
                          
                          {/* Players */}
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex flex-col items-center flex-1">
                              {event.team_a_image ? (
                                <img src={event.team_a_image} alt={event.team_a} className="w-12 h-12 object-contain mb-1" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold mb-1">
                                  {event.team_a.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm text-center">{event.team_a}</span>
                            </div>
                            
                            <span className="text-muted-foreground text-xl font-bold">VS</span>
                            
                            <div className="flex flex-col items-center flex-1">
                              {event.team_b_image ? (
                                <img src={event.team_b_image} alt={event.team_b} className="w-12 h-12 object-contain mb-1" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold mb-1">
                                  {event.team_b.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm text-center">{event.team_b}</span>
                            </div>
                          </div>
                          
                          {/* Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatGameTime(event.scheduled_at || 0)}
                            </div>
                            
                            {marketStatus === 'both' ? (
                              <Badge variant="secondary" className="text-xs">Markets Open</Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-primary hover:bg-primary/80"
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

            {/* Active Markets */}
            <TabsContent value="markets" className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Active Markets
              </h2>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading markets...</div>
              ) : activeMarkets.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No active SC2 markets. Create one from upcoming matches!</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMarkets.map(market => {
                    const odds = getOdds(market);
                    
                    return (
                      <Card key={market.market_id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setSelectedMarket(market); setBetDialogOpen(true); }}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            {getStatusBadge(market)}
                          </div>
                          <CardTitle className="text-lg mt-2">{market.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{market.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 mb-3">
                            <div className="flex-1 p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-center">
                              <div className="text-lg font-bold text-emerald-400">{odds.yes}%</div>
                              <div className="text-xs text-muted-foreground">YES</div>
                            </div>
                            <div className="flex-1 p-2 rounded bg-red-950/30 border border-red-500/30 text-center">
                              <div className="text-lg font-bold text-red-400">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">NO</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                          </div>
                          
                          {/* Pool Transparency */}
                          <PoolTransparency marketId={market.market_id} className="mt-3" />
                          
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Results */}
            <TabsContent value="results" className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Results
              </h2>
              
              {results.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No recent results available</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.slice(0, 9).map((result, i) => (
                    <Card key={i} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-2">{result.tournament}</div>
                        <div className="flex items-center justify-between">
                          <span className={result.winner === result.team_a ? 'font-bold text-emerald-400' : 'text-muted-foreground'}>
                            {result.team_a}
                          </span>
                          {result.score && (
                            <Badge variant="outline">{result.score}</Badge>
                          )}
                          <span className={result.winner === result.team_b ? 'font-bold text-emerald-400' : 'text-muted-foreground'}>
                            {result.team_b}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Winner: {result.winner}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Bets */}
            <TabsContent value="my-bets">
              <MyBets 
                bets={bets.filter(b => b.market_id?.includes('starcraft') || markets.some(m => m.market_id === b.market_id))}
                onStatusUpdate={checkBetStatus}
                onPayoutSubmit={submitPayoutAddress}
              />
            </TabsContent>
          </Tabs>
        </main>
        
        <Footer />
      </div>

      {/* Team Select Dialog */}
      <Dialog open={teamSelectDialog.open} onOpenChange={(open) => setTeamSelectDialog({ open, event: teamSelectDialog.event })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Player to Bet On</DialogTitle>
            <DialogDescription>
              Choose which player you want to create a market for
            </DialogDescription>
          </DialogHeader>
          {teamSelectDialog.event && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-primary"
                onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.team_a)}
                disabled={creating}
              >
                {teamSelectDialog.event.team_a_image && (
                  <img src={teamSelectDialog.event.team_a_image} alt="" className="w-10 h-10 object-contain" />
                )}
                <span className="font-medium">{teamSelectDialog.event.team_a}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-primary"
                onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.team_b)}
                disabled={creating}
              >
                {teamSelectDialog.event.team_b_image && (
                  <img src={teamSelectDialog.event.team_b_image} alt="" className="w-10 h-10 object-contain" />
                )}
                <span className="font-medium">{teamSelectDialog.event.team_b}</span>
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
            <DialogDescription>{selectedMarket?.title}</DialogDescription>
          </DialogHeader>
          
          {selectedMarket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={betSide === 'yes' ? 'default' : 'outline'}
                  className={betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  onClick={() => setBetSide('yes')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  YES ({getOdds(selectedMarket).yes}%)
                </Button>
                <Button
                  variant={betSide === 'no' ? 'default' : 'outline'}
                  className={betSide === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setBetSide('no')}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  NO ({getOdds(selectedMarket).no}%)
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Bet Amount (USD)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount in USD"
                  value={betAmountUsd}
                  onChange={(e) => setBetAmountUsd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Minimum bet: $1</p>
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
                    const totalPoolAfterBet = currentYesPool + currentNoPool + betXmr;
                    const yourPoolAfterBet = betSide === 'yes' 
                      ? currentYesPool + betXmr 
                      : currentNoPool + betXmr;
                    const yourShare = betXmr / yourPoolAfterBet;
                    const potentialPayout = yourShare * totalPoolAfterBet;
                    const profit = potentialPayout - betXmr;
                    const multiplier = potentialPayout / betXmr;
                    
                    return (
                      <div className="pt-2 border-t border-primary/20">
                        <div className="flex justify-between text-sm">
                          <span className={betSide === 'yes' ? 'text-emerald-500' : 'text-red-500'}>
                            If {betSide.toUpperCase()} wins
                          </span>
                          <span className="font-mono font-bold text-emerald-500">
                            ~{potentialPayout.toFixed(4)} XMR
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Potential profit</span>
                          <span className="text-emerald-500">+{profit.toFixed(4)} XMR ({multiplier.toFixed(2)}x)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <Button onClick={handlePlaceBet} disabled={placingBet} className="w-full">
                {placingBet ? 'Creating Bet...' : 'Place Bet'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <BetDepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        betData={currentBetData}
        onCheckStatus={checkBetStatus}
        onConfirmed={() => fetchMarkets()}
      />
    </div>
  );
}
