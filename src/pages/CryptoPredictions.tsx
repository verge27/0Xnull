import { useState, useEffect, useMemo } from 'react';
import { SEORichText } from '@/components/SEORichText';
import { Link, useSearchParams } from 'react-router-dom';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useVoucher, useVoucherFromUrl } from '@/hooks/useVoucher';
import { useSEO, useEventListSEO } from '@/hooks/useSEO';
import { api, type PredictionMarket } from '@/services/api';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';

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
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { AddToSlipButton } from '@/components/AddToSlipButton';
import { CreateMarketDialog } from '@/components/CreateMarketDialog';
import { MyBets } from '@/components/MyBets';
import { PoolTransparency } from '@/components/PoolTransparency';
import { GameCommunityLinks } from '@/components/GameCommunityLinks';
import { BettingCountdown, isBettingOpen, isBettingClosingSoon } from '@/components/BettingCountdown';
import { ClosedMarketsSection } from '@/components/ClosedMarketsSection';
import { ResolvedMarketsSection } from '@/components/ResolvedMarketsSection';
import { VoucherBadge } from '@/components/VoucherBadge';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Wallet, ArrowRight, HelpCircle, ExternalLink, ChevronDown, Activity, Info, Lock } from 'lucide-react';
import ExolixWidget from '@/components/ExolixWidget';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
const cryptoPredictionsBackground = '/images/backgrounds/crypto-predictions-background.webp';

