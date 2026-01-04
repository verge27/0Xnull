import { useState, useEffect, useMemo } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';
import sportsBackground from '@/assets/sports-background.webp';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useSportsEvents, getSportLabel as getLegacySportLabel, getSportEmoji, type SportsEvent } from '@/hooks/useSportsEvents';
import { useSportsCategories, useSportsMatches, useSportsOdds, PRIORITY_SPORTS, SPORT_LABELS, getSportLabel, getCategoryLabel, prefetchAllSportsData, type SportsMatch } from '@/hooks/useSportsCategories';
import { prefetchEsportsData } from '@/hooks/useEsportsEvents';
import { api, type PredictionMarket, type PayoutEntry } from '@/services/api';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useVoucher, useVoucherFromUrl } from '@/hooks/useVoucher';
import { compareLeagues, getLeagueOrder, REGION_DISPLAY_NAMES, getRegionsFromSports, getSportDisplayRegion, type LeagueRegion } from '@/lib/leagueOrder';
import { useSEO, useEventListSEO } from '@/hooks/useSEO';

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
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TeamLogo } from '@/components/TeamLogo';
import { SportsCategoryPills } from '@/components/SportsCategoryPills';
import { SportsLeagueSelect } from '@/components/SportsLeagueSelect';
import { SportsMatchCard } from '@/components/SportsMatchCard';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { GameCommunityLinks } from '@/components/GameCommunityLinks';
import { BettingCountdown, isBettingOpen, isBettingClosingSoon } from '@/components/BettingCountdown';
import { ClosedMarketsSection } from '@/components/ClosedMarketsSection';
import { ResolvedMarketsSection } from '@/components/ResolvedMarketsSection';
import { RegionCollapsible, ExpandCollapseButtons } from '@/components/RegionCollapsible';
import { toast } from 'sonner';
import { TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Trophy, Calendar, ArrowRight, Filter, HelpCircle, Tv, ExternalLink, Info, ShoppingCart, Flame, Radio, Lock, Wallet, ChevronDown, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import ExolixWidget from '@/components/ExolixWidget';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SportsMarketCard } from '@/components/SportsMarketCard';
import { extractSportInfo } from '@/lib/sportLabels';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PendingDataIndicator } from '@/components/PendingDataIndicator';
import { BackoffBadge } from '@/components/BackoffBadge';
import { SportsMatchSkeleton, SportsRegionSkeleton } from '@/components/SportsMatchSkeleton';
import { useCollapsibleRegions } from '@/hooks/useCollapsibleRegions';

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
  useSEO();
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { createSportsMarket, liveScores, backoffStates, startLiveScorePolling, stopLiveScorePolling, pollingActive, lastUpdated } = useSportsEvents();
  const { categories, loading: categoriesLoading } = useSportsCategories();
  const { matches, loading: matchesLoading, fetchByCategory, fetchBySport, fetchAll } = useSportsMatches();
  const { odds, fetchOdds } = useSportsOdds();
  const { xmrUsdRate } = useExchangeRate();
  const { isAdmin } = useIsAdmin();
  const { voucher: savedVoucher } = useVoucher();
  const collapsibleRegions = useCollapsibleRegions();
  
  // Handle voucher from URL params
  useVoucherFromUrl();
  
  // Multibet slip
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  // Event list SEO for structured data
  const eventListData = useMemo(() => {
    if (markets.length === 0) return null;
    return {
      events: markets.filter(m => !m.resolved).slice(0, 20).map(m => ({
        id: m.market_id,
        question: m.title || 'Sports prediction market',
        description: m.description,
        resolutionDate: m.resolution_time ? new Date(m.resolution_time * 1000).toISOString() : undefined,
        status: m.resolved ? 'resolved' as const : 'open' as const,
        totalPool: m.yes_pool_xmr + m.no_pool_xmr,
        eventType: 'sports' as const,
      })),
      pageTitle: 'Sports Predictions - 0xNull',
      pageDescription: 'Anonymous sports betting with Monero. Predict outcomes for football, basketball, MMA, and more.',
      pageUrl: 'https://0xnull.io/sports-predictions',
    };
  }, [markets]);
  useEventListSEO(eventListData);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [betCreationStartTime, setBetCreationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Category/League filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  
  // Soccer league filter - null means "All Leagues"
  const [soccerLeagueFilter, setSoccerLeagueFilter] = useState<string | null>(null);
  
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; match: SportsMatch | null }>({
    open: false,
    match: null,
  });
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('markets');
  const [marketFilter, setMarketFilter] = useState<'all' | 'live' | 'closing'>('all');
  const [newlyCreatedMarketId, setNewlyCreatedMarketId] = useState<string | null>(null);
  
  // Video highlights
  const [highlights, setHighlights] = useState<VideoHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  
  // Leaderboard
  const [topPayouts, setTopPayouts] = useState<PayoutEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardSportFilter, setLeaderboardSportFilter] = useState<string | null>(null);

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

  // Timer for bet creation progress
  useEffect(() => {
    if (!placingBet) {
      setBetCreationStartTime(null);
      setElapsedSeconds(0);
      return;
    }
    
    setBetCreationStartTime(Date.now());
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [placingBet]);

  // Prefetch all sports and esports data on mount for instant tab switching
  useEffect(() => {
    prefetchAllSportsData();
    prefetchEsportsData();
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchAll();
    fetchHighlights();
    fetchLeaderboard();
    
    // Poll at 60 second intervals as recommended
    const interval = setInterval(() => {
      fetchMarkets();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      stopLiveScorePolling();
    };
  }, [fetchAll, stopLiveScorePolling]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { payouts } = await api.getPredictionPayouts();
      // Sort by payout amount descending
      const sortedPayouts = payouts
        .sort((a, b) => b.payout_xmr - a.payout_xmr)
        .slice(0, 20);
      setTopPayouts(sortedPayouts);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };


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
    setLoading(true);
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      // Fetch all markets including resolved ones
      const { markets: apiMarkets } = await api.getPredictionMarkets(true);
      const sportsMarkets = apiMarkets.filter(m => m.oracle_type === 'sports');

      // Show markets immediately; only filter out blocked ones.
      const unblockedMarkets = sportsMarkets.filter(m => !blockedIds.has(m.market_id));
      setMarkets(unblockedMarkets);
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
    setElapsedSeconds(0);
    
    try {
      const response = await api.placePredictionBet({
        market_id: selectedMarket.market_id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
        payout_address: payoutAddress,
        voucher_code: savedVoucher || undefined,
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
      setElapsedSeconds(0);
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
      // Generate the market ID that was created
      const teamSlug = team.toLowerCase().replace(/\s+/g, '_');
      const marketId = `sports_${match.event_id}_${teamSlug}`;
      setNewlyCreatedMarketId(marketId);
      
      // Switch to markets tab and scroll after data loads
      setActiveTab('markets');
      await fetchMarkets();
      
      // Scroll to the new market after a brief delay for DOM update
      setTimeout(() => {
        const element = document.querySelector(`[data-market-id="${marketId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight animation
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            setNewlyCreatedMarketId(null);
          }, 3000);
        }
      }, 300);
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

  // Extract event ID from market_id (format: sports_{event_id}_{team_slug})
  const getEventIdFromMarket = (marketId: string): string | null => {
    const match = marketId.match(/^sports_([^_]+(?:_[^_]+)*?)_[^_]+$/);
    if (match) return match[1];
    // Fallback: try to extract middle portion
    const parts = marketId.split('_');
    if (parts.length >= 3 && parts[0] === 'sports') {
      // Event ID is everything between 'sports_' and the last segment
      return parts.slice(1, -1).join('_');
    }
    return null;
  };

  // Check if a market has live score data (frontend workaround for betting_open API bug)
  const marketHasLiveScoreData = (marketId: string): boolean => {
    const eventId = getEventIdFromMarket(marketId);
    return eventId !== null && liveScores[eventId] !== undefined;
  };

  // Get odds for a match
  const getMatchOdds = (match: SportsMatch) => {
    return odds.find(o => o.event_id === match.event_id);
  };

  const now = Date.now() / 1000;

  // Sort matches - by date when viewing "All", by priority sports when filtered
  // Filter out matches that have already started (live) for the Upcoming tab
  const upcomingMatches = matches.filter(m => m.commence_timestamp > now);
  
  // Get unique leagues from soccer matches for the league dropdown - sorted by region/competition order
  const soccerLeagues = useMemo(() => {
    const leagues = upcomingMatches
      .filter(m => m.sport_key?.includes('soccer') || SPORT_LABELS[m.sport]?.toLowerCase().includes('league') || 
        ['premier_league', 'la_liga', 'bundesliga', 'serie_a', 'ligue_1', 'mls', 'champions_league', 
         'europa_league', 'efl_champ', 'fa_cup', 'eredivisie', 'liga_mx', 'brazil_serie_a'].includes(m.sport))
      .map(m => m.sport);
    // Sort by region and competition order instead of alphabetically
    return [...new Set(leagues)].sort(compareLeagues);
  }, [upcomingMatches]);
  
  const sortedMatches = useMemo(() => {
    // Filter by league if soccer and a specific league is selected (not 'all' or 'by_league')
    let filtered = upcomingMatches;
    if (selectedCategory === 'soccer' && soccerLeagueFilter && soccerLeagueFilter !== 'by_league') {
      filtered = upcomingMatches.filter(m => m.sport === soccerLeagueFilter);
    }
    
    // Always sort by region -> competition -> date for all sports
    const sorted = [...filtered].sort((a, b) => {
      const leagueCompare = compareLeagues(a.sport, b.sport);
      if (leagueCompare !== 0) return leagueCompare;
      return Number(a.commence_timestamp) - Number(b.commence_timestamp);
    });
    return sorted;
  }, [upcomingMatches, selectedCategory, soccerLeagueFilter]);
  
  // Separate live, closing soon, and regular markets
  // Live markets = betting closed but not yet resolved (match in progress)
  // Only show live markets that have actual bets (pool > 0)
  const liveMarkets = markets.filter(m => {
    const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
    return m.resolved === 0 && !isBettingOpen(m) && m.resolution_time > now && hasPool;
  });
  
  const closingSoonMarkets = markets.filter(m => {
    const hoursLeft = (m.resolution_time - now) / 3600;
    return m.resolved === 0 && m.resolution_time > now && isBettingOpen(m) && hoursLeft <= 2 && hoursLeft > 0;
  });
  
  const activeMarkets = markets
    .filter(m => m.resolved === 0 && m.resolution_time > now && isBettingOpen(m))
    .sort((a, b) => {
      const poolA = a.yes_pool_xmr + a.no_pool_xmr;
      const poolB = b.yes_pool_xmr + b.no_pool_xmr;
      // Markets with money first, then by largest pool
      if (poolA > 0 && poolB === 0) return -1;
      if (poolB > 0 && poolA === 0) return 1;
      return poolB - poolA;
    });
  
  // Closed markets - not resolved but betting closed (handled by ClosedMarketsSection)
  // Only show closed markets that have actual bets (pool > 0) - empty markets shouldn't clutter the view
  const closedMarkets = markets
    .filter(m => {
      const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
      return m.resolved === 0 && !isBettingOpen(m) && hasPool;
    })
    .sort((a, b) => a.resolution_time - b.resolution_time);
  
  // Filter markets based on selected filter
  const filteredActiveMarkets = marketFilter === 'all' 
    ? activeMarkets 
    : marketFilter === 'live' 
      ? liveMarkets 
      : closingSoonMarkets;
  
  // Only show in Results if market is resolved (resolved === 1) AND had betting activity (pool > 0)
  const resolvedMarkets = markets
    .filter(m => m.resolved === 1 && (m.yes_pool_xmr > 0 || m.no_pool_xmr > 0))
    .sort((a, b) => (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr));

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

            {/* Exolix Swap Widget */}
            <Collapsible>
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
          </div>

          {/* League Filter - Always visible */}
          <div className="mb-4">
            <SportsLeagueSelect
              leagues={['All Leagues', ...sortedLeagues]}
              selectedLeague={selectedLeague || 'All Leagues'}
              onSelect={(league) => setSelectedLeague(league === 'All Leagues' ? null : league)}
            />
          </div>

          {/* Main Tabs - Primary navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full max-w-3xl flex overflow-x-auto gap-1 mb-4 justify-start md:justify-center">
              <TabsTrigger value="markets" className="shrink-0">Markets</TabsTrigger>
              <TabsTrigger value="live" className="shrink-0 relative">
                Live Now
                {liveMarkets.length > 0 && (
                  <span className="ml-1.5 relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="shrink-0">Upcoming</TabsTrigger>
              <TabsTrigger value="highlights" className="shrink-0">Highlights</TabsTrigger>
              <TabsTrigger value="results" className="shrink-0">Results</TabsTrigger>
              <TabsTrigger value="leaderboard" className="shrink-0">Leaderboard</TabsTrigger>
              <TabsTrigger value="my-bets" className="shrink-0">My Bets</TabsTrigger>
              <TabsTrigger value="my-slips" className="shrink-0" asChild>
                <Link to="/my-slips">My Slips</Link>
              </TabsTrigger>
            </TabsList>

            {/* Markets Tab Content */}
            <TabsContent value="markets" className="space-y-4 mt-0">
              {/* Market Status Filters - Compact */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-2 min-w-max">
                  <Button
                    variant={marketFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMarketFilter('all')}
                    className="h-8 text-xs px-3"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    Open ({activeMarkets.length})
                  </Button>
                  <Button
                    variant={marketFilter === 'live' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMarketFilter('live')}
                    className={`h-8 text-xs px-3 ${liveMarkets.length > 0 ? 'border-red-500/50' : ''}`}
                  >
                    <Radio className={`w-3.5 h-3.5 mr-1 ${liveMarkets.length > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                    Live ({liveMarkets.length})
                  </Button>
                  <Button
                    variant={marketFilter === 'closing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMarketFilter('closing')}
                    className={`h-8 text-xs px-3 ${closingSoonMarkets.length > 0 ? 'border-amber-500/50' : ''}`}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Soon ({closingSoonMarkets.length})
                  </Button>
                </div>
              </div>

              {/* Video Highlights - Compact horizontal scroll */}
              {highlights.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      Latest Highlights
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setActiveTab('highlights')}>
                      View all
                    </Button>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-3 min-w-max">
                      {highlights.slice(0, 6).map((highlight, idx) => (
                        <div 
                          key={idx} 
                          className="group cursor-pointer w-40 shrink-0"
                          onClick={() => {
                            if (highlight.matchviewUrl) {
                              window.open(highlight.matchviewUrl, '_blank');
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
                              <ExternalLink className="w-5 h-5 text-white" />
                            </div>
                            <Badge className="absolute bottom-1 left-1 bg-black/70 text-[10px] py-0 h-4">
                              {highlight.competition.length > 15 ? highlight.competition.slice(0, 15) + '...' : highlight.competition}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs font-medium line-clamp-1">{highlight.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE MARKETS - Pinned at top */}
              {liveMarkets.length > 0 && marketFilter === 'all' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h2 className="text-lg font-semibold text-red-400">Live Now</h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMarkets.slice(0, 3).map((market) => (
                      <SportsMarketCard
                        key={market.market_id}
                        market={market}
                        isLive={true}
                        hasLiveScoreData={marketHasLiveScoreData(market.market_id)}
                        onBetClick={(m, side) => {
                          setSelectedMarket(m);
                          setBetSide(side);
                          setBetDialogOpen(true);
                        }}
                        onAddToSlip={betSlip.addToBetSlip}
                        onOpenSlip={() => betSlip.setIsOpen(true)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* OPEN MARKETS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    {marketFilter === 'all' ? 'Open Markets' : marketFilter === 'live' ? 'Live Markets' : 'Closing Soon'}
                    <Badge variant="secondary">{filteredActiveMarkets.length}</Badge>
                  </h2>
                </div>
                
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
                ) : filteredActiveMarkets.length === 0 ? (
                  <Card className="text-center py-12 bg-card/80">
                    <CardContent>
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">
                        {marketFilter === 'all' 
                          ? 'No open markets - check back soon!' 
                          : marketFilter === 'live' 
                            ? 'No live markets right now' 
                            : 'No markets closing soon'}
                      </p>
                      {marketFilter !== 'all' && (
                        <Button variant="ghost" size="sm" onClick={() => setMarketFilter('all')}>
                          View all markets
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredActiveMarkets.map((market) => {
                      const hoursLeft = (market.resolution_time - now) / 3600;
                      const isClosing = hoursLeft <= 2 && hoursLeft > 0;
                      const isLive = liveMarkets.some(m => m.market_id === market.market_id);
                      
                      return (
                        <SportsMarketCard
                          key={market.market_id}
                          market={market}
                          isLive={isLive}
                          isClosingSoon={isClosing && !isLive}
                          hasLiveScoreData={marketHasLiveScoreData(market.market_id)}
                          onBetClick={(m, side) => {
                            setSelectedMarket(m);
                            setBetSide(side);
                            setBetDialogOpen(true);
                          }}
                          onAddToSlip={betSlip.addToBetSlip}
                          onOpenSlip={() => betSlip.setIsOpen(true)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Live Now Tab */}
            <TabsContent value="live" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Live Now
                  <Badge variant="secondary">{liveMarkets.length}</Badge>
                </h2>
                {pollingActive && lastUpdated && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                    Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Matches currently in progress with live score updates. Betting is closed for these events.
              </p>

              {liveMarkets.length === 0 ? (
                <Card className="text-center py-12 bg-card/80">
                  <CardContent>
                    <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No live matches right now</p>
                    <p className="text-xs text-muted-foreground">Check back during game times to see live scores</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveMarkets.map((market) => {
                    const eventId = getEventIdFromMarket(market.market_id);
                    const score = eventId ? liveScores[eventId] : null;
                    const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                    const marketOdds = getOdds(market);
                    
                    // Extract scores from the scores array
                    const homeScore = score?.scores?.find(s => s.name === score.home_team)?.score ?? '—';
                    const awayScore = score?.scores?.find(s => s.name === score.away_team)?.score ?? '—';
                    const homeNum = parseInt(homeScore) || 0;
                    const awayNum = parseInt(awayScore) || 0;
                    
                    return (
                      <Card 
                        key={market.market_id} 
                        className="bg-card/80 backdrop-blur-sm border-red-500/30 overflow-hidden"
                        data-market-id={market.market_id}
                      >
                        <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" />
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {/* Sport badge */}
                              <Badge variant="secondary" className="text-xs mb-2">
                                {(() => {
                                  const info = extractSportInfo(market.market_id);
                                  return `${info.sportEmoji} ${info.leagueLabel || info.sportLabel}`;
                                })()}
                              </Badge>
                              <CardTitle className="text-lg leading-tight">{market.title}</CardTitle>
                            </div>
                            <Badge className="bg-red-600 text-white animate-pulse gap-1 shrink-0">
                              <Radio className="w-3 h-3" />
                              LIVE
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Live Score Display */}
                          {score && score.scores && score.scores.length >= 2 ? (
                            <div className="relative flex items-center justify-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="text-center">
                                <div className={`text-2xl font-bold font-mono ${homeNum > awayNum ? 'text-emerald-400' : 'text-foreground'}`}>
                                  {homeScore}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 max-w-20 truncate">{score.home_team}</div>
                              </div>
                              <div className="text-muted-foreground text-xl">-</div>
                              <div className="text-center">
                                <div className={`text-2xl font-bold font-mono ${awayNum > homeNum ? 'text-emerald-400' : 'text-foreground'}`}>
                                  {awayScore}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 max-w-20 truncate">{score.away_team}</div>
                              </div>
                              {score.statusDetail && (
                                <Badge variant="outline" className="absolute top-1 right-1 text-[10px]">
                                  {score.statusDetail}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Awaiting live score...</span>
                            </div>
                          )}
                          
                          {/* Pool Info */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-emerald-400">YES: {marketOdds.yes}%</span>
                              <span className="text-red-400">NO: {marketOdds.no}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" 
                                style={{ width: `${marketOdds.yes}%` }}
                              />
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                              Total Pool: {totalPool.toFixed(4)} XMR
                              {xmrUsdRate && (
                                <span className="ml-1">(${(totalPool * xmrUsdRate).toFixed(2)})</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Pool Transparency Button */}
                          <PoolTransparency marketId={market.market_id} />
                          
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                              <Lock className="w-3 h-3 mr-1" />
                              Betting Closed
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Events Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Matches
                  {matches.length > 0 && (
                    <Badge variant="secondary">{matches.length}</Badge>
                  )}
                </h2>
                
                {/* Soccer League Filter Dropdown */}
                {selectedCategory === 'soccer' && soccerLeagues.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">League:</span>
                    <SportsLeagueSelect
                      leagues={soccerLeagues}
                      selectedLeague={soccerLeagueFilter}
                      onSelect={(league) => setSoccerLeagueFilter(league)}
                    />
                  </div>
                )}
              </div>

              {/* Category Pills - exclude combat since it has its own page */}
              {!categoriesLoading && (
                <SportsCategoryPills
                  categories={Object.keys(categories).filter(c => c !== 'combat')}
                  selectedCategory={selectedCategory}
                  onSelect={handleCategoryChange}
                />
              )}

              {/* Expand/Collapse All Buttons */}
              {!matchesLoading && sortedMatches.length > 0 && (
                <div className="flex justify-end">
                  <ExpandCollapseButtons
                    regions={(() => {
                      // Get all current region keys
                      if (selectedCategory === 'soccer' && soccerLeagueFilter === 'by_league') {
                        const regionOrder: LeagueRegion[] = ['europe_top5', 'europe_other', 'uk_cups', 'europe_cups', 'americas', 'americas_cups', 'asia_oceania', 'africa', 'international', 'unknown'];
                        const grouped: Record<string, boolean> = {};
                        sortedMatches.forEach(match => {
                          const leagueInfo = getLeagueOrder(match.sport);
                          grouped[leagueInfo.region] = true;
                        });
                        return regionOrder.filter(r => grouped[r]);
                      } else if (selectedCategory === 'soccer') {
                        const regionOrder: LeagueRegion[] = ['europe_top5', 'europe_other', 'uk_cups', 'europe_cups', 'americas', 'americas_cups', 'asia_oceania', 'africa', 'international', 'unknown'];
                        const grouped: Record<string, boolean> = {};
                        sortedMatches.forEach(match => {
                          const leagueInfo = getLeagueOrder(match.sport);
                          grouped[leagueInfo.region] = true;
                        });
                        return regionOrder.filter(r => grouped[r]);
                      } else {
                        const grouped: Record<string, boolean> = {};
                        sortedMatches.forEach(match => {
                          const displayRegion = getSportDisplayRegion(match.sport);
                          grouped[displayRegion] = true;
                        });
                        return Object.keys(grouped);
                      }
                    })()}
                    onExpandAll={collapsibleRegions.expandAll}
                    onCollapseAll={collapsibleRegions.collapseAll}
                    expandedCount={collapsibleRegions.expandedRegions.size}
                  />
                </div>
              )}

              {matchesLoading ? (
                <SportsRegionSkeleton count={3} />
              ) : sortedMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedCategory || selectedLeague 
                    ? 'No upcoming events in this category' 
                    : 'No upcoming events'}
                </div>
              ) : selectedCategory === 'soccer' && soccerLeagueFilter === 'by_league' ? (
                // Grouped by region then league view for soccer with collapsible sections
                <div className="space-y-4">
                  {(() => {
                    // Group matches by region then by league
                    const groupedByRegion: Record<LeagueRegion, Record<string, typeof sortedMatches>> = {} as any;
                    
                    sortedMatches.forEach(match => {
                      const leagueInfo = getLeagueOrder(match.sport);
                      const region = leagueInfo.region;
                      const leagueLabel = SPORT_LABELS[match.sport] || match.sport;
                      
                      if (!groupedByRegion[region]) {
                        groupedByRegion[region] = {};
                      }
                      if (!groupedByRegion[region][leagueLabel]) {
                        groupedByRegion[region][leagueLabel] = [];
                      }
                      groupedByRegion[region][leagueLabel].push(match);
                    });
                    
                    // Sort regions by their order
                    const regionOrder: LeagueRegion[] = ['europe_top5', 'europe_other', 'uk_cups', 'europe_cups', 'americas', 'americas_cups', 'asia_oceania', 'africa', 'international', 'unknown'];
                    
                    const visibleRegions = regionOrder.filter(region => groupedByRegion[region] && Object.keys(groupedByRegion[region]).length > 0);
                    
                    // Initialize regions on first render
                    if (visibleRegions.length > 0 && collapsibleRegions.expandedRegions.size === 0) {
                      collapsibleRegions.setInitialRegions(visibleRegions, 3);
                    }
                    
                    return visibleRegions.map((region) => {
                        const regionLeagues = Object.entries(groupedByRegion[region]);
                        const totalMatches = regionLeagues.reduce((sum, [, matches]) => sum + matches.length, 0);
                        const isExpanded = collapsibleRegions.isRegionExpanded(region);
                        
                        return (
                          <RegionCollapsible
                            key={region}
                            region={region}
                            displayName={REGION_DISPLAY_NAMES[region]}
                            matchCount={totalMatches}
                            isExpanded={isExpanded}
                            onToggle={() => collapsibleRegions.toggleRegion(region)}
                          >
                            {/* Leagues within region */}
                            <div className="space-y-6">
                              {regionLeagues
                                .sort(([aKey], [bKey]) => {
                                  const aMatch = sortedMatches.find(m => (SPORT_LABELS[m.sport] || m.sport) === aKey);
                                  const bMatch = sortedMatches.find(m => (SPORT_LABELS[m.sport] || m.sport) === bKey);
                                  if (aMatch && bMatch) {
                                    return compareLeagues(aMatch.sport, bMatch.sport);
                                  }
                                  return aKey.localeCompare(bKey);
                                })
                                .map(([league, leagueMatches]) => (
                                  <Collapsible key={league} defaultOpen>
                                    <div className="rounded-lg border border-border/50 bg-muted/20">
                                      <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-sm px-3 py-1">
                                              ⚽ {league}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {leagueMatches.length} {leagueMatches.length === 1 ? 'match' : 'matches'}
                                            </span>
                                          </div>
                                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <div className="p-3 pt-0">
                                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {leagueMatches.map(match => {
                                              const marketStatus = getMatchMarketStatus(match);
                                              const matchOdds = getMatchOdds(match);
                                              const matchNow = Date.now() / 1000;
                                              const isLive = match.commence_timestamp <= matchNow && match.commence_timestamp > matchNow - 14400;
                                              
                                              return (
                                                <SportsMatchCard
                                                  key={match.event_id}
                                                  match={match}
                                                  odds={matchOdds}
                                                  onBetClick={(m) => setTeamSelectDialog({ open: true, match: m })}
                                                  isLive={isLive}
                                                  hasMarket={marketStatus !== 'none'}
                                                  backoffUntil={backoffStates?.[match.event_id]?.backoffUntil}
                                                />
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                ))}
                            </div>
                          </RegionCollapsible>
                        );
                      });
                  })()}
                </div>
              ) : selectedCategory === 'soccer' ? (
                // Soccer view grouped by region with collapsible sections, sorted chronologically within each region
                <div className="space-y-4">
                  {(() => {
                    // Group matches by region
                    const groupedByRegion: Record<LeagueRegion, typeof sortedMatches> = {} as any;
                    
                    sortedMatches.forEach(match => {
                      const leagueInfo = getLeagueOrder(match.sport);
                      const region = leagueInfo.region;
                      
                      if (!groupedByRegion[region]) {
                        groupedByRegion[region] = [];
                      }
                      groupedByRegion[region].push(match);
                    });
                    
                    // Sort regions by their order
                    const regionOrder: LeagueRegion[] = ['europe_top5', 'europe_other', 'uk_cups', 'europe_cups', 'americas', 'americas_cups', 'asia_oceania', 'africa', 'international', 'unknown'];
                    
                    const visibleRegions = regionOrder.filter(region => groupedByRegion[region] && groupedByRegion[region].length > 0);
                    
                    // Initialize regions on first render
                    if (visibleRegions.length > 0 && collapsibleRegions.expandedRegions.size === 0) {
                      collapsibleRegions.setInitialRegions(visibleRegions, 3);
                    }
                    
                    return visibleRegions.map((region) => {
                        // Sort matches within region chronologically
                        const regionMatches = groupedByRegion[region].sort((a, b) => 
                          Number(a.commence_timestamp) - Number(b.commence_timestamp)
                        );
                        const isExpanded = collapsibleRegions.isRegionExpanded(region);
                        
                        return (
                          <RegionCollapsible
                            key={region}
                            region={region}
                            displayName={REGION_DISPLAY_NAMES[region]}
                            matchCount={regionMatches.length}
                            isExpanded={isExpanded}
                            onToggle={() => collapsibleRegions.toggleRegion(region)}
                          >
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {regionMatches.map(match => {
                                const marketStatus = getMatchMarketStatus(match);
                                const matchOdds = getMatchOdds(match);
                                const matchNow = Date.now() / 1000;
                                const isLive = match.commence_timestamp <= matchNow && match.commence_timestamp > matchNow - 14400;
                                
                                return (
                                  <SportsMatchCard
                                    key={match.event_id}
                                    match={match}
                                    odds={matchOdds}
                                    onBetClick={(m) => setTeamSelectDialog({ open: true, match: m })}
                                    isLive={isLive}
                                    hasMarket={marketStatus !== 'none'}
                                    backoffUntil={backoffStates?.[match.event_id]?.backoffUntil}
                                  />
                                );
                              })}
                            </div>
                          </RegionCollapsible>
                        );
                      });
                  })()}
                </div>
              ) : (
                // All other sports - grouped by region with collapsible sections
                <div className="space-y-4">
                  {(() => {
                    // Group matches by region using display region (more specific)
                    const groupedByRegion: Record<string, typeof sortedMatches> = {};
                    
                    sortedMatches.forEach(match => {
                      const displayRegion = getSportDisplayRegion(match.sport);
                      
                      if (!groupedByRegion[displayRegion]) {
                        groupedByRegion[displayRegion] = [];
                      }
                      groupedByRegion[displayRegion].push(match);
                    });
                    
                    // Get sorted region keys based on first match in each group
                    const sortedRegionKeys = Object.keys(groupedByRegion).sort((a, b) => {
                      const aMatch = groupedByRegion[a][0];
                      const bMatch = groupedByRegion[b][0];
                      return compareLeagues(aMatch.sport, bMatch.sport);
                    });
                    
                    // Initialize regions on first render
                    if (sortedRegionKeys.length > 0 && collapsibleRegions.expandedRegions.size === 0) {
                      collapsibleRegions.setInitialRegions(sortedRegionKeys, 5);
                    }
                    
                    return sortedRegionKeys.map((regionDisplay) => {
                      // Sort matches within region chronologically
                      const regionMatches = groupedByRegion[regionDisplay].sort((a, b) => 
                        Number(a.commence_timestamp) - Number(b.commence_timestamp)
                      );
                      const isExpanded = collapsibleRegions.isRegionExpanded(regionDisplay);
                      
                      return (
                        <RegionCollapsible
                          key={regionDisplay}
                          region={regionDisplay}
                          displayName={regionDisplay}
                          matchCount={regionMatches.length}
                          isExpanded={isExpanded}
                          onToggle={() => collapsibleRegions.toggleRegion(regionDisplay)}
                        >
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {regionMatches.map(match => {
                              const marketStatus = getMatchMarketStatus(match);
                              const matchOdds = getMatchOdds(match);
                              const matchNow = Date.now() / 1000;
                              const isLive = match.commence_timestamp <= matchNow && match.commence_timestamp > matchNow - 14400;
                              
                              return (
                                <SportsMatchCard
                                  key={match.event_id}
                                  match={match}
                                  odds={matchOdds}
                                  onBetClick={(m) => setTeamSelectDialog({ open: true, match: m })}
                                  isLive={isLive}
                                  hasMarket={marketStatus !== 'none'}
                                  backoffUntil={backoffStates?.[match.event_id]?.backoffUntil}
                                />
                              );
                            })}
                          </div>
                        </RegionCollapsible>
                      );
                    });
                  })()}
                </div>
              )}
            </TabsContent>

            {/* Highlights Tab */}
            <TabsContent value="highlights" className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Tv className="w-5 h-5 text-primary" />
                Match Highlights & Replays
              </h2>
              
              {highlightsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading highlights...</div>
              ) : highlights.length === 0 ? (
                <Card className="text-center py-12 bg-card/80">
                  <CardContent>
                    <Tv className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No highlights available</p>
                  </CardContent>
                </Card>
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
                  {resolvedMarkets.map((market) => {
                    const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                    const winningPool = market.outcome?.toUpperCase() === 'YES' ? market.yes_pool_xmr : market.no_pool_xmr;
                    const isPaidOut = market.resolved === 1 && market.outcome;
                    
                    return (
                      <Card key={market.market_id} className="bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg">{market.title}</CardTitle>
                            <div className="flex flex-col gap-1 items-end shrink-0">
                              {getStatusBadge(market)}
                              {isPaidOut && (
                                <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Paid Out
                                </Badge>
                              )}
                            </div>
                          </div>
                          {market.description && (
                            <CardDescription className="text-sm">{market.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Resolved: {new Date(market.resolution_time * 1000).toLocaleDateString()}
                          </div>
                          
                          {totalPool > 0 && (
                            <div className="space-y-2">
                              <div className="flex gap-4 text-sm">
                                <span className={market.outcome?.toUpperCase() === 'YES' ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
                                  YES: {market.yes_pool_xmr.toFixed(4)} XMR
                                </span>
                                <span className={market.outcome?.toUpperCase() === 'NO' ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                                  NO: {market.no_pool_xmr.toFixed(4)} XMR
                                </span>
                              </div>
                              
                              {isPaidOut && winningPool > 0 && (
                                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                  <div className="font-medium text-foreground mb-1">Payout Summary</div>
                                  <div>Winners split: {totalPool.toFixed(4)} XMR</div>
                                  <div>Multiplier: {winningPool > 0 ? (totalPool / winningPool).toFixed(2) : '—'}x</div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {totalPool === 0 && (
                            <div className="text-xs text-muted-foreground">No bets placed</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              {(() => {
                const getSportFromMarketId = (marketId: string) => {
                  const market = markets.find(m => m.market_id === marketId);
                  return market?.oracle_asset || 'sports';
                };
                
                const uniqueSports = [...new Set(topPayouts.map(p => getSportFromMarketId(p.market_id)).filter(Boolean))];
                
                const filteredPayouts = leaderboardSportFilter 
                  ? topPayouts.filter(p => getSportFromMarketId(p.market_id) === leaderboardSportFilter)
                  : topPayouts;
                
                return (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top Winners
                      </h2>
                      
                      {uniqueSports.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <select
                            value={leaderboardSportFilter || ''}
                            onChange={(e) => setLeaderboardSportFilter(e.target.value || null)}
                            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">All Sports</option>
                            {uniqueSports.map(sport => (
                              <option key={sport} value={sport}>
                                {getSportLabel(sport || '')}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {leaderboardLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
                    ) : filteredPayouts.length === 0 ? (
                      <Card className="text-center py-12">
                        <CardContent>
                          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {leaderboardSportFilter ? 'No payouts in this sport yet.' : 'No payouts yet. Be the first winner!'}
                          </p>
                          {leaderboardSportFilter && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setLeaderboardSportFilter(null)}
                              className="mt-2"
                            >
                              Clear filter
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="bg-card/80 backdrop-blur-sm">
                            <CardContent className="pt-4 text-center">
                              <div className="text-2xl font-bold text-primary">
                                {filteredPayouts.reduce((sum, p) => sum + p.payout_xmr, 0).toFixed(4)}
                              </div>
                              <div className="text-xs text-muted-foreground">Total XMR Paid</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/80 backdrop-blur-sm">
                            <CardContent className="pt-4 text-center">
                              <div className="text-2xl font-bold text-emerald-500">
                                {filteredPayouts.length}
                              </div>
                              <div className="text-xs text-muted-foreground">Winning Bets</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/80 backdrop-blur-sm">
                            <CardContent className="pt-4 text-center">
                              <div className="text-2xl font-bold text-amber-500">
                                {filteredPayouts.length > 0 ? Math.max(...filteredPayouts.map(p => p.payout_xmr)).toFixed(4) : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground">Largest Win (XMR)</div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="bg-card/80 backdrop-blur-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border bg-muted/50">
                                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Rank</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Market</th>
                                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Payout</th>
                                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Tx</th>
                                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPayouts.map((payout, index) => (
                                  <tr key={payout.bet_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        {index === 0 && <span className="text-lg">🥇</span>}
                                        {index === 1 && <span className="text-lg">🥈</span>}
                                        {index === 2 && <span className="text-lg">🥉</span>}
                                        {index > 2 && <span className="text-muted-foreground font-mono">#{index + 1}</span>}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="max-w-[220px] truncate text-sm" title={payout.title}>
                                        {payout.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={payout.description}>
                                        {payout.description}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <span className="font-mono font-semibold text-emerald-500">
                                        {payout.payout_xmr.toFixed(4)} XMR
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <a 
                                        href={`https://xmrchain.net/tx/${payout.tx_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-xs font-mono flex items-center gap-1 justify-end"
                                      >
                                        {payout.tx_hash.slice(0, 8)}...
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                                      {new Date(payout.resolved_at * 1000).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      </div>
                    )}
                  </>
                );
              })()}
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
                  min={BETTING_CONFIG.MINIMUM_BET_USD}
                  step="0.01"
                  value={betAmountUsd}
                  onChange={(e) => setBetAmountUsd(e.target.value)}
                  placeholder="Enter amount in USD"
                  className={betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? 'border-destructive' : ''}
                />
                {betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? (
                  <p className="text-xs text-destructive">{validateBetAmount(parseFloat(betAmountUsd)).error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Minimum: {formatMinimumBet()}</p>
                )}
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
                <p><strong>Refund Policy:</strong> Full refund (no fees) if: unopposed market, no-contest, draw, or cancelled event. 0.4% fee on winnings only.</p>
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
                onClick={handlePlaceBet}
                disabled={placingBet || !betAmountUsd || !payoutAddress}
              >
                {placingBet ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Bet... ({elapsedSeconds}s)
                  </span>
                ) : 'Create Bet'}
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
          bettingClosesAt={selectedMarket?.betting_closes_at || selectedMarket?.resolution_time}
          marketTitle={selectedMarket?.title}
        />
      )}

      {/* Bet Slip Panel */}
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
        onCheckout={async (payoutAddress) => {
          // If there's already an active slip awaiting deposit, just reopen the modal
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
        isCheckingOut={betSlip.isCheckingOut}
        activeSlip={betSlip.activeSlip}
        onViewActiveSlip={() => setMultibetDepositOpen(true)}
        awaitingDepositCount={betSlip.savedSlips.filter(s => s.status === 'awaiting_deposit').length}
        onCheckResolvedMarkets={betSlip.checkAndRemoveResolvedMarkets}
      />

      {/* Multibet Deposit Modal */}
      <MultibetDepositModal
        open={multibetDepositOpen}
        onOpenChange={setMultibetDepositOpen}
        slip={betSlip.activeSlip}
        onCheckStatus={betSlip.checkSlipStatus}
        onUpdatePayoutAddress={betSlip.updatePayoutAddress}
        onConfirmed={() => {
          betSlip.clearBetSlip();
          toast.success('All bets confirmed!');
        }}
      />
    </div>
  );
}
