import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { api } from '@/services/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, MessageSquarePlus, Wallet } from 'lucide-react';

// Crypto logo imports
import btcLogo from '@/assets/crypto/btc.png';
import ethLogo from '@/assets/crypto/eth.png';
import solLogo from '@/assets/crypto/sol.png';
import ltcLogo from '@/assets/crypto/ltc.png';
import xmrLogo from '@/assets/crypto/xmr.png';
import dashLogo from '@/assets/crypto/dash.png';
import zecLogo from '@/assets/crypto/zec.png';
import arrrLogo from '@/assets/crypto/arrr.png';
import adaLogo from '@/assets/crypto/ada.png';
import avaxLogo from '@/assets/crypto/avax.png';
import dotLogo from '@/assets/crypto/dot.png';
import atomLogo from '@/assets/crypto/atom.png';
import nearLogo from '@/assets/crypto/near.png';
import dogeLogo from '@/assets/crypto/doge.png';
import shibLogo from '@/assets/crypto/shib.png';
import pepeLogo from '@/assets/crypto/pepe.png';
import bonkLogo from '@/assets/crypto/bonk.png';
import linkLogo from '@/assets/crypto/link.png';
import uniLogo from '@/assets/crypto/uni.png';
import aaveLogo from '@/assets/crypto/aave.png';
import fartcoinLogo from '@/assets/crypto/fartcoin.png';

interface Market {
  id: string;
  question: string;
  description: string | null;
  resolution_date: string | null;
  resolution_criteria: string | null;
  status: string;
  total_yes_pool: number;
  total_no_pool: number;
  created_at: string;
  creator_id: string | null;
  creator_pk_id: string | null;
}

interface Position {
  id: string;
  market_id: string;
  side: string;
  amount: number;
  payout_address: string;
  created_at: string;
}

interface OracleAsset {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  category: 'major' | 'privacy' | 'l1' | 'meme' | 'defi';
  price?: number;
  change24h?: number;
  loading?: boolean;
}

// Platform fees
const PLATFORM_FEE = 0.02; // 2% platform fee
const ORACLE_FEE = 0.004; // 0.4% oracle feed fee
const ORACLE_FEE_WALLET = '42wxZ5mEQniV4RVo4JvgJjM3xcqtKTgqSYWFftE14ad8Yp4eVHVLmp5AXdBLG965NsgsfM4tBP8AaS8ejFbPfZjANsbFEud';

const CryptoIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-5 h-5 rounded-full" />
);

