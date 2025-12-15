import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { api, type PredictionMarket } from '@/services/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { CreateMarketDialog } from '@/components/CreateMarketDialog';
import { MyBets } from '@/components/MyBets';
import { PredictionLeaderboard } from '@/components/PredictionLeaderboard';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, Wallet, Filter, ArrowUpDown, Trophy, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface OracleAsset {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  category: 'major' | 'privacy' | 'l1' | 'meme' | 'defi';
}

const CryptoIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-5 h-5 rounded-full" />
);

const ORACLE_ASSETS: OracleAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'major', icon: <CryptoIcon src={btcLogo} alt="BTC" /> },
  { symbol: 'ETH', name: 'Ethereum', category: 'major', icon: <CryptoIcon src={ethLogo} alt="ETH" /> },
  { symbol: 'SOL', name: 'Solana', category: 'major', icon: <CryptoIcon src={solLogo} alt="SOL" /> },
  { symbol: 'LTC', name: 'Litecoin', category: 'major', icon: <CryptoIcon src={ltcLogo} alt="LTC" /> },
  { symbol: 'XMR', name: 'Monero', category: 'privacy', icon: <CryptoIcon src={xmrLogo} alt="XMR" /> },
  { symbol: 'DASH', name: 'Dash', category: 'privacy', icon: <CryptoIcon src={dashLogo} alt="DASH" /> },
  { symbol: 'ZEC', name: 'Zcash', category: 'privacy', icon: <CryptoIcon src={zecLogo} alt="ZEC" /> },
  { symbol: 'ARRR', name: 'Pirate Chain', category: 'privacy', icon: <CryptoIcon src={arrrLogo} alt="ARRR" /> },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'meme', icon: <CryptoIcon src={dogeLogo} alt="DOGE" /> },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme', icon: <CryptoIcon src={shibLogo} alt="SHIB" /> },
  { symbol: 'PEPE', name: 'Pepe', category: 'meme', icon: <CryptoIcon src={pepeLogo} alt="PEPE" /> },
  { symbol: 'BONK', name: 'Bonk', category: 'meme', icon: <CryptoIcon src={bonkLogo} alt="BONK" /> },
  { symbol: 'FARTCOIN', name: 'Fartcoin', category: 'meme', icon: <CryptoIcon src={fartcoinLogo} alt="FARTCOIN" /> },
  { symbol: 'ADA', name: 'Cardano', category: 'l1', icon: <CryptoIcon src={adaLogo} alt="ADA" /> },
  { symbol: 'AVAX', name: 'Avalanche', category: 'l1', icon: <CryptoIcon src={avaxLogo} alt="AVAX" /> },
  { symbol: 'DOT', name: 'Polkadot', category: 'l1', icon: <CryptoIcon src={dotLogo} alt="DOT" /> },
  { symbol: 'ATOM', name: 'Cosmos', category: 'l1', icon: <CryptoIcon src={atomLogo} alt="ATOM" /> },
  { symbol: 'NEAR', name: 'NEAR', category: 'l1', icon: <CryptoIcon src={nearLogo} alt="NEAR" /> },
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