const TRADING_PAIRS = [
  { symbol: 'BTC/USDT', tvSymbol: 'OKX:BTCUSDT' },
  { symbol: 'ETH/USDT', tvSymbol: 'OKX:ETHUSDT' },
  { symbol: 'XMR/USDT', tvSymbol: 'KUCOIN:XMRUSDT' },
  { symbol: 'SOL/USDT', tvSymbol: 'OKX:SOLUSDT' },
  { symbol: 'BNB/USDT', tvSymbol: 'OKX:BNBUSDT' },
  { symbol: 'NIGHT/USDT', tvSymbol: 'OKX:NIGHTUSDT' },
  { symbol: 'DOGE/USDT', tvSymbol: 'OKX:DOGEUSDT' },
  { symbol: 'SUI/USDT', tvSymbol: 'OKX:SUIUSDT' },
  { symbol: 'ADA/USDT', tvSymbol: 'OKX:ADAUSDT' },
  { symbol: 'ZEC/USDT', tvSymbol: 'OKX:ZECUSDT' },
  { symbol: 'LINK/USDT', tvSymbol: 'OKX:LINKUSDT' },
  { symbol: 'BCH/USDT', tvSymbol: 'OKX:BCHUSDT' },
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

export default function CryptoPredictions() {
  useSEO({
    title: 'Anonymous Crypto Prediction Markets | No-KYC Crypto Predictions – 0xNull',
    description: 'Access anonymous crypto prediction markets on 0xNull. Predict crypto prices with no KYC, no accounts, and Monero payments on a privacy-first platform.',
  });
  const { bets, storeBet, checkBetStatus, getBetsForMarket, submitPayoutAddress } = usePredictionBets();
  const { isAdmin } = useIsAdmin();
  
  // Voucher support
  const { voucher: savedVoucher } = useVoucher();
  useVoucherFromUrl();
  
  // Multibet slip
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Event list SEO for structured data
  const eventListData = useMemo(() => {
    if (markets.length === 0) return null;
    return {
      events: markets.filter(m => !m.resolved).slice(0, 20).map(m => ({
        id: m.market_id,
        question: m.title || 'Crypto price prediction',
        description: m.description,
        resolutionDate: m.resolution_time ? new Date(m.resolution_time * 1000).toISOString() : undefined,
        status: m.resolved ? 'resolved' as const : 'open' as const,
        totalPool: m.yes_pool_xmr + m.no_pool_xmr,
        eventType: 'crypto' as const,
      })),
      pageTitle: 'Crypto Predictions - 0xNull',
      pageDescription: 'Predict cryptocurrency prices anonymously. BTC, ETH, XMR price predictions with privacy.',
      pageUrl: 'https://0xnull.io/predictions',
    };
  }, [markets]);
  useEventListSEO(eventListData);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [oraclePrices, setOraclePrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marketAssetFilter, setMarketAssetFilter] = useState<string>('all');

  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [tradingFeedOpen, setTradingFeedOpen] = useState(true);

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
    // Don't clear markets on refresh - keep showing previous data until new data loads
    try {
      // Fetch blocked markets from database
      const { data: blockedData } = await supabase
        .from('blocked_markets')
        .select('market_id');
      const blockedIds = new Set((blockedData || []).map(b => b.market_id));

      const { markets: apiMarkets } = await api.getPredictionMarkets(true);
      const priceMarkets = apiMarkets.filter(m => m.oracle_type === 'price');

      // Filter out blocked markets
      const unblockedMarkets = priceMarkets.filter(m => !blockedIds.has(m.market_id));

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
      toast.error(message);
    } finally {
      setPlacingBet(false);
      setElapsedSeconds(0);
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

  const formatResolutionDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredAssets = selectedCategory === 'all'
    ? ORACLE_ASSETS
    : ORACLE_ASSETS.filter(a => a.category === selectedCategory);

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
  const closedMarkets = markets
    .filter(m => m.resolved === 0 && !isBettingOpen(m))
    .sort((a, b) => a.resolution_time - b.resolution_time);

  // Resolved markets
  const resolvedMarkets = markets
    .filter(m => m.resolved !== 0)
    .sort((a, b) => (b.yes_pool_xmr + b.no_pool_xmr) - (a.yes_pool_xmr + a.no_pool_xmr));

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${cryptoPredictionsBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="relative z-10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Crypto Predictions
              </h1>
              <VoucherBadge />
            </div>
            <p className="text-muted-foreground mt-1">Bet on price movements with XMR</p>
          </div>
          <div className="flex items-center gap-2">
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


        {/* Live Markets + Community Links */}
        <div className="mb-6 flex gap-4">
          <Collapsible open={tradingFeedOpen} onOpenChange={setTradingFeedOpen} className="flex-1">
            <Card className="border-primary/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Live Markets</CardTitle>
                      <a
                        href="https://www.tradingview.com/chart/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Open TradingView"
                        title="Open TradingView"
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TRADING_PAIRS.map((pair) => (
                      <Button
                        key={pair.symbol}
                        variant={selectedPair.symbol === pair.symbol ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPair(pair)}
                        className={selectedPair.symbol === pair.symbol ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {pair.symbol}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-lg overflow-hidden border border-border" style={{ height: '500px' }}>
                    <iframe
                      key={selectedPair.tvSymbol}
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${selectedPair.tvSymbol}&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&showpopupbutton=1&locale=en&utm_source=&utm_medium=widget_new&utm_campaign=chart`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allowTransparency
                      scrolling="no"
                      allowFullScreen
                      title={`${selectedPair.symbol} TradingView Chart`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Powered by TradingView
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          <div className="hidden lg:block w-64 shrink-0">
            <GameCommunityLinks category="crypto" defaultOpen={false} />
          </div>
        </div>
        {/* Mobile community links */}
        <div className="lg:hidden mb-6">
          <GameCommunityLinks category="crypto" defaultOpen={false} />
        </div>

        <Tabs defaultValue="prices" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="prices">Prices</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="my-bets">My Bets</TabsTrigger>
            <TabsTrigger value="my-slips" asChild>
              <Link to="/my-slips">My Slips</Link>
            </TabsTrigger>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Markets ({marketAssetFilter === 'all' ? activeMarkets.length : activeMarkets.filter(m => m.oracle_asset === marketAssetFilter).length})
              </h2>
            </div>
            
            <Tabs value={marketAssetFilter} onValueChange={setMarketAssetFilter}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {ORACLE_ASSETS.filter(a => activeMarkets.some(m => m.oracle_asset === a.symbol)).map(asset => (
                  <TabsTrigger key={asset.symbol} value={asset.symbol} className="flex items-center gap-1">
                    {asset.icon}
                    {asset.symbol}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
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
                {(marketAssetFilter === 'all' ? activeMarkets : activeMarkets.filter(m => m.oracle_asset === marketAssetFilter)).map((market) => {
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
                              <div className="text-xs font-mono text-emerald-500/70">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                            </div>
                            <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                              <div className="text-2xl font-bold text-red-400">{odds.no}%</div>
                              <div className="text-xs text-muted-foreground">NO</div>
                              <div className="text-xs font-mono text-red-500/70">{market.no_pool_xmr.toFixed(4)} XMR</div>
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
                        </div>
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
        </Tabs>
        
        {/* Closed Markets Section */}
        <ClosedMarketsSection markets={closedMarkets} getBetsForMarket={getBetsForMarket} onMarketsUpdate={fetchMarkets} />
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
                    step="0.01"
                    min={BETTING_CONFIG.MINIMUM_BET_USD}
                    placeholder="50"
                    value={betAmountUsd}
                    onChange={(e) => setBetAmountUsd(e.target.value)}
                    className={`pl-7 ${betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? 'border-destructive' : ''}`}
                  />
                </div>
                {betAmountUsd && !validateBetAmount(parseFloat(betAmountUsd)).valid ? (
                  <p className="text-xs text-destructive mt-1">{validateBetAmount(parseFloat(betAmountUsd)).error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {formatMinimumBet()} USD. You'll pay in XMR at current rate.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="payout-address">Payout Address (XMR)</Label>
                <Input
                  id="payout-address"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="4... or 8... (your Monero address)"
                  className="font-mono text-xs mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where winnings or refunds will be sent
                </p>
              </div>

              {/* Refund info */}
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-200/80">
                <p><strong>Refund Policy:</strong> Full refund (no fees) if: unopposed market or oracle failure. 0.4% fee on winnings only.</p>
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
                onClick={handlePlaceBet} 
                className={`w-full ${betSide === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                variant={betSide === 'no' ? 'destructive' : 'default'}
                disabled={placingBet || !betAmountUsd || !payoutAddress || parseFloat(betAmountUsd) < 1}
              >
                {placingBet ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating Bet... ({elapsedSeconds}s)
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
        marketTitle={selectedMarket?.title}
        bettingClosesAt={selectedMarket?.betting_closes_at || selectedMarket?.resolution_time}
      />

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
      
      {/* SEO Rich Text Section */}
      <SEORichText 
        title="Anonymous Crypto Prediction Markets on 0xNull"
        content="<p>0xNull offers anonymous crypto prediction markets with no KYC, no accounts, and no identity verification. Users can predict cryptocurrency price movements and market outcomes while maintaining full financial privacy.</p><p>Unlike centralized prediction platforms and exchanges, 0xNull crypto prediction markets are built around anonymity and privacy-first design. There is no user tracking, no personal data collection, and no requirement to submit documents. All predictions are placed using cryptocurrencies, including Monero, to ensure confidential and censorship-resistant transactions.</p><p>These no-KYC crypto prediction markets allow participants to express market views without exposing their identity or relying on custodial services. Markets cover a wide range of crypto-related outcomes, including price levels, trend directions, and major market events.</p><p>By combining decentralized infrastructure, crypto-native payments, and strict privacy principles, 0xNull creates a secure environment for anonymous crypto predictions. The platform is designed for users who want market access without surveillance, restrictions, or centralized control.</p><p>Explore anonymous crypto prediction markets on 0xNull and participate freely—without KYC, accounts, or compromised privacy.</p>"
      />
      
      <Footer />
      </div>
    </div>
  );
}