const ORACLE_ASSETS: OracleAsset[] = [
  // Major
  { symbol: 'BTC', name: 'Bitcoin', category: 'major', icon: <CryptoIcon src={btcLogo} alt="BTC" /> },
  { symbol: 'ETH', name: 'Ethereum', category: 'major', icon: <CryptoIcon src={ethLogo} alt="ETH" /> },
  { symbol: 'SOL', name: 'Solana', category: 'major', icon: <CryptoIcon src={solLogo} alt="SOL" /> },
  { symbol: 'LTC', name: 'Litecoin', category: 'major', icon: <CryptoIcon src={ltcLogo} alt="LTC" /> },
  // Privacy
  { symbol: 'XMR', name: 'Monero', category: 'privacy', icon: <CryptoIcon src={xmrLogo} alt="XMR" /> },
  { symbol: 'DASH', name: 'Dash', category: 'privacy', icon: <CryptoIcon src={dashLogo} alt="DASH" /> },
  { symbol: 'ZEC', name: 'Zcash', category: 'privacy', icon: <CryptoIcon src={zecLogo} alt="ZEC" /> },
  { symbol: 'ARRR', name: 'Pirate Chain', category: 'privacy', icon: <CryptoIcon src={arrrLogo} alt="ARRR" /> },
  // Memes
  { symbol: 'DOGE', name: 'Dogecoin', category: 'meme', icon: <CryptoIcon src={dogeLogo} alt="DOGE" /> },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme', icon: <CryptoIcon src={shibLogo} alt="SHIB" /> },
  { symbol: 'PEPE', name: 'Pepe', category: 'meme', icon: <CryptoIcon src={pepeLogo} alt="PEPE" /> },
  { symbol: 'BONK', name: 'Bonk', category: 'meme', icon: <CryptoIcon src={bonkLogo} alt="BONK" /> },
  { symbol: 'FARTCOIN', name: 'Fartcoin', category: 'meme', icon: <CryptoIcon src={fartcoinLogo} alt="FARTCOIN" /> },
  // L1s
  { symbol: 'ADA', name: 'Cardano', category: 'l1', icon: <CryptoIcon src={adaLogo} alt="ADA" /> },
  { symbol: 'AVAX', name: 'Avalanche', category: 'l1', icon: <CryptoIcon src={avaxLogo} alt="AVAX" /> },
  { symbol: 'DOT', name: 'Polkadot', category: 'l1', icon: <CryptoIcon src={dotLogo} alt="DOT" /> },
  { symbol: 'ATOM', name: 'Cosmos', category: 'l1', icon: <CryptoIcon src={atomLogo} alt="ATOM" /> },
  { symbol: 'NEAR', name: 'NEAR', category: 'l1', icon: <CryptoIcon src={nearLogo} alt="NEAR" /> },
  // DeFi
  { symbol: 'LINK', name: 'Chainlink', category: 'defi', icon: <CryptoIcon src={linkLogo} alt="LINK" /> },
  { symbol: 'UNI', name: 'Uniswap', category: 'defi', icon: <CryptoIcon src={uniLogo} alt="UNI" /> },
  { symbol: 'AAVE', name: 'Aave', category: 'defi', icon: <CryptoIcon src={aaveLogo} alt="AAVE" /> },
];

const CATEGORY_LABELS: Record<string, string> = {
  major: 'Major',
  privacy: 'Privacy',
  l1: 'Layer 1',
  meme: 'Meme',
  defi: 'DeFi',
};