export default function CryptoPredictions() {
  const { bets, storeBet, checkBetStatus, getBetsForMarket, submitPayoutAddress } = usePredictionBets();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [oraclePrices, setOraclePrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'resolution' | 'pool' | 'newest'>('resolution');

  useEffect(() => {
    fetchMarkets();
    fetchOraclePrices();
    
    const interval = setInterval(() => {
      fetchMarkets();
      fetchOraclePrices();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOraclePrices = async () => {
    setPricesLoading(true);
    try {
      const symbols = ORACLE_ASSETS.map((a) => a.symbol).join(',');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coinglass-oracle?action=prices&symbols=${symbols}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.prices) {
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
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      // Filter to only crypto/price markets
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'price'));
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
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Resolved YES</Badge>;
      } else {
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Resolved NO</Badge>;
      }
    }
    
    if (market.resolution_time <= now) {
      return <Badge className="bg-amber-600 animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Resolving...</Badge>;
    }
    
    return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
  };

  const getResolutionCountdown = (resolutionTime: number) => {
    const now = Date.now() / 1000;
    const diff = resolutionTime - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 7) return null;
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      const mins = Math.floor((diff % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    const mins = Math.floor(diff / 60);
    return `${mins}m`;
  };

  const formatResolutionDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort
  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);
  
  let filteredMarkets = activeMarkets;
  if (filterAsset !== 'all') {
    filteredMarkets = filteredMarkets.filter(m => m.oracle_asset === filterAsset);
  }
  
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'resolution') return a.resolution_time - b.resolution_time;
    if (sortBy === 'pool') return (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr);
    return b.created_at - a.created_at;
  });

  let filteredResolved = resolvedMarkets;
  if (filterAsset !== 'all') {
    filteredResolved = filteredResolved.filter(m => m.oracle_asset === filterAsset);
  }
  const sortedResolved = [...filteredResolved].sort((a, b) => b.resolution_time - a.resolution_time);

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
                Live Prices
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
                <span className="text-xs text-muted-foreground">Oracle Prices</span>
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
                        
                        return (
                          <div
                            key={asset.symbol}
                            className="w-full p-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {asset.icon}
                                <p className="font-medium text-sm">{asset.symbol}</p>
                              </div>
                              <div className="text-right">
                                {pricesLoading ? (
                                  <div className="h-4 w-14 bg-muted animate-pulse rounded" />
                                ) : priceData ? (
                                  <>
                                    <p className="font-mono text-xs">
                                      ${priceData.price < 1 ? priceData.price.toFixed(6) : priceData.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-xs ${priceData.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(1)}%
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-muted-foreground">--</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {ORACLE_ASSETS.map((asset) => (
                <div
                  key={asset.symbol}
                  className="p-2 rounded-lg hover:bg-muted/50 flex justify-center"
                  title={`${asset.name}: $${oraclePrices[asset.symbol]?.price?.toLocaleString() || 'Loading...'}`}
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
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Crypto Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on crypto price movements with XMR</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/sports-predictions">
                <Button variant="outline" size="sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Sports
                </Button>
              </Link>
              <CreateMarketDialog onMarketCreated={fetchMarkets} />
              <Button variant="outline" size="sm" onClick={fetchMarkets} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Need XMR Banner */}
          <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Need XMR to place bets?</p>
            <Link to="/swaps" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Get XMR <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterAsset} onValueChange={setFilterAsset}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {Array.from(new Set(markets.map(m => m.oracle_asset))).map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v: 'resolution' | 'pool' | 'newest') => setSortBy(v)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolution">Resolution Date</SelectItem>
                  <SelectItem value="pool">Pool Size</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
          ) : sortedMarkets.length === 0 && sortedResolved.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No crypto markets available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {/* Active Markets */}
                {sortedMarkets.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Active Markets ({sortedMarkets.length})
                    </h2>
                    <div className="grid gap-4">
                      {sortedMarkets.map((market) => {
                        const odds = getOdds(market);
                        const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                        const pendingBets = getBetsForMarket(market.market_id);
                        
                        return (
                          <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-xl">{market.title}</CardTitle>
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
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground items-center">
                                  {(() => {
                                    const countdown = getResolutionCountdown(market.resolution_time);
                                    if (countdown) {
                                      return (
                                        <span className="text-amber-500 font-medium flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> Resolves in {countdown}
                                        </span>
                                      );
                                    }
                                    return <span>Resolves: {formatResolutionDate(market.resolution_time)}</span>;
                                  })()}
                                  {market.oracle_asset && (
                                    <span>Oracle: {market.oracle_asset} {market.oracle_condition} ${market.oracle_value?.toLocaleString()}</span>
                                  )}
                                </div>

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
                {sortedResolved.length > 0 && (
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between mb-4 hover:bg-muted/50">
                        <span className="flex items-center gap-2 text-lg font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          Resolved Markets ({sortedResolved.length})
                        </span>
                        <ChevronRight className="w-5 h-5 transition-transform group-data-[state=open]:rotate-90" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-4">
                        {sortedResolved.map((market) => {
                          const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                          
                          return (
                            <Card key={market.market_id} className="opacity-75">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{market.title}</CardTitle>
                                  </div>
                                  <Badge 
                                    className={market.outcome === 'YES' 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                    }
                                  >
                                    {market.outcome === 'YES' ? (
                                      <><CheckCircle className="w-3 h-3 mr-1" /> YES Won</>
                                    ) : (
                                      <><XCircle className="w-3 h-3 mr-1" /> NO Won</>
                                    )}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span className={market.outcome === 'YES' ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                                      YES: {market.yes_pool_xmr.toFixed(4)} XMR
                                    </span>
                                    <span className="text-muted-foreground">
                                      Total: {totalPool.toFixed(4)} XMR
                                    </span>
                                    <span className={market.outcome === 'NO' ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                                      NO: {market.no_pool_xmr.toFixed(4)} XMR
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span>Resolved: {formatResolutionDate(market.resolution_time)}</span>
                                    {market.oracle_asset && (
                                      <span>Oracle: {market.oracle_asset} {market.oracle_condition} ${market.oracle_value?.toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-4">
                  <MyBets 
                    bets={bets} 
                    onStatusUpdate={checkBetStatus} 
                    onPayoutSubmit={submitPayoutAddress}
                  />
                  <PredictionLeaderboard userBets={bets} />
                </div>
              </div>
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
  );
}
