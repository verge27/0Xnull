// Crypto Predictions - Tabbed layout
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { CreateMarketDialog } from '@/components/CreateMarketDialog';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, Wallet, ArrowRight, Trophy, HelpCircle, ExternalLink, ChevronDown, Activity, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
import predictionsBackground from '@/assets/predictions-background.jpg';

const TRADING_PAIRS = [
  { symbol: 'BTC/USDT', url: 'https://aggr.trade/BTCUSDT' },
  { symbol: 'ETH/USDT', url: 'https://aggr.trade/ETHUSDT' },
  { symbol: 'XMR/USDT', url: 'https://aggr.trade/XMRUSDT' },
  { symbol: 'SOL/USDT', url: 'https://aggr.trade/SOLUSDT' },
];

interface OracleAsset {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  category: 'major' | 'privacy' | 'l1' | 'meme' | 'defi';
}

const CryptoIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-6 h-6 rounded-full" />
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

export default function Predictions() {
  const { bets, storeBet, checkBetStatus, getBetsForMarket, submitPayoutAddress } = usePredictionBets();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [oraclePrices, setOraclePrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [tradingFeedOpen, setTradingFeedOpen] = useState(true);

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
    setLoading(true);
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

  const formatResolutionDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter assets by category
  const filteredAssets = selectedCategory === 'all'
    ? ORACLE_ASSETS
    : ORACLE_ASSETS.filter(a => a.category === selectedCategory);

  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${predictionsBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      </div>
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Crypto Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on price movements with XMR</p>
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

          {/* Live Trading Feed */}
          <Collapsible open={tradingFeedOpen} onOpenChange={setTradingFeedOpen} className="mb-6">
            <Card className="border-primary/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Live Markets</CardTitle>
                      <a 
                        href="https://aggr.trade" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${tradingFeedOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* Pair Toggle Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TRADING_PAIRS.map((pair) => (
                      <Button
                        key={pair.symbol}
                        variant={selectedPair.symbol === pair.symbol ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPair(pair)}
                        className={selectedPair.symbol === pair.symbol ? "bg-primary text-primary-foreground" : ""}
                      >
                        {pair.symbol}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Trading Feed Iframe */}
                  <div className="rounded-lg overflow-hidden border border-border">
                    <iframe 
                      src={selectedPair.url}
                      width="100%" 
                      height="500"
                      style={{ borderRadius: '8px', border: 'none' }}
                      allow="fullscreen"
                      title={`${selectedPair.symbol} Live Trading Feed`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Live order flow, trades & liquidations powered by aggr.trade
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Tabs defaultValue="prices" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="prices">Prices</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            </TabsList>

            {/* Prices Tab */}
            <TabsContent value="prices" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live Prices
                </h2>
                <Button variant="ghost" size="sm" onClick={fetchOraclePrices} disabled={pricesLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="major">Major</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="meme">Meme</TabsTrigger>
                  <TabsTrigger value="l1">Layer 1</TabsTrigger>
                  <TabsTrigger value="defi">DeFi</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => {
                  const priceData = oraclePrices[asset.symbol];
                  const assetMarkets = activeMarkets.filter(m => m.oracle_asset === asset.symbol);
                  
                  return (
                    <Card key={asset.symbol} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {asset.icon}
                            <div>
                              <p className="font-semibold">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[asset.category]}
                          </Badge>
                        </div>
                        
                        <div className="text-center mb-3">
                          {pricesLoading ? (
                            <div className="h-8 bg-muted animate-pulse rounded" />
                          ) : priceData ? (
                            <>
                              <p className="text-2xl font-bold font-mono">
                                ${priceData.price < 1 ? priceData.price.toFixed(6) : priceData.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                              <p className={`text-sm ${priceData.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}% (24h)
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">--</p>
                          )}
                        </div>
                        
                        {assetMarkets.length > 0 ? (
                          <p className="text-xs text-center text-muted-foreground">
                            {assetMarkets.length} active market{assetMarkets.length > 1 ? 's' : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-center text-muted-foreground">No markets</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No active markets yet.</p>
                    <p className="text-sm text-muted-foreground">Create one using the button above.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeMarkets.map((market) => {
                    const odds = getOdds(market);
                    const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                    const pendingBets = getBetsForMarket(market.market_id);
                    
                    return (
                      <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{market.title}</CardTitle>
                              {market.description && (
                                <CardDescription className="mt-1 text-sm">{market.description}</CardDescription>
                              )}
                            </div>
                            {getStatusBadge(market)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{odds.yes}%</div>
                                <div className="text-xs text-muted-foreground">YES</div>
                              </div>
                              <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                <div className="text-2xl font-bold text-red-400">{odds.no}%</div>
                                <div className="text-xs text-muted-foreground">NO</div>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground text-center">
                              Pool: {totalPool.toFixed(4)} XMR • Resolves: {formatResolutionDate(market.resolution_time)}
                            </div>
                            
                            {pendingBets.length > 0 && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
                                <p className="text-xs text-amber-500">
                                  You have {pendingBets.length} pending bet(s)
                                </p>
                              </div>
                            )}
                            
                            {/* Pool Transparency */}
                            <PoolTransparency marketId={market.market_id} />
                            
                            
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
                <div className="grid md:grid-cols-2 gap-4">
                  {resolvedMarkets.map((market) => {
                    const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
                    
                    return (
                      <Card key={market.market_id} className="opacity-75">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{market.title}</CardTitle>
                              {market.description && (
                                <CardDescription className="mt-1 text-sm">{market.description}</CardDescription>
                              )}
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
                          <div className="flex justify-between text-sm">
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
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolved: {formatResolutionDate(market.resolution_time)}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* My Bets Tab */}
            <TabsContent value="my-bets" className="space-y-4">
              <MyBets 
                bets={bets} 
                onStatusUpdate={checkBetStatus} 
                onPayoutSubmit={submitPayoutAddress}
              />
            </TabsContent>
          </Tabs>
        </main>

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
                <p className="text-sm text-muted-foreground">{selectedMarket.title}</p>
                
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
                    <span>{(selectedMarket.yes_pool_xmr + selectedMarket.no_pool_xmr).toFixed(4)} XMR</span>
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
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>≈ XMR Amount</span>
                      <span className="font-mono font-bold">
                        {(parseFloat(betAmountUsd) / oraclePrices['XMR'].price).toFixed(6)} XMR
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>XMR Price</span>
                      <span>${oraclePrices['XMR'].price.toFixed(2)}</span>
                    </div>
                    {(() => {
                      const betXmr = parseFloat(betAmountUsd) / oraclePrices['XMR'].price;
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
                            <span className="flex items-center gap-1">
                              Potential profit
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="mb-2">Parimutuel betting pools all bets together. Winners split the total pool proportionally to their stake.</p>
                                    <Link to="/how-betting-works" className="text-primary hover:underline text-xs">Learn more →</Link>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                            <span className="text-emerald-500">+{profit.toFixed(4)} XMR ({multiplier.toFixed(2)}x)</span>
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-2 italic">
                            Actual payout may vary as pool size changes before market resolution
                          </p>
                        </div>
                      );
                    })()}
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
        
        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 border-t border-border/50">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <Collapsible className="border border-border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
                How does it work?
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                Pick a market, choose YES or NO, enter your bet amount in USD. We generate a unique XMR deposit address. Send the exact amount, and you're in.
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="border border-border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
                What happens when the market resolves?
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                Our oracle checks the outcome automatically at the resolution time. For price markets, we pull live data from Binance or CoinGecko. Winners get paid directly to their payout address.
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="border border-border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
                What's the fee?
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                0.4% of the winning pool. That's it.
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="border border-border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
                Do I need an account?
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                No. No signup, no email, no KYC. Just a Monero wallet.
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="border border-border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
                What currencies do you accept?
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                XMR only. Need to swap? Use our Swaps page - powered by Trocador.
              </CollapsibleContent>
            </Collapsible>
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
}
