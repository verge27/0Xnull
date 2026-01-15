import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SEORichText } from '@/components/SEORichText';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';
import { Link, useSearchParams } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useVoucher, useVoucherFromUrl } from '@/hooks/useVoucher';
import { useSEO, useEventListSEO } from '@/hooks/useSEO';
const esportsBackground = '/images/backgrounds/esports-background.webp';
import { useEsportsEvents, ESPORTS_GAMES, ESPORTS_CATEGORIES, getGameLabel, getGameIcon, getCategoryLabel, getCategoryIcon, getGameDownloadUrl, type EsportsEvent } from '@/hooks/useEsportsEvents';
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
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { TwitchStreamEmbed, type StreamInfo } from '@/components/TwitchStreamEmbed';
import { ChatPanel } from '@/components/ChatPanel';
import { GameCommunityLinks, getDiscordCommunityForGame, getRedditCommunityForGame } from '@/components/GameCommunityLinks';
import { LiveOddsOverlay } from '@/components/LiveOddsOverlay';
import { RecentBetsTicker } from '@/components/RecentBetsTicker';
import { BetSlipFloatingButton } from '@/components/BetSlipFloatingButton';
import { BettingCountdown, isBettingOpen, isBettingClosingSoon } from '@/components/BettingCountdown';
import { ClosedMarketsSection } from '@/components/ClosedMarketsSection';
import { ResolvedMarketsSection } from '@/components/ResolvedMarketsSection';
import { LiveScoreBadge, InlineScore } from '@/components/LiveScoreBadge';
import { PendingDataIndicator } from '@/components/PendingDataIndicator';
import { BackoffBadge } from '@/components/BackoffBadge';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Gamepad2, Calendar, Users, Swords, ArrowRight, HelpCircle, Info, Radio, ExternalLink, Lock, Activity, Wallet, ChevronDown } from 'lucide-react';
import ExolixWidget from '@/components/ExolixWidget';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function EsportsPredictions() {
  useSEO({
    title: 'Anonymous Esports Prediction Markets | No-KYC Esports Predictions – 0xNull',
    description: 'Access anonymous esports prediction markets on 0xNull. Predict esports outcomes with no KYC, no accounts, and Monero payments on a privacy-first platform.',
  });
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { 
    events, 
    liveEvents, 
    liveScores,
    backoffStates,
    loading: eventsLoading, 
    fetchEvents, 
    fetchLiveEvents,
    startScoresPolling,
    stopScoresPolling,
    createEsportsMarket 
  } = useEsportsEvents();
  const { xmrUsdRate } = useExchangeRate();
  const { isAdmin } = useIsAdmin();
  
  // Voucher support
  const { voucher: savedVoucher } = useVoucher();
  useVoucherFromUrl();
  
  // Check for streamer-specific vouchers for welcome banners
  const isAWFViewer = savedVoucher?.toUpperCase() === 'AWF0XDOTA';
  
  // Multibet slip
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [fetchedResolvedMarkets, setFetchedResolvedMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Event list SEO for structured data
  const eventListData = useMemo(() => {
    if (markets.length === 0) return null;
    return {
      events: markets.filter(m => !m.resolved).slice(0, 20).map(m => ({
        id: m.market_id,
        question: m.title || 'Esports prediction market',
        description: m.description,
        resolutionDate: m.resolution_time ? new Date(m.resolution_time * 1000).toISOString() : undefined,
        status: m.resolved ? 'resolved' as const : 'open' as const,
        totalPool: m.yes_pool_xmr + m.no_pool_xmr,
        eventType: 'esports' as const,
      })),
      pageTitle: 'Esports Predictions - 0xNull',
      pageDescription: 'Anonymous esports betting. Predict outcomes for CS2, Dota 2, League of Legends, and more.',
      pageUrl: 'https://0xnull.io/esports-predictions',
    };
  }, [markets]);
  useEventListSEO(eventListData);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [betCreationStartTime, setBetCreationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newlyCreatedMarketId, setNewlyCreatedMarketId] = useState<string | null>(null);
  const [livestreamGame, setLivestreamGame] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<StreamInfo | null>(null);
  const marketsRef = useRef<HTMLDivElement>(null);
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: EsportsEvent | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);

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

  // Auto-select Dota 2 for AWF viewers
  useEffect(() => {
    if (isAWFViewer && selectedGame === 'all') {
      setSelectedGame('dota2');
      setSelectedCategory('moba');
    }
  }, [isAWFViewer, selectedGame]);

  useEffect(() => {
    fetchMarkets();
    fetchEvents();
    fetchLiveEvents();
    
    // Poll at 60 second intervals as recommended
    const interval = setInterval(() => {
      fetchMarkets();
      fetchLiveEvents();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      stopScoresPolling();
    };
  }, [fetchEvents, fetchLiveEvents, stopScoresPolling]);

  // Start polling for live scores when we have live events
  useEffect(() => {
    if (liveEvents.length > 0) {
      const eventIds = liveEvents.map(e => e.event_id || e.id || '').filter(Boolean);
      const games = liveEvents.map(e => e.game);
      if (eventIds.length > 0) {
        startScoresPolling(eventIds, games);
      }
    } else {
      stopScoresPolling();
    }
  }, [liveEvents, startScoresPolling, stopScoresPolling]);

  const fetchMarkets = async () => {
    setLoading(true);
    // Don't clear markets on refresh - keep showing previous data until new data loads
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      // Fetch all markets including resolved ones for the Results section
      const { markets: apiMarkets } = await api.getPredictionMarkets(true);
      const esportsMarkets = apiMarkets.filter(m => m.oracle_type === 'esports');

      // Filter out blocked markets
      const unblockedMarkets = esportsMarkets.filter(m => !blockedIds.has(m.market_id));
      
      // Build a lookup from event_id to start_time for enriching markets
      // Combine events and liveEvents for comprehensive coverage
      const eventStartMap = new Map<string, number>();
      [...events, ...liveEvents].forEach(e => {
        const eventId = e.event_id || e.id || '';
        const startTime = e.start_time ? Math.floor(new Date(e.start_time).getTime() / 1000) : 0;
        if (eventId && startTime) {
          eventStartMap.set(eventId, startTime);
        }
      });
      
      // Enrich markets with commence_time from events if not present
      // Market IDs are formatted as: esports_{event_id}_{team_slug}
      const enrichedMarkets = unblockedMarkets.map(m => {
        if (m.commence_time || m.betting_closes_at) return m;
        
        // Extract event_id from market_id
        const parts = m.market_id.split('_');
        if (parts.length >= 2 && parts[0] === 'esports') {
          const eventId = parts[1];
          const commenceTime = eventStartMap.get(eventId);
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

      // Separate resolved vs unresolved markets
      const resolved = enrichedMarkets.filter(m => m.resolved);
      const unresolved = enrichedMarkets.filter(m => !m.resolved);

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

      // Only validate unresolved markets (resolved markets already have final state)
      const validMarkets = await validatePools(unresolved);
      setMarkets(validMarkets);
      
      // Set resolved markets directly (they don't need pool validation)
      setFetchedResolvedMarkets(resolved);
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

  const handleCreateMarket = async (event: EsportsEvent, team: string) => {
    setCreating(true);
    // Generate the market ID the same way the hook does
    const teamSlug = team.toLowerCase().replace(/\s+/g, '_');
    const expectedMarketId = `esports_${event.event_id}_${teamSlug}`;
    
    const success = await createEsportsMarket(event, team);
    setCreating(false);
    setTeamSelectDialog({ open: false, event: null });
    if (success) {
      setNewlyCreatedMarketId(expectedMarketId);
      await fetchMarkets();
      // Switch to markets tab and scroll to the specific market card
      setActiveTab('markets');
      setTimeout(() => {
        const marketCard = document.getElementById(`market-card-${expectedMarketId}`);
        if (marketCard) {
          marketCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setNewlyCreatedMarketId(null);
      }, 5000);
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

  const formatGameTime = (timestamp?: number | string) => {
    // Handle ISO string (scheduled_at from API)
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
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
    }
    
    // Handle Unix timestamp (number)
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
      case 'starcraft-2':
      case 'starcraft-brood-war':
        return { border: 'border-purple-500/30', bg: 'from-purple-950/30', accent: 'text-purple-400', glow: 'hover:shadow-[0_0_15px_hsl(270_100%_50%/0.2)]' };
      case 'pubg':
        return { border: 'border-yellow-600/30', bg: 'from-yellow-900/30', accent: 'text-yellow-500', glow: 'hover:shadow-[0_0_15px_hsl(45_80%_45%/0.2)]' };
      case 'fifa':
        return { border: 'border-green-400/30', bg: 'from-green-900/30', accent: 'text-green-300', glow: 'hover:shadow-[0_0_15px_hsl(140_100%_45%/0.2)]' };
      case 'kog':
        return { border: 'border-pink-500/30', bg: 'from-pink-950/30', accent: 'text-pink-400', glow: 'hover:shadow-[0_0_15px_hsl(330_100%_50%/0.2)]' };
      case 'lol-wild-rift':
        return { border: 'border-teal-500/30', bg: 'from-teal-950/30', accent: 'text-teal-400', glow: 'hover:shadow-[0_0_15px_hsl(180_70%_45%/0.2)]' };
      case 'mlbb':
        return { border: 'border-indigo-500/30', bg: 'from-indigo-950/30', accent: 'text-indigo-400', glow: 'hover:shadow-[0_0_15px_hsl(240_100%_60%/0.2)]' };
      default:
        return { border: 'border-cyan-500/30', bg: 'from-cyan-950/30', accent: 'text-cyan-400', glow: 'hover:shadow-[0_0_15px_hsl(180_100%_50%/0.2)]' };
    }
  };
  // Helper to get event timestamp for sorting
  const getEventTimestamp = (event: EsportsEvent): number => {
    if (typeof event.start_timestamp === 'number' && event.start_timestamp > 0) return event.start_timestamp;
    if (typeof event.scheduled_at === 'number' && event.scheduled_at > 0) return event.scheduled_at;
    if (typeof event.scheduled_at === 'string') {
      const ts = new Date(event.scheduled_at).getTime() / 1000;
      if (!isNaN(ts) && ts > 0) return ts;
    }
    if (typeof event.start_time === 'string') {
      const ts = new Date(event.start_time).getTime() / 1000;
      if (!isNaN(ts) && ts > 0) return ts;
    }
    return 0; // TBD events get 0
  };

  // Sort: events with dates first (by time), then TBD events
  const sortEvents = (evts: EsportsEvent[]) => {
    return [...evts].sort((a, b) => {
      const tsA = getEventTimestamp(a);
      const tsB = getEventTimestamp(b);
      // Both have dates: sort by time
      if (tsA > 0 && tsB > 0) return tsA - tsB;
      // Only A has date: A comes first
      if (tsA > 0 && tsB === 0) return -1;
      // Only B has date: B comes first
      if (tsA === 0 && tsB > 0) return 1;
      // Both TBD: keep original order
      return 0;
    });
  };

  // Filter out events that have already started (start time in the past)
  const nowUnix = Date.now() / 1000;
  const upcomingEvents = events.filter(e => {
    const ts = getEventTimestamp(e);
    // Keep events with no timestamp (TBD) or future start time
    return ts === 0 || ts > nowUnix;
  });

  const filteredEvents = selectedGame === 'all' && selectedCategory === 'all'
    ? sortEvents(upcomingEvents) 
    : selectedGame !== 'all'
      ? sortEvents(upcomingEvents.filter(e => e.game === selectedGame))
      : sortEvents(upcomingEvents.filter(e => {
          const gameInfo = ESPORTS_GAMES.find(g => g.key === e.game);
          return gameInfo?.category === selectedCategory;
        }));

  const activeMarkets = markets
    .filter(m => m.resolved === 0 && isBettingOpen(m))
    .sort((a, b) => {
      const poolA = a.yes_pool_xmr + a.no_pool_xmr;
      const poolB = b.yes_pool_xmr + b.no_pool_xmr;
      if (poolA > 0 && poolB === 0) return -1;
      if (poolB > 0 && poolA === 0) return 1;
      return poolB - poolA;
    });
  
  // Closed markets - not resolved but betting closed (awaiting result)
  // Only show closed markets that have actual bets (pool > 0)
  const closedMarkets = markets
    .filter(m => {
      const hasPool = m.yes_pool_xmr + m.no_pool_xmr > 0;
      return m.resolved === 0 && !isBettingOpen(m) && hasPool;
    })
    .sort((a, b) => a.resolution_time - b.resolution_time);
    
  // Use fetched resolved markets from API (with include_resolved=true)
  // Only show resolved markets that had actual betting activity (pool > 0)
  const resolvedMarkets = fetchedResolvedMarkets
    .filter(m => m.yes_pool_xmr + m.no_pool_xmr > 0)
    .sort((a, b) => (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr));

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
            <div className="flex items-center gap-2 flex-wrap">
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
              <Link to="/starcraft">
                <Button variant="outline" size="sm">
                  🌌 StarCraft II
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={fetchMarkets} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* AWF Streamer Welcome Banner */}
          {isAWFViewer && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border border-purple-500/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎮</span>
                  <div>
                    <p className="font-bold text-lg text-purple-300">Добро пожаловать, зрители AWF!</p>
                    <p className="text-sm text-muted-foreground">
                      Bet on Dota 2 matches • No KYC • XMR payouts • 17% lower fees
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/swaps">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Wallet className="w-4 h-4 mr-2" />
                      Get XMR
                    </Button>
                  </Link>
                  <Link to="/how-betting-works">
                    <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      How It Works
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

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

          {/* Twitch Stream + Community Links */}
          <div className="mb-6">
            <div className="flex gap-4 max-w-6xl mx-auto">
              <div className="flex-1 max-w-4xl">
                <TwitchStreamEmbed 
                  selectedGame={selectedGame} 
                  onActiveGameChange={setLivestreamGame}
                  onStreamChange={setActiveStream}
                />
              </div>
              {/* Desktop sidebar with scroll */}
              <div className="hidden lg:block w-72 shrink-0">
                <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <ChatPanel 
                    streamInfo={activeStream}
                    discordCommunity={getDiscordCommunityForGame(livestreamGame || undefined, 'esports')}
                    redditCommunity={getRedditCommunityForGame(livestreamGame || undefined, 'esports')}
                  />
                  <RecentBetsTicker />
                  <GameCommunityLinks selectedGame={livestreamGame || undefined} category="esports" hideReddit defaultOpen={false} />
                </div>
              </div>
            </div>
            {/* Mobile community links */}
            <div className="lg:hidden mt-4 max-w-4xl mx-auto space-y-3">
              <ChatPanel 
                streamInfo={activeStream}
                discordCommunity={getDiscordCommunityForGame(livestreamGame || undefined, 'esports')}
                redditCommunity={getRedditCommunityForGame(livestreamGame || undefined, 'esports')}
              />
              <RecentBetsTicker />
              <GameCommunityLinks selectedGame={livestreamGame || undefined} category="esports" hideReddit defaultOpen={false} />
            </div>
          </div>



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

            {/* Upcoming Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Matches
                </h2>
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Category:</span>
                <div className="flex gap-1 flex-wrap">
                  <Button 
                    variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedGame('all');
                      fetchEvents();
                    }}
                  >
                    All
                  </Button>
                  {ESPORTS_CATEGORIES.map(cat => (
                    <Button 
                      key={cat.key}
                      variant={selectedCategory === cat.key ? 'default' : 'outline'} 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setSelectedGame('all');
                        fetchEvents(undefined, cat.key);
                      }}
                    >
                      {cat.icon} {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Game Filter */}
              <Tabs value={selectedGame} onValueChange={(v) => {
                setSelectedGame(v);
                setSelectedCategory('all');
                if (v === 'all') fetchEvents();
                else fetchEvents(v);
              }}>
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="all" className="text-xs">All Games</TabsTrigger>
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
                                <LiveScoreBadge
                                  eventId={event.event_id || event.id || ''}
                                  teamA={event.team_a}
                                  teamB={event.team_b}
                                  liveScores={liveScores}
                                  variant="compact"
                                  showNoDataHint
                                />
                              )}
                            </div>
                            {marketStatus === 'both' && (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </div>
                          
                          {/* Live score display for running matches */}
                          {isLive && liveScores[event.event_id || event.id || ''] && (
                            <div className="flex items-center justify-center gap-3 p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                {event.team_a_image ? (
                                  <img src={event.team_a_image} alt={event.team_a} className="w-6 h-6 object-contain" />
                                ) : null}
                                <span className={`font-medium text-sm ${liveScores[event.event_id || event.id || '']?.score_a > liveScores[event.event_id || event.id || '']?.score_b ? 'text-emerald-400' : ''}`}>
                                  {event.team_a}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-2xl font-bold font-mono ${liveScores[event.event_id || event.id || '']?.score_a > liveScores[event.event_id || event.id || '']?.score_b ? 'text-emerald-400' : 'text-foreground'}`}>
                                  {liveScores[event.event_id || event.id || '']?.score_a}
                                </span>
                                <span className="text-lg text-muted-foreground">:</span>
                                <span className={`text-2xl font-bold font-mono ${liveScores[event.event_id || event.id || '']?.score_b > liveScores[event.event_id || event.id || '']?.score_a ? 'text-emerald-400' : 'text-foreground'}`}>
                                  {liveScores[event.event_id || event.id || '']?.score_b}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`font-medium text-sm ${liveScores[event.event_id || event.id || '']?.score_b > liveScores[event.event_id || event.id || '']?.score_a ? 'text-emerald-400' : ''}`}>
                                  {event.team_b}
                                </span>
                                {event.team_b_image ? (
                                  <img src={event.team_b_image} alt={event.team_b} className="w-6 h-6 object-contain" />
                                ) : null}
                              </div>
                            </div>
                          )}

                          {/* "Awaiting data" placeholder for live matches without score yet */}
                          {isLive && !liveScores[event.event_id || event.id || ''] && (
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <PendingDataIndicator type="score" className="flex-1" />
                              {/* Show backoff badge if in backoff mode */}
                              {backoffStates[event.event_id || event.id || '']?.backoffUntil > Date.now() && (
                                <BackoffBadge 
                                  backoffUntil={backoffStates[event.event_id || event.id || ''].backoffUntil} 
                                />
                              )}
                            </div>
                          )}

                          {/* Standard team display (when not showing live score) */}
                          {(!isLive || !liveScores[event.event_id || event.id || '']) && (
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
                          )}
                          
                          <p className="text-xs text-muted-foreground mb-2 truncate">{event.tournament}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatGameTime(event.scheduled_at || event.start_timestamp)}
                              </span>
                              {getGameDownloadUrl(event.game) && (
                                <a
                                  href={getGameDownloadUrl(event.game)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Play
                                </a>
                              )}
                            </div>
                            
                            {/* Show bet buttons if market exists, otherwise show create market button */}
                            {marketStatus === 'both' ? (
                              <div className="flex flex-col gap-2">
                                {(() => {
                                  // Find the existing market for this event
                                  const eventMarket = markets.find(m => 
                                    m.title.includes(event.team_a) || m.title.includes(event.team_b)
                                  );
                                  if (!eventMarket) return null;
                                  
                                  const odds = getOdds(eventMarket);
                                  const bettingOpen = isBettingOpen(eventMarket);
                                  
                                  if (!bettingOpen) {
                                    return (
                                      <div className="flex items-center justify-center gap-2 p-2 rounded bg-zinc-800/50 border border-zinc-700">
                                        <Lock className="w-4 h-4 text-zinc-400" />
                                        <span className="text-sm text-zinc-400">Betting Closed</span>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <>
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm"
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                                          onClick={() => {
                                            setSelectedMarket(eventMarket);
                                            setBetSide('yes');
                                            setBetDialogOpen(true);
                                          }}
                                        >
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          YES {odds.yes}%
                                        </Button>
                                        <Button 
                                          size="sm"
                                          className="flex-1 bg-red-600 hover:bg-red-700 text-xs"
                                          onClick={() => {
                                            setSelectedMarket(eventMarket);
                                            setBetSide('no');
                                            setBetDialogOpen(true);
                                          }}
                                        >
                                          <TrendingDown className="w-3 h-3 mr-1" />
                                          NO {odds.no}%
                                        </Button>
                                        <AddToSlipButton
                                          marketId={eventMarket.market_id}
                                          marketTitle={eventMarket.title}
                                          yesPool={eventMarket.yes_pool_xmr || 0}
                                          noPool={eventMarket.no_pool_xmr || 0}
                                          onAdd={betSlip.addToBetSlip}
                                          onOpenSlip={() => betSlip.setIsOpen(true)}
                                          variant="icon"
                                        />
                                      </div>
                                      <BettingCountdown 
                                        bettingClosesAt={eventMarket.betting_closes_at}
                                        bettingOpen={eventMarket.betting_open}
                                        resolutionTime={eventMarket.resolution_time}
                                        commenceTime={eventMarket.commence_time}
                                        variant="inline"
                                      />
                                    </>
                                  );
                                })()}
                              </div>
                            ) : !isLive && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => setTeamSelectDialog({ open: true, event })}
                              >
                                Create Market & Bet
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
            <TabsContent value="markets" className="space-y-4" ref={marketsRef}>
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
                      <Card 
                        key={market.market_id}
                        id={`market-card-${market.market_id}`}
                        className={`hover:border-primary/50 transition-all duration-300 ${
                          newlyCreatedMarketId === market.market_id 
                            ? 'animate-pulse ring-2 ring-primary shadow-lg shadow-primary/20' 
                            : ''
                        }`}
                      >
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
                              <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                            <div className="flex-1 p-2 rounded bg-red-600/20 border border-red-600/30 text-center">
                              <div className="text-lg font-bold text-red-500">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">NO</div>
                              <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2 text-center">
                            Pool: {(market.yes_pool_xmr + market.no_pool_xmr).toFixed(4)} XMR
                          </div>
                          
                          {/* Betting countdown */}
                          <div className="mb-3 text-center">
                            <BettingCountdown 
                              bettingClosesAt={market.betting_closes_at}
                              bettingOpen={market.betting_open}
                              resolutionTime={market.resolution_time}
                              commenceTime={market.commence_time}
                              variant="inline"
                            />
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
                              YES
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
                              NO
                            </Button>
                            <AddToSlipButton
                              marketId={market.market_id}
                              marketTitle={market.title}
                              yesPool={market.yes_pool_xmr || 0}
                              noPool={market.no_pool_xmr || 0}
                              onAdd={betSlip.addToBetSlip}
                              onOpenSlip={() => betSlip.setIsOpen(true)}
                              variant="icon"
                            />
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

            {/* Closed Markets Section */}
            <ClosedMarketsSection markets={closedMarkets} getBetsForMarket={getBetsForMarket} onMarketsUpdate={fetchMarkets} />

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
        </main>
        
        {/* SEO Rich Text Section */}
        <SEORichText 
          title="Anonymous Esports Prediction Markets on 0xNull"
          content="<p>0xNull provides anonymous esports prediction markets with no KYC, no accounts, and no identity verification. Users can predict outcomes across major esports titles while maintaining full privacy and financial sovereignty.</p><p>Unlike traditional esports betting or prediction platforms, 0xNull esports prediction markets are built for anonymity. There is no user registration, no personal data collection, and no tracking. All predictions are placed using cryptocurrencies, including Monero, ensuring confidential and censorship-resistant participation.</p><p>These no-KYC esports prediction markets cover popular competitive games and tournaments, allowing users to predict match outcomes, series results, and major event conclusions without relying on centralized operators. By removing identity requirements, 0xNull enables global access to esports markets regardless of location or restrictions.</p><p>With a privacy-first architecture and crypto-native settlement, 0xNull creates a secure environment for anonymous esports predictions. The platform is designed for users who want to engage with competitive gaming markets without surveillance, accounts, or third-party oversight.</p><p>Explore anonymous esports prediction markets on 0xNull and participate freely—no KYC, no accounts, just privacy.</p>"
        />

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
            {/* Betting countdown */}
            {selectedMarket && (
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
            )}
            
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
                min={BETTING_CONFIG.MINIMUM_BET_USD}
                step="0.01"
                value={betAmountUsd}
                onChange={(e) => setBetAmountUsd(e.target.value)}
                placeholder="Enter amount in USD"
                className={betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? 'border-destructive' : ''}
              />
              {betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? (
                <p className="text-xs text-destructive mt-1">{validateBetAmount(parseFloat(betAmountUsd)).error}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Minimum: {formatMinimumBet()}</p>
              )}
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
              disabled={placingBet || !betAmountUsd || !payoutAddress || (selectedMarket && !isBettingOpen(selectedMarket))}
            >
              {placingBet ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Bet... ({elapsedSeconds}s)
                </span>
              ) : (selectedMarket && !isBettingOpen(selectedMarket)) ? 'Betting Closed' : 'Place Bet'}
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
          marketTitle={selectedMarket?.title}
          bettingClosesAt={selectedMarket?.betting_closes_at || selectedMarket?.resolution_time}
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