export default function Predictions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { privateKeyUser: pkUser, isAuthenticated: isPkAuthenticated } = usePrivateKeyAuth();
  const { bets: localBets, storeBet, checkBetStatus, getBetsForMarket } = usePredictionBets();
  
  
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  // Deposit modal state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [requestOracleOpen, setRequestOracleOpen] = useState(false);
  const [requestedAsset, setRequestedAsset] = useState('');
  
  // Oracle prices state
  const [oraclePrices, setOraclePrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  // Form states for oracle market creation
  const [newResolutionDate, setNewResolutionDate] = useState('');
  const [selectedOracleAsset, setSelectedOracleAsset] = useState<string | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [targetPriceMax, setTargetPriceMax] = useState('');
  const [marketType, setMarketType] = useState<'above' | 'below' | 'between'>('above');
  
  // Bet form
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  // Auto-resolve countdown
  const [nextCheckIn, setNextCheckIn] = useState(30);

  useEffect(() => {
    fetchMarkets();
    fetchOraclePrices();
    if (user || pkUser) {
      fetchUserPositions();
    }
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('prediction-markets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prediction_markets' }, () => {
        fetchMarkets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_positions' }, () => {
        fetchMarkets();
        if (user || pkUser) fetchUserPositions();
      })
      .subscribe();
    
    // Refresh prices every 30 seconds
    const priceInterval = setInterval(fetchOraclePrices, 30000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(priceInterval);
    };
  }, [user, pkUser]);

  const fetchOraclePrices = async () => {
    setPricesLoading(true);

    try {
      const symbols = ORACLE_ASSETS.map((a) => a.symbol).join(',');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coinglass-oracle?action=prices&symbols=${symbols}`
      );

      if (!response.ok) {
        console.error('Failed to fetch oracle prices:', await response.text());
        setOraclePrices({});
      } else {
        const data = await response.json();
        if (data.error === 'RATE_LIMIT') {
          console.warn('Oracle rate limited, keeping previous prices');
        } else if (data.prices) {
          setOraclePrices(data.prices as Record<string, { price: number; change24h: number }>);
        }
      }
    } catch (error) {
      console.error('Failed to fetch oracle prices:', error);
    } finally {
      setPricesLoading(false);
    }
  };

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching markets:', error);
    } else {
      setMarkets(data || []);
    }
    setLoading(false);
  };

  const fetchUserPositions = async () => {
    let query = supabase.from('market_positions').select('*');
    
    if (user) {
      query = query.eq('user_id', user.id);
    } else if (pkUser) {
      query = query.eq('user_pk_id', pkUser.id);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setUserPositions(data);
    }
  };

  const handleCreateOracleMarket = async (asset: OracleAsset) => {
    if (!targetPrice || !newResolutionDate) {
      toast.error('Target price and resolution date are required');
      return;
    }
    
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Invalid target price');
      return;
    }
    
    if (marketType === 'between') {
      const priceMax = parseFloat(targetPriceMax);
      if (isNaN(priceMax) || priceMax <= priceNum) {
        toast.error('Max price must be greater than min price');
        return;
      }
    }
    
    // Parse the datetime-local value and format properly
    const resolutionDate = new Date(newResolutionDate);
    
    // Format date for display in question (e.g., "Dec 25, 2025")
    const dateStr = resolutionDate.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format time for criteria (e.g., "10:30 AM UTC")
    const hours = resolutionDate.getHours();
    const minutes = resolutionDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} UTC`;
    
    let question: string;
    let criteria: string;
    
    if (marketType === 'above') {
      question = `Will ${asset.name} (${asset.symbol}) be above $${priceNum.toLocaleString()} on ${dateStr}?`;
      criteria = `Resolves YES if ${asset.symbol} price is ≥ $${priceNum.toLocaleString()} at ${dateStr} ${timeStr} UTC. Resolves NO otherwise.`;
    } else if (marketType === 'below') {
      question = `Will ${asset.name} (${asset.symbol}) be below $${priceNum.toLocaleString()} on ${dateStr}?`;
      criteria = `Resolves YES if ${asset.symbol} price is ≤ $${priceNum.toLocaleString()} at ${dateStr} ${timeStr} UTC. Resolves NO otherwise.`;
    } else {
      const priceMax = parseFloat(targetPriceMax);
      question = `Will ${asset.name} (${asset.symbol}) be between $${priceNum.toLocaleString()} and $${priceMax.toLocaleString()} on ${dateStr}?`;
      criteria = `Resolves YES if ${asset.symbol} price is between $${priceNum.toLocaleString()} and $${priceMax.toLocaleString()} at ${dateStr} ${timeStr} UTC. Resolves NO otherwise.`;
    }
    
    const description = `Oracle-resolved market using real-time price data. Auto-resolvable at resolution time.`;
    
    const marketData = {
      question,
      description,
      resolution_date: resolutionDate.toISOString(),
      resolution_criteria: criteria,
      creator_id: user?.id || null,
      creator_pk_id: pkUser?.id || null,
    };
    
    const { error } = await supabase.from('prediction_markets').insert(marketData);
    
    if (error) {
      toast.error('Failed to create oracle market');
      console.error(error);
    } else {
      toast.success('Oracle market created!');
      resetOracleForm();
      fetchMarkets();
    }
  };
  
  const resetOracleForm = () => {
    setSelectedOracleAsset(null);
    setTargetPrice('');
    setTargetPriceMax('');
    setNewResolutionDate('');
    setMarketType('above');
  };


  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amountUsd = parseFloat(betAmountUsd);
    if (isNaN(amountUsd) || amountUsd <= 0) {
      toast.error('Enter a valid USD amount');
      return;
    }
    
    if (amountUsd < 1) {
      toast.error('Minimum bet is $1');
      return;
    }
    
    setPlacingBet(true);
    
    try {
      // Call the 0xNull API to create a bet
      const response = await api.placePredictionBet({
        market_id: selectedMarket.id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
      });
      
      // Store bet locally
      storeBet(response);
      
      // Show deposit modal
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
    // Refresh markets to update pool totals
    fetchMarkets();
    fetchUserPositions();
  };

  const getOdds = (market: Market) => {
    const total = market.total_yes_pool + market.total_no_pool;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.total_yes_pool / total) * 100),
      no: Math.round((market.total_no_pool / total) * 100),
    };
  };

  const calculatePotentialPayout = (market: Market, side: 'yes' | 'no', amount: number) => {
    const total = market.total_yes_pool + market.total_no_pool + amount;
    const winnerPool = side === 'yes' 
      ? market.total_yes_pool + amount 
      : market.total_no_pool + amount;
    const afterFee = total * (1 - PLATFORM_FEE);
    return (amount / winnerPool) * afterFee;
  };

  const getUserPositionForMarket = (marketId: string) => {
    return userPositions.filter(p => p.market_id === marketId);
  };

  // Check if a market is past its resolution date
  const isPastResolutionDate = (market: Market) => {
    if (!market.resolution_date) return false;
    return new Date(market.resolution_date) < new Date();
  };

  // Parse oracle market criteria to extract asset, target, and comparison type
  const parseOracleMarketCriteria = (market: Market): { asset: string; targetPrice: number; comparison: 'above' | 'below' } | null => {
    if (!market.resolution_criteria) return null;
    
    // Match patterns like "Resolves YES if BTC price is ≥ $89,000" or "Resolves YES if BTC price is ≤ $89,000"
    const aboveMatch = market.resolution_criteria.match(/if (\w+) price is (?:≥|>=|above|greater than) \$?([\d,]+)/i);
    const belowMatch = market.resolution_criteria.match(/if (\w+) price is (?:≤|<=|below|less than) \$?([\d,]+)/i);
    
    if (aboveMatch) {
      return {
        asset: aboveMatch[1].toUpperCase(),
        targetPrice: parseFloat(aboveMatch[2].replace(/,/g, '')),
        comparison: 'above',
      };
    }
    
    if (belowMatch) {
      return {
        asset: belowMatch[1].toUpperCase(),
        targetPrice: parseFloat(belowMatch[2].replace(/,/g, '')),
        comparison: 'below',
      };
    }
    
    return null;
  };

  // Auto-resolve a market using the oracle (silent, no toast for background processing)
  const autoResolveMarket = async (market: Market): Promise<boolean> => {
    const parsed = parseOracleMarketCriteria(market);
    if (!parsed) {
      console.log('Cannot auto-resolve: market criteria not recognized', market.id);
      return false;
    }

    try {
      const oracleUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coinglass-oracle?action=resolve-market&symbol=${parsed.asset}`;
      
      const oracleResponse = await fetch(oracleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          marketId: market.id,
          targetPrice: parsed.targetPrice,
          comparison: parsed.comparison,
        }),
      });

      const result = await oracleResponse.json();
      
      if (result.error) {
        console.error('Oracle error for market', market.id, result.error);
        return false;
      }

      console.log(`Market ${market.id} resolved as ${result.outcome} at $${result.currentPrice}`);
      return true;
    } catch (error) {
      console.error('Failed to auto-resolve market', market.id, error);
      return false;
    }
  };

  // Check and resolve all overdue markets automatically
  const checkAndResolveOverdueMarkets = async () => {
    const overdueMarkets = markets.filter(m => 
      m.status === 'open' && 
      isPastResolutionDate(m) && 
      parseOracleMarketCriteria(m) !== null
    );

    if (overdueMarkets.length === 0) return;

    console.log(`Found ${overdueMarkets.length} overdue markets to resolve`);
    
    let resolved = 0;
    for (const market of overdueMarkets) {
      const success = await autoResolveMarket(market);
      if (success) resolved++;
    }

    if (resolved > 0) {
      toast.success(`Auto-resolved ${resolved} market${resolved > 1 ? 's' : ''}`);
      fetchMarkets();
    }
  };

  // Auto-resolve overdue markets on load and periodically
  useEffect(() => {
    if (!loading && markets.length > 0) {
      checkAndResolveOverdueMarkets();
    }
  }, [loading, markets.length]);

  // Check every 30 seconds for overdue markets
  useEffect(() => {
    setNextCheckIn(30);
    
    const interval = setInterval(() => {
      if (markets.length > 0) {
        checkAndResolveOverdueMarkets();
        setNextCheckIn(30);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [markets]);

  // Countdown timer for next check
  useEffect(() => {
    const countdown = setInterval(() => {
      setNextCheckIn(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const getStatusBadge = (market: Market) => {
    const status = market.status;
    const isPending = status === 'open' && isPastResolutionDate(market);
    
    if (isPending) {
      return <Badge className="bg-amber-600 animate-pulse"><AlertCircle className="w-3 h-3 mr-1" /> Pending Resolution</Badge>;
    }
    
    switch (status) {
      case 'open':
        return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
      case 'closed':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      case 'resolved_yes':
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Resolved YES</Badge>;
      case 'resolved_no':
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Resolved NO</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        {/* Oracle Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-14' : 'w-72'} border-r border-border bg-card/50 min-h-[calc(100vh-4rem)] transition-all duration-300 flex-shrink-0`}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <img src={btcLogo} alt="BTC" className="w-4 h-4 rounded-full" />
                Oracle Markets
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="p-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">Live Prices</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={fetchOraclePrices}
                  disabled={pricesLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${pricesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Oracle fee info */}
              <div className="mb-4 p-2 bg-muted/30 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">0.4% oracle fee</span> from pot goes to oracle hosting
                </p>
              </div>
              
              {/* Grouped by category */}
              {(['major', 'privacy', 'meme', 'l1', 'defi'] as const).map((category) => {
                const categoryAssets = ORACLE_ASSETS.filter(a => a.category === category);
                if (categoryAssets.length === 0) return null;
                
                return (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {CATEGORY_LABELS[category]}
                    </p>
                    <div className="space-y-1">
                      {categoryAssets.map((asset) => {
                        const priceData = oraclePrices[asset.symbol];
                        const isSelected = selectedOracleAsset === asset.symbol;
                        
                        return (
                          <div key={asset.symbol}>
                            <button
                              onClick={() => setSelectedOracleAsset(isSelected ? null : asset.symbol)}
                              className={`w-full p-2 rounded-lg border transition-all text-left ${
                                isSelected 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-transparent hover:border-border hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {asset.icon}
                                  <div>
                                    <p className="font-medium text-sm">{asset.symbol}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {pricesLoading ? (
                                    <div className="h-4 w-14 bg-muted animate-pulse rounded" />
                                  ) : priceData ? (
                                    <>
                                      <p className="font-mono text-xs">${priceData.price < 1 ? priceData.price.toFixed(6) : priceData.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                      <p className={`text-xs ${priceData.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(1)}%
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">--</p>
                                  )}
                                </div>
                              </div>
                            </button>
                            
                            {/* Expanded create form */}
                            {isSelected && (user || pkUser) && (
                              <div className="mt-1 p-3 bg-muted/50 rounded-lg border border-border space-y-3">
                                <p className="text-xs font-medium">Create {asset.symbol} Market</p>
                                
                                {/* Market Type Dropdown */}
                                <div>
                                  <Label className="text-xs">Market Type</Label>
                                  <Select value={marketType} onValueChange={(v) => setMarketType(v as typeof marketType)}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="above">Price Above</SelectItem>
                                      <SelectItem value="below">Price Below</SelectItem>
                                      <SelectItem value="between">Price Between</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">{marketType === 'between' ? 'Min Price ($)' : 'Target Price ($)'}</Label>
                                  <Input
                                    type="number"
                                    placeholder={priceData?.price.toString() || '0'}
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    className="h-7 text-sm"
                                  />
                                </div>
                                
                                {marketType === 'between' && (
                                  <div>
                                    <Label className="text-xs">Max Price ($)</Label>
                                    <Input
                                      type="number"
                                      placeholder={(priceData?.price ? priceData.price * 1.1 : 0).toFixed(2)}
                                      value={targetPriceMax}
                                      onChange={(e) => setTargetPriceMax(e.target.value)}
                                      className="h-7 text-sm"
                                    />
                                  </div>
                                )}
                                
                                <div>
                                  <Label className="text-xs">Resolution Date</Label>
                                  <Input
                                    type="datetime-local"
                                    value={newResolutionDate}
                                    onChange={(e) => setNewResolutionDate(e.target.value)}
                                    className="h-7 text-sm"
                                  />
                                </div>
                                
                                {/* Auto-generated criteria preview */}
                                {targetPrice && newResolutionDate && (
                                  <div className="p-2 bg-background/50 rounded text-xs text-muted-foreground border border-border/50">
                                    <p className="font-medium text-foreground mb-1">Auto-generated criteria:</p>
                                    {marketType === 'above' && (
                                      <p>Resolves YES if {asset.symbol} ≥ ${parseFloat(targetPrice).toLocaleString()} at {new Date(newResolutionDate).toLocaleDateString()} UTC.</p>
                                    )}
                                    {marketType === 'below' && (
                                      <p>Resolves YES if {asset.symbol} ≤ ${parseFloat(targetPrice).toLocaleString()} at {new Date(newResolutionDate).toLocaleDateString()} UTC.</p>
                                    )}
                                    {marketType === 'between' && targetPriceMax && (
                                      <p>Resolves YES if {asset.symbol} between ${parseFloat(targetPrice).toLocaleString()} and ${parseFloat(targetPriceMax).toLocaleString()} at {new Date(newResolutionDate).toLocaleDateString()} UTC.</p>
                                    )}
                                  </div>
                                )}
                                
                                <Button
                                  size="sm"
                                  className="w-full h-7"
                                  onClick={() => handleCreateOracleMarket(asset)}
                                >
                                  Create Market
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Request Oracle Feed */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setRequestOracleOpen(true)}
                  className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Request Oracle</p>
                      <p className="text-xs text-muted-foreground">Need a different asset?</p>
                    </div>
                  </div>
                </button>
              </div>
              
              {!user && !pkUser && (
                <p className="text-xs text-muted-foreground text-center mt-4 px-2">
                  Login to create oracle markets
                </p>
              )}
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {ORACLE_ASSETS.map((asset) => (
                <div
                  key={asset.symbol}
                  className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer flex justify-center"
                  title={`${asset.name}: $${oraclePrices[asset.symbol]?.price?.toLocaleString() || 'Loading...'}`}
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setSelectedOracleAsset(asset.symbol);
                  }}
                >
                  {asset.icon}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Prediction Markets</h1>
              <p className="text-muted-foreground mt-1">Bet on outcomes with XMR</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3" />
              <span>Oracle check in {nextCheckIn}s</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
          ) : markets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No markets yet. Create one using the sidebar oracle assets!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {markets.map((market) => {
                const odds = getOdds(market);
                const positions = getUserPositionForMarket(market.id);
                const totalPool = market.total_yes_pool + market.total_no_pool;
                
                return (
                  <Card key={market.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{market.question}</CardTitle>
                          {market.description && (
                            <CardDescription className="mt-2">{market.description}</CardDescription>
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
                            <span className="text-emerald-500 font-medium flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" /> YES {odds.yes}%
                            </span>
                            <span className="text-red-500 font-medium flex items-center gap-1">
                              NO {odds.no}% <TrendingDown className="w-4 h-4" />
                            </span>
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
                            <span>{market.total_yes_pool.toFixed(4)} XMR</span>
                            <span>Pool: {totalPool.toFixed(4)} XMR</span>
                            <span>{market.total_no_pool.toFixed(4)} XMR</span>
                          </div>
                        </div>

                        {/* User positions (database) */}
                        {positions.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-2">Your Confirmed Positions</p>
                            {positions.map((pos) => {
                              return (
                                <div key={pos.id} className="flex justify-between text-sm">
                                  <span className={pos.side === 'yes' ? 'text-emerald-500' : 'text-red-500'}>
                                    {pos.amount.toFixed(4)} XMR on {pos.side.toUpperCase()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Potential: ~{((pos.amount / (pos.side === 'yes' ? market.total_yes_pool : market.total_no_pool)) * (totalPool * (1 - PLATFORM_FEE))).toFixed(4)} XMR
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Local bets (pending confirmation) */}
                        {getBetsForMarket(market.id).length > 0 && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              Pending Bets
                            </p>
                            {getBetsForMarket(market.id).map((bet) => (
                              <div key={bet.bet_id} className="flex justify-between text-sm">
                                <span className={bet.side === 'YES' ? 'text-emerald-500' : 'text-red-500'}>
                                  ${bet.amount_usd.toFixed(2)} ({bet.amount_xmr.toFixed(4)} XMR) on {bet.side}
                                </span>
                                <Badge variant="outline" className="text-amber-500 border-amber-500">
                                  {bet.status === 'awaiting_deposit' ? 'Awaiting Deposit' : bet.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {market.resolution_date && (
                            <span>Resolves: {new Date(market.resolution_date).toLocaleDateString()}</span>
                          )}
                          {market.resolution_criteria && (
                            <span>Criteria: {market.resolution_criteria}</span>
                          )}
                          <span>Created: {new Date(market.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        {market.status === 'open' && (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

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
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{selectedMarket.question}</p>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Current Odds</span>
                  <span>
                    <span className="text-emerald-500">YES {getOdds(selectedMarket).yes}%</span>
                    {' / '}
                    <span className="text-red-500">NO {getOdds(selectedMarket).no}%</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Total Pool</span>
                  <span>{(selectedMarket.total_yes_pool + selectedMarket.total_no_pool).toFixed(4)} XMR</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="bet-amount">Bet Amount (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="bet-amount"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="50"
                    value={betAmountUsd}
                    onChange={(e) => setBetAmountUsd(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: $1 USD. You'll pay in XMR at current rate.
                </p>
              </div>
              
              {betAmountUsd && parseFloat(betAmountUsd) > 0 && oraclePrices['XMR'] && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="flex justify-between text-sm">
                    <span>≈ XMR Amount</span>
                    <span className="font-mono font-bold">
                      {(parseFloat(betAmountUsd) / oraclePrices['XMR'].price).toFixed(6)} XMR
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>XMR Price</span>
                    <span>${oraclePrices['XMR'].price.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handlePlaceBet} 
                className={`w-full ${betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                variant={betSide === 'no' ? 'destructive' : 'default'}
                disabled={placingBet || !betAmountUsd || parseFloat(betAmountUsd) < 1}
              >
                {placingBet ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating Bet...
                  </>
                ) : (
                  `Get Deposit Address for ${betSide.toUpperCase()}`
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                After clicking, you'll receive a XMR address to send payment.
              </p>
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
        onConfirmed={handleBetConfirmed}
      />

      <Dialog open={requestOracleOpen} onOpenChange={setRequestOracleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Oracle Feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Need a price feed for a different asset? Let us know and we'll add it.
            </p>
            
            <div>
              <Label htmlFor="requested-asset">Asset Symbol or Name</Label>
              <Input
                id="requested-asset"
                placeholder="e.g., TON, SUI, APT..."
                value={requestedAsset}
                onChange={(e) => setRequestedAsset(e.target.value)}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
              <p className="font-medium">Oracle Fee Structure</p>
              <p className="text-muted-foreground">
                0.4% of the pot goes to oracle hosting at:
              </p>
              <code className="block text-[10px] break-all bg-background p-2 rounded border">
                {ORACLE_FEE_WALLET}
              </code>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => {
                if (requestedAsset.trim()) {
                  toast.success(`Oracle request submitted for ${requestedAsset.toUpperCase()}`);
                  setRequestedAsset('');
                  setRequestOracleOpen(false);
                } else {
                  toast.error('Please enter an asset name');
                }
              }}
            >
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
