import { useState, useEffect, useMemo } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useCricketEvents, CRICKET_MATCH_TYPES, getSportLabel, getSportIcon, type CricketMatch } from '@/hooks/useCricketEvents';
import { api, type PredictionMarket } from '@/services/api';
import cricketBackground from '@/assets/cricket-background.jpg';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useSEO, useEventListSEO } from '@/hooks/useSEO';

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
import { BettingCountdown, isBettingOpen, isBettingClosingSoon } from '@/components/BettingCountdown';
import { ClosedMarketsSection } from '@/components/ClosedMarketsSection';
import { ResolvedMarketsSection } from '@/components/ResolvedMarketsSection';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Users, Trophy, Gamepad2, ArrowRight, HelpCircle, Info, Lock, Wallet, ChevronDown } from 'lucide-react';
import ExolixWidget from '@/components/ExolixWidget';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Radio } from 'lucide-react';

export default function CricketPredictions() {
  useSEO();
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { matches, liveMatches, upcomingMatches, loading: matchesLoading, fetchMatches, createCricketMarket } = useCricketEvents();
  const { xmrUsdRate } = useExchangeRate();
  const { isAdmin } = useIsAdmin();
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Event list SEO for structured data
  const eventListData = useMemo(() => {
    if (markets.length === 0) return null;
    return {
      events: markets.filter(m => !m.resolved).slice(0, 20).map(m => ({
        id: m.market_id,
        question: m.title || 'Cricket prediction market',
        description: m.description,
        resolutionDate: m.resolution_time ? new Date(m.resolution_time * 1000).toISOString() : undefined,
        status: m.resolved ? 'resolved' as const : 'open' as const,
        totalPool: m.yes_pool_xmr + m.no_pool_xmr,
        eventType: 'sports' as const,
      })),
      pageTitle: 'Cricket Predictions - 0xNull',
      pageDescription: 'Anonymous cricket betting with Monero. Predict IPL, international, and T20 match outcomes.',
      pageUrl: 'https://0xnull.io/cricket',
    };
  }, [markets]);
  useEventListSEO(eventListData);
  
  const [selectedMatchType, setSelectedMatchType] = useState<string>('all');
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; match: CricketMatch | null }>({
    open: false,
    match: null,
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
    fetchMatches();
    
    const interval = setInterval(() => {
      fetchMarkets();
      fetchMatches();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const fetchMarkets = async () => {
    setLoading(true);
    // Don't clear markets on refresh - keep showing previous data until new data loads
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      const { markets: apiMarkets } = await api.getPredictionMarkets(true);
      const cricketMarkets = apiMarkets.filter(m => m.oracle_type === 'cricket');

      // Filter out blocked markets
      const unblockedMarkets = cricketMarkets.filter(m => !blockedIds.has(m.market_id));

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
    const validation = validateBetAmount(amountUsd);
    if (!validation.valid) {
      toast.error(validation.error);
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
    
    // Check if betting closes soon and warn user
    if (isBettingClosingSoon(selectedMarket, 5)) {
      toast.warning('⚠️ Betting closes soon!', {
        description: 'This market closes in less than 5 minutes. Your deposit may not confirm in time. Monero blocks take ~2 minutes on average.',
      });
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
  
  const handleBetConfirmed = () => {
    fetchMarkets();
  };

  const handleCreateMarket = async (match: CricketMatch, team: string) => {
    setCreating(true);
    const success = await createCricketMarket(match, team);
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
      if (market.outcome?.toUpperCase() === 'YES') {
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

  const formatMatchTime = (commenceTime: string) => {
    const date = new Date(commenceTime);
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

  const getMatchMarketStatus = (match: CricketMatch) => {
    const teamASlug = match.team_a.toLowerCase().replace(/\s+/g, '_');
    const teamBSlug = match.team_b.toLowerCase().replace(/\s+/g, '_');
    const teamAExists = markets.some(m => m.market_id === `cricket_${match.event_id}_${teamASlug}`);
    const teamBExists = markets.some(m => m.market_id === `cricket_${match.event_id}_${teamBSlug}`);
    
    if (teamAExists && teamBExists) return 'both';
    if (teamAExists || teamBExists) return 'partial';
    return 'none';
  };

  const getSportColors = (sport: string) => {
    switch (sport) {
      case 'big_bash':
        return { border: 'border-orange-500/30', bg: 'from-orange-950/30', accent: 'text-orange-400', glow: 'hover:shadow-[0_0_15px_hsl(25_100%_50%/0.2)]' };
      case 't20':
        return { border: 'border-blue-500/30', bg: 'from-blue-950/30', accent: 'text-blue-400', glow: 'hover:shadow-[0_0_15px_hsl(210_100%_50%/0.2)]' };
      case 'test':
        return { border: 'border-red-500/30', bg: 'from-red-950/30', accent: 'text-red-400', glow: 'hover:shadow-[0_0_15px_hsl(0_100%_50%/0.2)]' };
      default:
        return { border: 'border-emerald-500/30', bg: 'from-emerald-950/30', accent: 'text-emerald-400', glow: 'hover:shadow-[0_0_15px_hsl(150_100%_50%/0.2)]' };
    }
  };

  const filteredMatches = selectedMatchType === 'all'
    ? matches 
    : matches.filter(m => m.sport === selectedMatchType);

  const activeMarkets = markets
    .filter(m => m.resolved === 0 && isBettingOpen(m))
    .sort((a, b) => {
      const poolA = a.yes_pool_xmr + a.no_pool_xmr;
      const poolB = b.yes_pool_xmr + b.no_pool_xmr;
      if (poolA > 0 && poolB === 0) return -1;
      if (poolB > 0 && poolA === 0) return 1;
      return poolB - poolA;
    });
  
  // Closed markets - not resolved but betting closed
  // Only show closed markets that have actual bets (pool > 0)
  const closedMarkets = markets
    .filter(m => {
      const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
      return m.resolved === 0 && !isBettingOpen(m) && hasPool;
    })
    .sort((a, b) => a.resolution_time - b.resolution_time);
    
  // Only show resolved markets that had betting activity
  const resolvedMarkets = markets
    .filter(m => {
      const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
      return m.resolved === 1 && hasPool;
    })
    .sort((a, b) => (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr));

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${cricketBackground})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/80 via-background/70 to-background/95" />
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">🏏</span>
                Cricket Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on Big Bash, T20 & Test matches with XMR</p>
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
                  <Trophy className="w-4 h-4 mr-2" />
                  Sports
                </Button>
              </Link>
              <Link to="/esports-predictions">
                <Button variant="outline" size="sm">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Esports
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
          <div className="mb-3 p-3 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-between">
            <p className="text-sm text-muted-foreground">New to parimutuel betting?</p>
            <Link to="/how-betting-works" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <HelpCircle className="w-4 h-4" /> Learn How It Works
            </Link>
          </div>

          {/* Exolix Swap Widget */}
          <Collapsible className="mb-6">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Swap to XMR instantly
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <ExolixWidget fromCoin="BTC" toCoin="XMR" />
            </CollapsibleContent>
          </Collapsible>

          {liveMatches.length > 0 && (
            <div className="mb-6">
              <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 via-background to-red-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                    Live Matches
                    <Badge className="bg-red-600 animate-pulse ml-2">{liveMatches.length} LIVE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map(match => {
                      const marketStatus = getMatchMarketStatus(match);
                      const colors = getSportColors(match.sport);
                      
                      return (
                        <div
                          key={match.event_id}
                          className={`p-4 rounded-lg border-2 ${colors.border} bg-gradient-to-br ${colors.bg} to-background relative overflow-hidden`}
                        >
                          {/* Animated live indicator */}
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                          
                          {/* Sport Type */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{getSportIcon(match.sport)}</span>
                            <Badge variant="outline" className={`text-xs ${colors.border}`}>
                              {getSportLabel(match.sport)}
                            </Badge>
                          </div>
                          
                          {/* Teams */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {match.team_a.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm truncate max-w-[80px]">{match.team_a}</span>
                            </div>
                            
                            <div className={`px-2 py-1 bg-background/50 rounded-lg border ${colors.border}`}>
                              <span className={`text-xs font-mono ${colors.accent}`}>VS</span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-medium text-sm truncate max-w-[80px]">{match.team_b}</span>
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {match.team_b.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Live</span>
                            {marketStatus !== 'both' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs border-red-500/50 hover:bg-red-500/20"
                                onClick={() => setTeamSelectDialog({ open: true, match })}
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
            <TabsList className="grid w-full max-w-xl grid-cols-5">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
              <TabsTrigger value="my-slips" asChild>
                <Link to="/my-slips">My Slips</Link>
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Matches
                </h2>
              </div>
              
              <Tabs value={selectedMatchType} onValueChange={(v) => {
                setSelectedMatchType(v);
                if (v === 'all') fetchMatches();
                else fetchMatches(v);
              }}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {CRICKET_MATCH_TYPES.map(type => (
                    <TabsTrigger key={type.key} value={type.key}>
                      {type.icon} {type.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {matchesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading matches...</div>
              ) : filteredMatches.filter(m => !m.match_ended).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No upcoming matches</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMatches.filter(m => !m.match_ended).map(match => {
                    const marketStatus = getMatchMarketStatus(match);
                    const colors = getSportColors(match.sport);
                    
                    return (
                      <Card key={match.event_id} className={`hover:border-primary/50 transition-colors ${colors.border}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getSportIcon(match.sport)}</span>
                              <Badge variant="outline" className="text-xs">
                                {getSportLabel(match.sport)}
                              </Badge>
                              {match.match_started && !match.match_ended && (
                                <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
                              )}
                            </div>
                            {marketStatus === 'both' && (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {match.team_a.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm truncate">{match.team_a}</span>
                            </div>
                            <span className="text-muted-foreground font-bold">VS</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-medium text-sm truncate">{match.team_b}</span>
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {match.team_b.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatMatchTime(match.commence_time)}
                            </span>
                            {marketStatus !== 'both' && !match.match_started && (
                              <Button
                                size="sm"
                                onClick={() => setTeamSelectDialog({ open: true, match })}
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
                    <span className="text-6xl mb-4 block">🏏</span>
                    <p className="text-muted-foreground mb-4">No active markets yet.</p>
                    <p className="text-sm text-muted-foreground">Go to Upcoming tab to create markets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeMarkets.map(market => {
                    const odds = getOdds(market);
                    const marketBets = getBetsForMarket(market.market_id);
                    
                    return (
                      <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{market.title}</CardTitle>
                            {getStatusBadge(market)}
                          </div>
                          <p className="text-xs text-muted-foreground">{market.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 mb-4">
                            <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                              <div className="text-2xl font-bold text-emerald-400">{odds.yes}%</div>
                              <div className="text-xs text-muted-foreground">YES</div>
                              <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                            <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                              <div className="text-2xl font-bold text-red-400">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">NO</div>
                              <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                          </div>
                          
                          {marketBets.length > 0 && (
                            <div className="mb-4 p-2 rounded bg-secondary/50 text-xs">
                              <p className="font-medium mb-1">Your bets:</p>
                              {marketBets.map(bet => (
                                <div key={bet.bet_id} className="flex justify-between">
                                  <span>{bet.side} - ${bet.amount_usd}</span>
                                  <Badge variant="outline" className="text-[10px]">{bet.status}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Pool Transparency */}
                          <PoolTransparency marketId={market.market_id} className="mb-3" />
                          
                          
                          {!market.resolved && market.resolution_time > Date.now() / 1000 && (
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  setSelectedMarket(market);
                                  setBetSide('yes');
                                  setBetDialogOpen(true);
                                }}
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
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
                                <TrendingDown className="w-4 h-4 mr-2" />
                                Bet NO
                              </Button>
                              <AddToSlipButton
                                marketId={market.market_id}
                                marketTitle={market.title}
                                yesPool={market.yes_pool_xmr || 0}
                                noPool={market.no_pool_xmr || 0}
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

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <ResolvedMarketsSection 
                markets={resolvedMarkets} 
                getBetsForMarket={getBetsForMarket} 
              />
              {resolvedMarkets.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No resolved markets yet.</p>
                  </CardContent>
                </Card>
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
          
          {/* Closed Markets Section */}
          <ClosedMarketsSection markets={closedMarkets} getBetsForMarket={getBetsForMarket} onMarketsUpdate={fetchMarkets} />
        </main>

        <Footer />
      </div>

      {/* Team Selection Dialog */}
      <Dialog open={teamSelectDialog.open} onOpenChange={(open) => setTeamSelectDialog({ open, match: teamSelectDialog.match })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>
              Choose which team to create a "Will they win?" market for
            </DialogDescription>
          </DialogHeader>
          
          {teamSelectDialog.match && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {teamSelectDialog.match.team_a} vs {teamSelectDialog.match.team_b}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  disabled={creating || markets.some(m => m.market_id === `cricket_${teamSelectDialog.match!.event_id}_${teamSelectDialog.match!.team_a.toLowerCase().replace(/\s+/g, '_')}`)}
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.team_a)}
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    {teamSelectDialog.match.team_a.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{teamSelectDialog.match.team_a}</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  disabled={creating || markets.some(m => m.market_id === `cricket_${teamSelectDialog.match!.event_id}_${teamSelectDialog.match!.team_b.toLowerCase().replace(/\s+/g, '_')}`)}
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.team_b)}
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    {teamSelectDialog.match.team_b.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{teamSelectDialog.match.team_b}</span>
                </Button>
              </div>
              
              {creating && (
                <p className="text-center text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 inline animate-spin mr-2" />
                  Creating market...
                </p>
              )}
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
            <div className="flex gap-4">
              <Button
                variant={betSide === 'yes' ? 'default' : 'outline'}
                className={`flex-1 ${betSide === 'yes' ? 'bg-emerald-600' : ''}`}
                onClick={() => setBetSide('yes')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                YES
              </Button>
              <Button
                variant={betSide === 'no' ? 'default' : 'outline'}
                className={`flex-1 ${betSide === 'no' ? 'bg-red-600' : ''}`}
                onClick={() => setBetSide('no')}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                NO
              </Button>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min={BETTING_CONFIG.MINIMUM_BET_USD}
                step="0.01"
                placeholder="Enter amount..."
                value={betAmountUsd}
                onChange={(e) => setBetAmountUsd(e.target.value)}
                className={betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? 'border-destructive' : ''}
              />
              {betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? (
                <p className="text-xs text-destructive mt-1">{validateBetAmount(parseFloat(betAmountUsd)).error}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Minimum: {formatMinimumBet()}</p>
              )}
            </div>

            <div>
              <Label htmlFor="payout">Payout Address (XMR)</Label>
              <Input
                id="payout"
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
                placeholder="4... or 8... (your Monero address)"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Where winnings or refunds will be sent
              </p>
            </div>

            {/* Refund info */}
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-200/80">
              <p><strong>Refund Policy:</strong> Full refund (no fees) if: unopposed market, no-result, abandoned, or cancelled match. 0.4% fee on winnings only.</p>
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

            <Button
              className="w-full"
              disabled={placingBet || !betAmountUsd || !payoutAddress}
              onClick={handlePlaceBet}
            >
              {placingBet ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Bet... ({elapsedSeconds}s)
                </>
              ) : (
                `Place $${betAmountUsd || '0'} on ${betSide.toUpperCase()}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <BetDepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        betData={currentBetData}
        onCheckStatus={checkBetStatus}
        onConfirmed={handleBetConfirmed}
        marketTitle={selectedMarket?.title}
        bettingClosesAt={selectedMarket?.betting_closes_at || selectedMarket?.resolution_time}
      />

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
        calculatePotentialPayout={betSlip.calculatePotentialPayout}
        calculateTotalPotentialPayout={betSlip.calculateTotalPotentialPayout}
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
        totalUsd={betSlip.totalUsd}
        isCheckingOut={betSlip.isCheckingOut}
        activeSlip={betSlip.activeSlip}
        onViewActiveSlip={() => setMultibetDepositOpen(true)}
        awaitingDepositCount={betSlip.savedSlips.filter(s => s.status === 'awaiting_deposit').length}
        onCheckResolvedMarkets={betSlip.checkAndRemoveResolvedMarkets}
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
