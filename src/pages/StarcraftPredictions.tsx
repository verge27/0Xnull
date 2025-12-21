import { useState, useEffect, useRef } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse, type BetStatusResponse } from '@/hooks/usePredictionBets';
import { api, type PredictionMarket } from '@/services/api';
import starcraftBackground from '@/assets/starcraft-background.jpg';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';

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
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TwitchStreamEmbed } from '@/components/TwitchStreamEmbed';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Users, Swords, ArrowRight, Trophy, Zap, HelpCircle, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const { isAdmin } = useIsAdmin();
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);

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
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newlyCreatedMarketId, setNewlyCreatedMarketId] = useState<string | null>(null);
  const marketsRef = useRef<HTMLDivElement>(null);
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: SC2Event | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);

  // Timer for bet creation progress
  useEffect(() => {
    if (!placingBet) {
      setElapsedSeconds(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [placingBet]);

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
    setLoading(true);
    setMarkets([]);
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      const { markets: apiMarkets } = await api.getPredictionMarkets();
      // Show ALL esports markets on all esports pages
      const starcraftMarkets = apiMarkets.filter(m => m.oracle_type === 'esports');

      // Filter out blocked markets
      const unblockedMarkets = starcraftMarkets.filter(m => !blockedIds.has(m.market_id));

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
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy?path=${encodeURIComponent('/api/esports/events?game=starcraft-2')}`,
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy?path=${encodeURIComponent('/api/esports/live?game=starcraft-2')}`,
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy?path=${encodeURIComponent('/api/esports/results?game=starcraft-2')}`,
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
    setElapsedSeconds(0);
    
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
      setElapsedSeconds(0);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy?path=${encodeURIComponent('/api/predictions/markets')}`,
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
      setNewlyCreatedMarketId(marketId);
      await fetchMarkets();
      // Switch to markets tab and scroll to it
      setActiveTab('markets');
      setTimeout(() => {
        marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setNewlyCreatedMarketId(null);
      }, 5000);
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

  const activeMarkets = markets
    .filter(m => m.resolved === 0)
    .sort((a, b) => {
      const poolA = a.yes_pool_xmr + a.no_pool_xmr;
      const poolB = b.yes_pool_xmr + b.no_pool_xmr;
      if (poolA > 0 && poolB === 0) return -1;
      if (poolB > 0 && poolA === 0) return 1;
      return poolB - poolA;
    });
  const resolvedMarkets = markets
    .filter(m => m.resolved === 1)
    .sort((a, b) => (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr));

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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            <TabsContent value="markets" className="space-y-4" ref={marketsRef}>
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
                      <Card 
                        key={market.market_id} 
                        className={`hover:border-primary/50 transition-all duration-300 cursor-pointer ${
                          newlyCreatedMarketId === market.market_id 
                            ? 'animate-pulse ring-2 ring-primary shadow-lg shadow-primary/20' 
                            : ''
                        }`}
                        onClick={() => { setSelectedMarket(market); setBetDialogOpen(true); }}
                      >
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
                              <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                            <div className="flex-1 p-2 rounded bg-red-950/30 border border-red-500/30 text-center">
                              <div className="text-lg font-bold text-red-400">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">NO</div>
                              <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                          </div>
                          
                          {/* Pool Transparency */}
                          <PoolTransparency marketId={market.market_id} className="mt-3" />
                          
                          {!market.resolved && market.resolution_time > Date.now() / 1000 && (
                            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                              <AddToSlipButton
                                marketId={market.market_id}
                                marketTitle={market.title}
                                onAdd={betSlip.addToBetSlip}
                                onOpenSlip={() => betSlip.setIsOpen(true)}
                              />
                            </div>
                          )}
                          
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

              <div className="space-y-2">
                <Label>Payout Address (XMR)</Label>
                <Input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="4... or 8... (your Monero address)"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Where winnings or refunds will be sent
                </p>
              </div>

              {/* Refund info */}
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-200/80">
                <p><strong>Refund Policy:</strong> If no opposing bets by market close, your full stake will be refunded (no fees). Winnings have a 0.4% fee on profits only.</p>
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
              
              {placingBet && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Creating bet wallet...</span>
                    <span>{elapsedSeconds}s / ~60s</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.min((elapsedSeconds / 60) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/70 text-center">
                    {elapsedSeconds < 10 
                      ? 'Initializing wallet...' 
                      : elapsedSeconds < 30 
                        ? 'Generating deposit address...'
                        : elapsedSeconds < 50
                          ? 'Almost there...'
                          : 'This is taking longer than usual...'}
                  </p>
                </div>
              )}

              <Button onClick={handlePlaceBet} disabled={placingBet || !betAmountUsd || !payoutAddress} className="w-full">
                {placingBet ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Bet... ({elapsedSeconds}s)
                  </span>
                ) : 'Place Bet'}
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

      {/* Multibet Slip */}
      <BetSlipPanel
        items={betSlip.items}
        isOpen={betSlip.isOpen}
        onOpenChange={betSlip.setIsOpen}
        onRemove={betSlip.removeFromBetSlip}
        onUpdateAmount={betSlip.updateAmount}
        onClear={betSlip.clearBetSlip}
        onCheckout={async (payoutAddress) => {
          const slip = await betSlip.checkout(payoutAddress);
          if (slip) {
            setMultibetDepositOpen(true);
          }
        }}
        totalUsd={betSlip.totalUsd}
        isCheckingOut={betSlip.isCheckingOut}
      />

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
    </div>
  );
}
