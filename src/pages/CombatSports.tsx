import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Swords, ChevronRight, HelpCircle, ArrowRight, RefreshCw, Clock, CheckCircle, XCircle, Trophy, TrendingUp, TrendingDown, Calendar, Users, Lock, Activity } from 'lucide-react';
import { useSportsEvents, type SportsEvent } from '@/hooks/useSportsEvents';
import { useSportsMatches, getSportLabel, type SportsMatch } from '@/hooks/useSportsCategories';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useTapologyFights, PROMOTION_COLORS, PROMOTION_LABELS, type TapologyFight } from '@/hooks/useTapologyFights';
import { api, type PredictionMarket } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { BetDepositModal } from '@/components/BetDepositModal';
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TrillerTVEmbed } from '@/components/TrillerTVEmbed';
import { BettingCountdown, isBettingOpen, isBettingClosingSoon } from '@/components/BettingCountdown';
import { extractSportInfo } from '@/lib/sportLabels';
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
  const { data: tapologyFights, isLoading: tapologyLoading } = useTapologyFights();
  
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
  
  // Tapology fight selection dialog
  const [tapologySelectDialog, setTapologySelectDialog] = useState<{ open: boolean; fight: TapologyFight | null }>({
    open: false,
    fight: null,
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
      // Filter for sports/manual markets that are combat-related
      const combatMarkets = apiMarkets.filter(m => {
        if (m.oracle_type !== 'sports' && m.oracle_type !== 'manual') return false;
        const desc = m.description?.toLowerCase() || '';
        const title = m.title?.toLowerCase() || '';
        const marketId = m.market_id?.toLowerCase() || '';
        const text = `${desc} ${title} ${marketId}`;
        return text.includes('ufc') || text.includes('boxing') || text.includes('mma') || 
               text.includes('bellator') || text.includes('pfl') || text.includes('rizin') ||
               text.includes('aca') || text.includes('one_');
      });

      const unblockedMarkets = combatMarkets.filter(m => !blockedIds.has(m.market_id));
      
      // Build a lookup from event_id to commence_timestamp for enriching markets
      const matchCommenceMap = new Map<string, number>();
      matches.forEach(m => {
        if (COMBAT_SPORTS.includes(m.sport)) {
          matchCommenceMap.set(m.event_id, Number(m.commence_timestamp));
        }
      });
      
      // Enrich markets with commence_time from matches if not present
      // Market IDs are formatted as: sports_{event_id}_{team_slug}
      const enrichedMarkets = unblockedMarkets.map(m => {
        if (m.commence_time || m.betting_closes_at) return m;
        
        // Extract event_id from market_id
        const parts = m.market_id.split('_');
        if (parts.length >= 2 && parts[0] === 'sports') {
          const eventId = parts[1];
          const commenceTime = matchCommenceMap.get(eventId);
          if (commenceTime) {
            return {
              ...m,
              commence_time: commenceTime,
              betting_closes_at: commenceTime,
            };
          }
        }
        return m;
      });
      
      setMarkets(enrichedMarkets);
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

  // Create Tapology market (manual oracle)
  const handleCreateTapologyMarket = async (fight: TapologyFight, fighter: string) => {
    setCreating(true);
    try {
      const promotion = fight.promotion.toLowerCase();
      const fighterSlug = fighter.toLowerCase().replace(/\s+/g, '_');
      const marketId = `${promotion}_${fight.bout_id}_${fighterSlug}`;
      
      // Parse the event date
      const eventDate = new Date(fight.event_date);
      const resolutionTimestamp = Math.floor(eventDate.getTime() / 1000) + (3 * 60 * 60); // 3 hours after event
      
      const promotionLabel = PROMOTION_LABELS[promotion]?.split(' ')[1] || promotion.toUpperCase();
      
      // Create market via API with manual oracle type
      await api.createMarket({
        market_id: marketId,
        title: `Will ${fighter} win?`,
        description: `${promotionLabel}: ${fight.fighter_a} @ ${fight.fighter_b} - ${fight.event_name}`,
        oracle_type: 'manual',
        oracle_asset: '',
        oracle_condition: '',
        oracle_value: 0,
        resolution_time: resolutionTimestamp,
      });
      
      setNewlyCreatedMarketId(marketId);
      await fetchMarkets();
      setActiveTab('markets');
      toast.success(`Market created for ${fighter}`);
      setTimeout(() => {
        marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setTimeout(() => setNewlyCreatedMarketId(null), 5000);
    } catch (error) {
      console.error('Error creating Tapology market:', error);
      toast.error('Failed to create market');
    } finally {
      setCreating(false);
      setTapologySelectDialog({ open: false, fight: null });
    }
  };

  // Check if Tapology fight already has markets
  const getTapologyMarketStatus = (fight: TapologyFight) => {
    const promotion = fight.promotion.toLowerCase();
    const fighterASlug = fight.fighter_a.toLowerCase().replace(/\s+/g, '_');
    const fighterBSlug = fight.fighter_b.toLowerCase().replace(/\s+/g, '_');
    const aExists = markets.some(m => m.market_id === `${promotion}_${fight.bout_id}_${fighterASlug}`);
    const bExists = markets.some(m => m.market_id === `${promotion}_${fight.bout_id}_${fighterBSlug}`);
    
    if (aExists && bExists) return 'both';
    if (aExists || bExists) return 'partial';
    return 'none';
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
    const validation = validateBetAmount(amountUsd);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (!payoutAddress || (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8'))) {
      toast.error('Please enter a valid Monero address');
      return;
    }
    if (payoutAddress.length < 95) {
      toast.error('Monero address is too short');
      return;
    }
    
    // Pre-flight check: Verify betting is still open before submitting
    if (!isBettingOpen(selectedMarket)) {
      toast.error('Betting has closed for this match', {
        description: 'The event has already started or betting window has ended.',
      });
      fetchMarkets(); // Refresh markets to update status
      setBetDialogOpen(false);
      return;
    }
    
    // Check if betting closes soon and warn user
    if (isBettingClosingSoon(selectedMarket, 5)) {
      toast.warning('⚠️ Betting closes soon!', {
        description: 'This market closes in less than 5 minutes. Your deposit may not confirm in time. Monero blocks take ~2 minutes on average.',
      });
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
      // Handle betting closed errors from backend
      if (message === 'BETTING_CLOSED' || 
          message.toLowerCase().includes('betting closed') || 
          message.toLowerCase().includes('betting has closed') ||
          message.toLowerCase().includes('already resolved')) {
        toast.error('Betting has closed for this match', {
          description: 'The event has already started. Refreshing markets...',
        });
        fetchMarkets(); // Refresh markets to update status
        setBetDialogOpen(false);
      } else {
        toast.error(message);
      }
    } finally {
      setPlacingBet(false);
    }
  };

  const now = Date.now() / 1000;
  
  // Live markets = betting closed but not yet resolved (match in progress)
  // Only show live markets that have actual bets (pool > 0)
  const liveMarkets = markets.filter(m => {
    const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
    return m.resolved === 0 && !isBettingOpen(m) && m.resolution_time > now && hasPool;
  });
  
  // Active markets = betting still open
  const activeMarkets = markets.filter(m => {
    if (m.resolved !== 0) return false;
    if (m.resolution_time <= now) return false;
    return isBettingOpen(m);
  });
  
  // Only show resolved markets that had betting activity
  const resolvedMarkets = markets.filter(m => {
    const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
    return m.resolved === 1 && hasPool;
  });

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
              <p className="text-muted-foreground mt-1">UFC • Boxing • RIZIN • ONE • PFL • ACA • Bellator</p>
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
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-5">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
              <TabsTrigger value="my-slips" asChild>
                <Link to="/my-slips">My Slips</Link>
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Matches */}
            <TabsContent value="upcoming" className="space-y-6">
              {/* MMA Section - UFC + Tapology promotions */}
              {(activeFilter === 'all' || activeFilter === 'mma') && (
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Swords className="w-5 h-5 text-red-500" />
                    MMA
                  </h2>
                  
                  {(matchesLoading || tapologyLoading) ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading MMA fights...</p>
                    </div>
                  ) : (() => {
                    // Combine UFC and Tapology fights into a unified list sorted by date
                    type UnifiedFight = {
                      type: 'ufc';
                      data: SportsMatch;
                      timestamp: number;
                    } | {
                      type: 'tapology';
                      data: TapologyFight;
                      timestamp: number;
                    };
                    
                    const now = Date.now();
                    
                    const ufcFights: UnifiedFight[] = matches
                      .filter(m => m.sport === 'ufc')
                      .map(m => ({
                        type: 'ufc' as const,
                        data: m,
                        timestamp: Number(m.commence_timestamp) * 1000,
                      }))
                      .filter(f => f.timestamp > now); // Filter out past events
                    
                    const tapFights: UnifiedFight[] = (tapologyFights || [])
                      .map(f => ({
                        type: 'tapology' as const,
                        data: f,
                        timestamp: new Date(f.event_date).getTime(),
                      }))
                      .filter(f => f.timestamp > now); // Filter out past events
                    
                    const allFights = [...ufcFights, ...tapFights].sort((a, b) => a.timestamp - b.timestamp);
                    
                    if (allFights.length === 0) {
                      return (
                        <Card className="bg-secondary/30">
                          <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No upcoming MMA fights found</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    return (
                      <div className="grid gap-3">
                        {allFights.map((fight) => {
                          if (fight.type === 'ufc') {
                            const match = fight.data;
                            const marketStatus = getMatchMarketStatus(match);
                            return (
                              <Card key={match.event_id} className="hover:border-red-500/50 transition-colors border-red-500/20">
                                <CardContent className="py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-red-600 text-xs">🥋 UFC</Badge>
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
                          } else {
                            const tapFight = fight.data;
                            const promo = tapFight.promotion.toLowerCase();
                            const colors = PROMOTION_COLORS[promo] || { bg: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-500' };
                            const label = PROMOTION_LABELS[promo] || promo.toUpperCase();
                            const marketStatus = getTapologyMarketStatus(tapFight);
                            
                            return (
                              <Card key={tapFight.bout_id} className={`hover:${colors.border}/50 transition-colors ${colors.border}/20`}>
                                <CardContent className="py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={`${colors.bg} text-xs`}>{label}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {tapFight.event_date}
                                        </span>
                                      </div>
                                      <div className="text-lg font-semibold">
                                        {tapFight.fighter_a} vs {tapFight.fighter_b}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">{tapFight.event_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {marketStatus === 'both' ? (
                                        <Badge className="bg-green-600">Markets Open</Badge>
                                      ) : marketStatus === 'partial' ? (
                                        <Badge className="bg-amber-600">Partial</Badge>
                                      ) : (
                                        <Button 
                                          size="sm" 
                                          className={`${colors.bg} hover:opacity-90`}
                                          onClick={() => setTapologySelectDialog({ open: true, fight: tapFight })}
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
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Boxing Section - Separate */}
              {(activeFilter === 'all' || activeFilter === 'boxing') && (
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <span className="text-2xl">🥊</span>
                    Boxing
                  </h2>
                  
                  {matchesLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading boxing fights...</p>
                    </div>
                  ) : (() => {
                    const now = Date.now();
                    const upcomingBoxing = matches
                      .filter(m => m.sport === 'boxing' && Number(m.commence_timestamp) * 1000 > now)
                      .sort((a, b) => Number(a.commence_timestamp) - Number(b.commence_timestamp));
                    
                    if (upcomingBoxing.length === 0) {
                      return (
                        <Card className="bg-secondary/30">
                          <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No upcoming boxing fights found</p>
                            <p className="text-sm text-muted-foreground mt-2">Check back later for new events</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    return (
                      <div className="grid gap-3">
                        {upcomingBoxing.map((match) => {
                          const marketStatus = getMatchMarketStatus(match);
                          return (
                            <Card key={match.event_id} className="hover:border-yellow-500/50 transition-colors border-yellow-500/20">
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-yellow-600 text-xs">🥊 Boxing</Badge>
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
                                        className="bg-yellow-600 hover:bg-yellow-700"
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
                    );
                  })()}
                </div>
              )}

            </TabsContent>

            {/* Markets Tab */}
            <TabsContent value="markets" ref={marketsRef} className="space-y-4">
              {/* Live Now Section */}
              {liveMarkets.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-red-500" />
                    Live Now ({liveMarkets.length})
                    <Badge className="bg-red-600 animate-pulse">LIVE</Badge>
                  </h2>
                  <div className="grid gap-4">
                    {liveMarkets.map((market) => {
                      const odds = getOdds(market);
                      return (
                        <Card key={market.market_id} className="border-red-500/50 bg-red-500/5">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-red-600"><Lock className="w-3 h-3 mr-1" /> Betting Closed</Badge>
                              <span className="text-xs text-muted-foreground">
                                Fight in progress
                              </span>
                            </div>
                            {/* Sport badge */}
                            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 w-fit mb-1">
                              {(() => {
                                const info = extractSportInfo(market.market_id);
                                return `${info.sportEmoji} ${info.leagueLabel || info.sportLabel}`;
                              })()}
                            </Badge>
                            <CardTitle className="text-lg">{market.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <div className="text-xl font-bold text-emerald-500">{odds.yes}%</div>
                                <div className="text-xs text-muted-foreground">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                              </div>
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="text-xl font-bold text-red-500">{odds.no}%</div>
                                <div className="text-xs text-muted-foreground">{market.no_pool_xmr.toFixed(4)} XMR</div>
                              </div>
                            </div>
                            <PoolTransparency marketId={market.market_id} className="mt-3" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

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
                            <BettingCountdown 
                              bettingClosesAt={market.betting_closes_at}
                              bettingOpen={market.betting_open}
                              resolutionTime={market.resolution_time}
                              commenceTime={market.commence_time}
                              variant="badge"
                            />
                          </div>
                          {/* Sport badge */}
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 w-fit mb-1">
                            {(() => {
                              const info = extractSportInfo(market.market_id);
                              return `${info.sportEmoji} ${info.leagueLabel || info.sportLabel}`;
                            })()}
                          </Badge>
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
                          <PoolTransparency marketId={market.market_id} className="mt-3" />
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
                        {/* Sport badge */}
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary/80 w-fit mb-1">
                          {(() => {
                            const info = extractSportInfo(market.market_id);
                            return `${info.sportEmoji} ${info.leagueLabel || info.sportLabel}`;
                          })()}
                        </Badge>
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
          <div className="mt-12">
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

      {/* Tapology Select Dialog */}
      <Dialog open={tapologySelectDialog.open} onOpenChange={(open) => setTapologySelectDialog({ open, fight: tapologySelectDialog.fight })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create {tapologySelectDialog.fight ? (PROMOTION_LABELS[tapologySelectDialog.fight.promotion.toLowerCase()]?.split(' ')[1] || tapologySelectDialog.fight.promotion.toUpperCase()) : ''} Market
            </DialogTitle>
            <DialogDescription>
              Select which fighter to create a market for (manual resolution)
            </DialogDescription>
          </DialogHeader>
          {tapologySelectDialog.fight && (
            <div className="grid gap-3">
              <Button 
                onClick={() => handleCreateTapologyMarket(tapologySelectDialog.fight!, tapologySelectDialog.fight!.fighter_a)}
                disabled={creating}
                className={`${PROMOTION_COLORS[tapologySelectDialog.fight.promotion.toLowerCase()]?.bg || 'bg-gray-600'} hover:opacity-90`}
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {tapologySelectDialog.fight.fighter_a} wins?
              </Button>
              <Button 
                onClick={() => handleCreateTapologyMarket(tapologySelectDialog.fight!, tapologySelectDialog.fight!.fighter_b)}
                disabled={creating}
                variant="outline"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {tapologySelectDialog.fight.fighter_b} wins?
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
              {/* Betting countdown */}
              <BettingCountdown 
                bettingClosesAt={selectedMarket.betting_closes_at}
                bettingOpen={selectedMarket.betting_open}
                resolutionTime={selectedMarket.resolution_time}
                commenceTime={selectedMarket.commence_time}
                variant="full"
                onBettingClosed={() => {
                  toast.error('Betting has closed for this market');
                  setBetDialogOpen(false);
                  fetchMarkets();
                }}
              />
              
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
                  min={BETTING_CONFIG.MINIMUM_BET_USD}
                  step="0.01"
                  className={betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? 'border-destructive' : ''}
                />
                {betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? (
                  <p className="text-xs text-destructive mt-1">{validateBetAmount(parseFloat(betAmountUsd)).error}</p>
                ) : betAmountUsd && xmrUsdRate > 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {(parseFloat(betAmountUsd) / xmrUsdRate).toFixed(6)} XMR
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Minimum: {formatMinimumBet()}</p>
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
                disabled={placingBet || !isBettingOpen(selectedMarket)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {placingBet ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {!isBettingOpen(selectedMarket) ? 'Betting Closed' : 'Place Bet'}
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
          marketTitle={selectedMarket?.title}
          bettingClosesAt={selectedMarket?.betting_closes_at || selectedMarket?.resolution_time}
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
