import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, RefreshCw, Copy, ExternalLink, Check, History, Clock, Trash2, Banknote } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SiteAssistant } from '@/components/SiteAssistant';
import { useSEO } from '@/hooks/useSEO';
import swapsBackground from '@/assets/swaps-background.webp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoinSelector } from '@/components/CoinSelector';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Aggregator = 'trocador' | 'exolix';

// Popular coins with preferred networks - XMR FIRST
// Using exact ticker/network values from Trocador API
const POPULAR_COINS: { ticker: string; network: string; label: string }[] = [
  { ticker: 'xmr', network: 'Mainnet', label: 'Monero' },
  { ticker: 'btc', network: 'Mainnet', label: 'Bitcoin' },
  { ticker: 'eth', network: 'ERC20', label: 'Ethereum' },  // ETH Mainnet = ERC20 in Trocador
  { ticker: 'usdt', network: 'ERC20', label: 'Tether' },
  { ticker: 'ltc', network: 'Mainnet', label: 'Litecoin' },
  { ticker: 'doge', network: 'Mainnet', label: 'Dogecoin' },
  { ticker: 'bnb', network: 'BEP2', label: 'Binance Coin' },
  { ticker: 'sol', network: 'Mainnet', label: 'Solana' },
  { ticker: 'usdc', network: 'ERC20', label: 'USD Coin' },
  { ticker: 'zec', network: 'Mainnet', label: 'Zcash' },
];

const PRIVACY_COINS = ['xmr', 'zec', 'dash'];

const isPrivacyCoin = (ticker: string) => PRIVACY_COINS.includes(ticker.toLowerCase());

interface Coin {
  id: string;
  ticker: string;
  name: string;
  network: string;
  memo: boolean;
  image: string | null;
  minimum: number;
  maximum: number;
}

interface RateProvider {
  provider: string;
  amount_to: string;
  kycrating: string;
  eta: number;
  fixed: string;
  insurance: number;
  provider_logo?: string;
  USD_total_cost_percentage?: string;
}

interface ExolixRate {
  fromAmount: number;
  toAmount: number;
  rate: number;
  minAmount: number;
  maxAmount: number;
  message?: string;
}

interface TradeResponse {
  trade_id: string;
  address: string;
  address_memo?: string;
  status: string;
  amount_from: string;
  amount_to: string;
}

interface SwapHistoryItem {
  id: string;
  trade_id: string;
  from_coin: string;
  from_network: string;
  to_coin: string;
  to_network: string;
  amount: string;
  receive_address: string;
  provider: string;
  status: string | null;
  created_at: string;
}


const Swaps = () => {
  useSEO();
  const { toast } = useToast();
  const { user } = useAuth();
  const [aggregator, setAggregator] = useState<Aggregator>('trocador');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [exolixCoins, setExolixCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCoin, setFromCoin] = useState('');
  const [fromNetwork, setFromNetwork] = useState('');
  const [toCoin, setToCoin] = useState('');
  const [toNetwork, setToNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [addressMemo, setAddressMemo] = useState('');
  const [refundAddress, setRefundAddress] = useState('');
  
  const [rates, setRates] = useState<RateProvider[]>([]);
  const [exolixRate, setExolixRate] = useState<ExolixRate | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<RateProvider | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [trade, setTrade] = useState<TradeResponse | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasFetchedRates, setHasFetchedRates] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCoins();
    fetchSwapHistory();
  }, []);

  // Poll for status updates on active trade
  useEffect(() => {
    if (!trade?.trade_id) return;
    
    // Don't poll if already finished
    const finalStatuses = ['finished', 'failed', 'expired', 'halted', 'refunded', 'paid partially'];
    if (finalStatuses.includes(trade.status?.toLowerCase() || '')) return;

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('trocador-trade-status', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Use query params for GET-like behavior
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trocador-trade-status?trade_id=${trade.trade_id}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        
        if (response.ok) {
          const statusData = await response.json();
          if (statusData.status && statusData.status !== trade.status) {
            const newStatus = statusData.status;
            setTrade(prev => prev ? { ...prev, status: newStatus } : null);
            // Also refresh history to update stored status
            fetchSwapHistory();
            
            // Show toast notification for status change
            const statusMessages: Record<string, { title: string; description: string; variant?: 'default' | 'destructive' }> = {
              'confirming': { title: '⏳ Deposit Detected', description: 'Your deposit is being confirmed on the blockchain' },
              'sending': { title: '🚀 Coins Being Sent', description: 'The exchange is sending your coins!' },
              'finished': { title: '✅ Swap Complete!', description: 'Your swap has been completed successfully' },
              'failed': { title: 'Swap Failed', description: 'Something went wrong. Contact Trocador support.', variant: 'destructive' },
              'expired': { title: 'Swap Expired', description: 'The swap expired before deposit was received', variant: 'destructive' },
              'halted': { title: 'Swap Halted', description: 'There was an issue. Contact Trocador support.', variant: 'destructive' },
              'refunded': { title: 'Swap Refunded', description: 'The exchange has refunded your deposit' },
            };
            
            const msg = statusMessages[newStatus.toLowerCase()];
            if (msg) {
              toast({ title: msg.title, description: msg.description, variant: msg.variant });
            }
          }
        }
      } catch (error) {
        console.error('Error polling trade status:', error);
      }
    };

    // Poll immediately and then every 15 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 15000);
    
    return () => clearInterval(interval);
  }, [trade?.trade_id, trade?.status]);

  // Poll for status updates on history items
  useEffect(() => {
    if (swapHistory.length === 0) return;
    
    const finalStatuses = ['finished', 'failed', 'expired', 'halted', 'refunded', 'paid partially'];
    const pendingSwaps = swapHistory.filter(s => !finalStatuses.includes(s.status?.toLowerCase() || ''));
    
    if (pendingSwaps.length === 0) return;

    const pollHistoryStatuses = async () => {
      for (const swap of pendingSwaps) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trocador-trade-status?trade_id=${swap.trade_id}`,
            {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
          
          if (response.ok) {
            const statusData = await response.json();
            if (statusData.status && statusData.status !== swap.status) {
              const newStatus = statusData.status;
              // Update local state
              setSwapHistory(prev => 
                prev.map(s => s.trade_id === swap.trade_id ? { ...s, status: newStatus } : s)
              );
              
              // Show toast for completed/failed swaps in history
              if (newStatus.toLowerCase() === 'finished') {
                toast({ 
                  title: '✅ Swap Complete!', 
                  description: `Your ${swap.from_coin.toUpperCase()} → ${swap.to_coin.toUpperCase()} swap is done` 
                });
              } else if (['failed', 'expired', 'halted'].includes(newStatus.toLowerCase())) {
                toast({ 
                  title: 'Swap Issue', 
                  description: `${swap.from_coin.toUpperCase()} → ${swap.to_coin.toUpperCase()} swap: ${newStatus}`,
                  variant: 'destructive'
                });
              }
            }
          }
        } catch (error) {
          console.error('Error polling swap status:', error);
        }
      }
    };

    // Poll every 30 seconds for history items
    const interval = setInterval(pollHistoryStatuses, 30000);
    
    return () => clearInterval(interval);
  }, [swapHistory]);

  const fetchCoins = async () => {
    // First fetch popular coins specifically to ensure they're loaded
    const popularTickers = POPULAR_COINS.map(p => p.ticker.toLowerCase());
    
    const { data: popularData, error: popularError } = await supabase
      .from('coins')
      .select('*')
      .or(popularTickers.map(t => `ticker.ilike.${t}`).join(','));
    
    // Then fetch all other coins
    const { data: allData, error: allError } = await supabase
      .from('coins')
      .select('*')
      .order('ticker')
      .limit(5000);
    
    if (popularError || allError) {
      console.error('Error fetching coins:', popularError || allError);
      toast({ title: 'Error', description: 'Failed to load coins', variant: 'destructive' });
    } else {
      // Combine, removing duplicates (popular coins take precedence)
      const popularSet = new Set(popularData?.map(c => `${c.ticker}-${c.network}`) || []);
      const otherCoins = allData?.filter(c => !popularSet.has(`${c.ticker}-${c.network}`)) || [];
      const combined = [...(popularData || []), ...otherCoins];
      
      console.log('Popular coins loaded:', popularData?.length);
      console.log('Total coins:', combined.length);
      setCoins(combined);
    }
    setLoading(false);
  };

  // Fetch Exolix coins
  const fetchExolixCoins = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('exolix-api', {
        body: { action: 'currencies' },
      });
      
      if (error) throw error;
      
      const currencies = data?.data || [];
      const mapped: Coin[] = [];
      
      currencies.forEach((c: { code: string; name: string; icon: string; networks?: Array<{ network: string; memoNeeded: boolean }> }) => {
        // Each currency can have multiple networks
        const networks = c.networks || [{ network: c.code, memoNeeded: false }];
        networks.forEach((n: { network: string; memoNeeded: boolean }) => {
          mapped.push({
            id: `${c.code}-${n.network}`,
            ticker: c.code.toLowerCase(),
            name: c.name,
            network: n.network,
            memo: n.memoNeeded,
            image: c.icon,
            minimum: 0,
            maximum: 999999,
          });
        });
      });
      
      setExolixCoins(mapped);
    } catch (error) {
      console.error('Error fetching Exolix coins:', error);
    }
  };

  // Fetch Exolix coins when switching to Exolix
  useEffect(() => {
    if (aggregator === 'exolix' && exolixCoins.length === 0) {
      fetchExolixCoins();
    }
  }, [aggregator]);

  const syncCoins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-trocador-coins');
      if (error) throw error;
      toast({ title: 'Success', description: data.message });
      await fetchCoins();
    } catch (error) {
      console.error('Error syncing coins:', error);
      toast({ title: 'Error', description: 'Failed to sync coins', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchSwapHistory = async () => {
    const savedTradeIds = JSON.parse(localStorage.getItem('swap_trade_ids') || '[]');
    if (savedTradeIds.length === 0) return;
    
    setLoadingHistory(true);
    try {
      // Use security definer function to fetch swaps by trade_id
      // This allows anonymous users to view their swaps if they know the trade_id
      const results: SwapHistoryItem[] = [];
      
      for (const tradeId of savedTradeIds) {
        const { data, error } = await supabase
          .rpc('get_swap_by_trade_id', { p_trade_id: tradeId });
        
        if (!error && data && data.length > 0) {
          results.push(data[0]);
        }
      }
      
      // Sort by created_at descending
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSwapHistory(results);
    } catch (error) {
      console.error('Error fetching swap history:', error);
    }
    setLoadingHistory(false);
  };

  const saveTradeIdToLocal = (tradeId: string) => {
    const savedTradeIds = JSON.parse(localStorage.getItem('swap_trade_ids') || '[]');
    if (!savedTradeIds.includes(tradeId)) {
      savedTradeIds.unshift(tradeId);
      // Keep only last 50 trades
      localStorage.setItem('swap_trade_ids', JSON.stringify(savedTradeIds.slice(0, 50)));
    }
  };

  // Get active coins based on aggregator
  const getActiveCoins = () => aggregator === 'exolix' ? exolixCoins : coins;

  const getUniqueCoins = () => {
    const activeCoins = getActiveCoins();
    const unique = new Map<string, Coin>();
    activeCoins.forEach(coin => {
      if (!unique.has(coin.ticker)) {
        unique.set(coin.ticker, coin);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
  };

  // Get popular coins with their preferred networks
  const getPriorityCoins = () => {
    const activeCoins = getActiveCoins();
    const results: (Coin & { preferredLabel: string })[] = [];
    
    for (const pc of POPULAR_COINS) {
      // Find exact ticker+network match (case-insensitive)
      const coin = activeCoins.find(c => 
        c.ticker.toLowerCase() === pc.ticker.toLowerCase() && 
        c.network.toLowerCase() === pc.network.toLowerCase()
      );
      
      if (coin) {
        results.push({ ...coin, preferredLabel: pc.label });
      }
    }
    
    return results;
  };

  // Get coins that are not in the popular list
  const getOtherCoins = () => {
    const popularTickers = POPULAR_COINS.map(p => p.ticker.toUpperCase());
    return getUniqueCoins().filter(c => !popularTickers.includes(c.ticker.toUpperCase()));
  };

  const getNetworksForCoin = (ticker: string) => {
    const activeCoins = getActiveCoins();
    return activeCoins.filter(c => c.ticker === ticker);
  };

  const requiresMemo = (ticker: string, network: string) => {
    const activeCoins = getActiveCoins();
    return activeCoins.find(c => c.ticker === ticker && c.network === network)?.memo || false;
  };

  const getSelectedFromCoin = () => {
    const activeCoins = getActiveCoins();
    return activeCoins.find(c => c.ticker === fromCoin && c.network === fromNetwork);
  };

  const handleFromCoinChange = (ticker: string) => {
    setFromCoin(ticker);
    const networks = getNetworksForCoin(ticker);
    
    // Check if this is a popular coin with a preferred network
    const popularCoin = POPULAR_COINS.find(p => p.ticker.toUpperCase() === ticker.toUpperCase());
    if (popularCoin) {
      const preferredNetwork = networks.find(n => n.network.toUpperCase() === popularCoin.network.toUpperCase());
      setFromNetwork(preferredNetwork?.network || (networks.length === 1 ? networks[0].network : ''));
    } else if (networks.length === 1) {
      setFromNetwork(networks[0].network);
    } else {
      setFromNetwork('');
    }
    setRates([]);
    setExolixRate(null);
    setSelectedProvider(null);
    setHasFetchedRates(false);
  };

  const handleToCoinChange = (ticker: string) => {
    setToCoin(ticker);
    const networks = getNetworksForCoin(ticker);
    
    // Check if this is a popular coin with a preferred network
    const popularCoin = POPULAR_COINS.find(p => p.ticker.toUpperCase() === ticker.toUpperCase());
    if (popularCoin) {
      const preferredNetwork = networks.find(n => n.network.toUpperCase() === popularCoin.network.toUpperCase());
      setToNetwork(preferredNetwork?.network || (networks.length === 1 ? networks[0].network : ''));
    } else if (networks.length === 1) {
      setToNetwork(networks[0].network);
    } else {
      setToNetwork('');
    }
    setRates([]);
    setExolixRate(null);
    setSelectedProvider(null);
    setHasFetchedRates(false);
  };

  // Handle aggregator change
  const handleAggregatorChange = (newAggregator: string) => {
    setAggregator(newAggregator as Aggregator);
    // Reset selections when switching aggregators
    setFromCoin('');
    setFromNetwork('');
    setToCoin('');
    setToNetwork('');
    setAmount('');
    setRates([]);
    setExolixRate(null);
    setSelectedProvider(null);
    setHasFetchedRates(false);
    setTrade(null);
  };


  const fetchRates = async () => {
    if (!fromCoin || !fromNetwork || !toCoin || !toNetwork || !amount) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setLoadingRates(true);
    setRates([]);
    setExolixRate(null);
    setSelectedProvider(null);
    setHasFetchedRates(false);

    try {
      if (aggregator === 'exolix') {
        // Exolix API
        const { data, error } = await supabase.functions.invoke('exolix-api', {
          body: {
            action: 'rate',
            coinFrom: fromCoin.toUpperCase(),
            networkFrom: fromNetwork,
            coinTo: toCoin.toUpperCase(),
            networkTo: toNetwork,
            amount: amount,
            rateType: 'float',
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setExolixRate(data);
      } else {
        // Trocador API
        const { data, error } = await supabase.functions.invoke('trocador-new-rate', {
          body: {
            ticker_from: fromCoin,
            network_from: fromNetwork,
            ticker_to: toCoin,
            network_to: toNetwork,
            amount_from: amount,
            min_kycrating: 'C',
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Trocador returns quotes in data.quotes.quotes array
        const quotes = data?.quotes?.quotes || [];
        if (Array.isArray(quotes) && quotes.length > 0) {
          setRates(quotes);
          setSelectedProvider(quotes[0]);
        } else {
          setRates([]);
        }
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast({ title: 'Error', description: 'Failed to fetch rates', variant: 'destructive' });
    }
    setHasFetchedRates(true);
    setLoadingRates(false);
  };

  const executeTrade = async () => {
    if (aggregator === 'trocador' && !selectedProvider) {
      toast({ title: 'Missing fields', description: 'Please select a provider', variant: 'destructive' });
      return;
    }
    
    if (aggregator === 'exolix' && !exolixRate) {
      toast({ title: 'Missing rate', description: 'Please get a rate first', variant: 'destructive' });
      return;
    }

    if (!receiveAddress) {
      toast({ title: 'Missing fields', description: 'Please enter receive address', variant: 'destructive' });
      return;
    }

    if (requiresMemo(toCoin, toNetwork) && !addressMemo) {
      toast({ title: 'Memo required', description: 'This coin requires a memo/tag', variant: 'destructive' });
      return;
    }

    setExecutingTrade(true);
    try {
      if (aggregator === 'exolix') {
        // Exolix trade
        const { data, error } = await supabase.functions.invoke('exolix-api', {
          body: {
            action: 'create_transaction',
            coinFrom: fromCoin.toUpperCase(),
            networkFrom: fromNetwork,
            coinTo: toCoin.toUpperCase(),
            networkTo: toNetwork,
            amount: amount,
            withdrawalAddress: receiveAddress,
            withdrawalExtraId: addressMemo || '',
            refundAddress: refundAddress || '',
            rateType: 'float',
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        const tradeData: TradeResponse = {
          trade_id: data.id,
          address: data.depositAddress,
          address_memo: data.depositExtraId || undefined,
          status: data.status,
          amount_from: String(data.amount),
          amount_to: String(data.amountTo),
        };

        setTrade(tradeData);

        // Save to history
        await supabase.from('swap_history').insert({
          trade_id: data.id,
          from_coin: fromCoin,
          from_network: fromNetwork,
          to_coin: toCoin,
          to_network: toNetwork,
          amount: amount,
          receive_address: receiveAddress,
          provider: 'Exolix',
          provider_address: data.depositAddress,
          provider_memo: data.depositExtraId,
          status: data.status,
          user_id: user?.id || null,
        });

        saveTradeIdToLocal(data.id);
        fetchSwapHistory();
        toast({ title: 'Trade created!', description: `Send ${amount} ${fromCoin.toUpperCase()} to the address shown` });
      } else {
        // Trocador trade
        const { data, error } = await supabase.functions.invoke('trocador-new-trade', {
          body: {
            ticker_from: fromCoin,
            network_from: fromNetwork,
            ticker_to: toCoin,
            network_to: toNetwork,
            amount_from: amount,
            address: receiveAddress,
            address_memo: addressMemo || undefined,
            refund_address: refundAddress || undefined,
            provider: selectedProvider!.provider,
            id: `tm_${Date.now()}`,
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setTrade(data);

        // Save to history
        await supabase.from('swap_history').insert({
          trade_id: data.trade_id,
          from_coin: fromCoin,
          from_network: fromNetwork,
          to_coin: toCoin,
          to_network: toNetwork,
          amount: amount,
          receive_address: receiveAddress,
          provider: selectedProvider!.provider,
          provider_address: data.address,
          provider_memo: data.address_memo,
          status: data.status,
          user_id: user?.id || null,
        });

        // Save trade_id to localStorage for history
        saveTradeIdToLocal(data.trade_id);
        fetchSwapHistory();
        toast({ title: 'Trade created!', description: `Send ${amount} ${fromCoin} to the address shown` });
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({ title: 'Error', description: 'Failed to create trade', variant: 'destructive' });
    }
    setExecutingTrade(false);
  };

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Address copied to clipboard' });
  };

  const uniqueCoins = getUniqueCoins();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${swapsBackground})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Crypto Swaps</h1>
            <p className="text-muted-foreground">Exchange cryptocurrencies privately</p>
          </div>

          {/* Aggregator Selection */}
          <Tabs value={aggregator} onValueChange={handleAggregatorChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
              <TabsTrigger value="trocador">Trocador</TabsTrigger>
              <TabsTrigger value="exolix">Exolix</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Fiat Gateway Banner */}
          <Link to="/cashout" className="block mb-6">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Fiat Gateway</p>
                    <p className="text-sm text-muted-foreground">Buy crypto or cash out via bank, Visa, or Google Pay</p>
                  </div>
                </div>
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          {trade ? (
            /* Trade Created - Show deposit info */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Trade Created
                </CardTitle>
                <CardDescription>Send your {fromCoin} to complete the swap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Trade ID</Label>
                    <p className="font-mono text-sm">{trade.trade_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Send {amount} {fromCoin} to:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-background p-2 rounded text-sm break-all">{trade.address}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyAddress(trade.address)}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {trade.address_memo && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Memo/Tag (REQUIRED)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-background p-2 rounded text-sm">{trade.address_memo}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyAddress(trade.address_memo!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>You receive:</span>
                    <span className="font-semibold">{trade.amount_to} {toCoin}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span>Status:</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          trade.status === 'finished' ? 'default' : 
                          trade.status === 'sending' ? 'default' :
                          trade.status === 'confirming' ? 'secondary' :
                          trade.status === 'failed' || trade.status === 'expired' ? 'destructive' :
                          'outline'
                        }
                        className={trade.status === 'finished' ? 'bg-green-600' : trade.status === 'sending' ? 'bg-blue-600' : ''}
                      >
                        {trade.status}
                      </Badge>
                      {!['finished', 'failed', 'expired', 'halted', 'refunded'].includes(trade.status?.toLowerCase() || '') && (
                        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setTrade(null)}>
                  Create New Swap
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Swap Form */
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Swap Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* From */}
                  <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex gap-2">
                      <CoinSelector
                        value={fromCoin}
                        onValueChange={handleFromCoinChange}
                        priorityCoins={getPriorityCoins()}
                        otherCoins={getOtherCoins()}
                        placeholder="Select coin..."
                        isPrivacyCoin={isPrivacyCoin}
                        selectedNetwork={fromNetwork}
                        allCoins={coins}
                      />
                      {fromCoin && getNetworksForCoin(fromCoin).length > 1 && (
                        <Select value={fromNetwork} onValueChange={setFromNetwork}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Network" />
                          </SelectTrigger>
                          <SelectContent>
                            {getNetworksForCoin(fromCoin).map((c) => (
                              <SelectItem key={c.network} value={c.network}>{c.network}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={fromCoin && fromNetwork && amount && getSelectedFromCoin() && (
                        parseFloat(amount) < getSelectedFromCoin()!.minimum || 
                        parseFloat(amount) > getSelectedFromCoin()!.maximum
                      ) ? 'border-destructive' : ''}
                    />
                    {fromCoin && fromNetwork && getSelectedFromCoin() && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Min: {getSelectedFromCoin()?.minimum} • Max: {getSelectedFromCoin()?.maximum} {fromCoin.toUpperCase()}</span>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-2 text-xs text-primary hover:text-primary"
                              onClick={() => setAmount(String(getSelectedFromCoin()?.minimum))}
                            >
                              Min
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-2 text-xs text-primary hover:text-primary"
                              onClick={() => setAmount(String(getSelectedFromCoin()?.maximum))}
                            >
                              Max
                            </Button>
                          </div>
                        </div>
                        {amount && parseFloat(amount) < getSelectedFromCoin()!.minimum && (
                          <p className="text-xs text-destructive">
                            Amount is below minimum ({getSelectedFromCoin()?.minimum} {fromCoin.toUpperCase()})
                          </p>
                        )}
                        {amount && parseFloat(amount) > getSelectedFromCoin()!.maximum && (
                          <p className="text-xs text-destructive">
                            Amount exceeds maximum ({getSelectedFromCoin()?.maximum} {fromCoin.toUpperCase()})
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-10 w-10 p-0 border border-primary/30 hover:border-primary hover:bg-primary/10"
                      onClick={() => {
                        const tempCoin = fromCoin;
                        const tempNetwork = fromNetwork;
                        setFromCoin(toCoin);
                        setFromNetwork(toNetwork);
                        setToCoin(tempCoin);
                        setToNetwork(tempNetwork);
                        setRates([]);
                        setSelectedProvider(null);
                      }}
                      disabled={!fromCoin || !toCoin}
                    >
                      <ArrowRightLeft className="h-4 w-4 rotate-90 text-primary" />
                    </Button>
                  </div>

                  {/* To */}
                  <div className="space-y-2">
                    <Label>To</Label>
                    <div className="flex gap-2">
                      <CoinSelector
                        value={toCoin}
                        onValueChange={handleToCoinChange}
                        priorityCoins={getPriorityCoins()}
                        otherCoins={getOtherCoins()}
                        placeholder="Select coin..."
                        isPrivacyCoin={isPrivacyCoin}
                        selectedNetwork={toNetwork}
                        allCoins={coins}
                      />
                      {toCoin && getNetworksForCoin(toCoin).length > 1 && (
                        <Select value={toNetwork} onValueChange={setToNetwork}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Network" />
                          </SelectTrigger>
                          <SelectContent>
                            {getNetworksForCoin(toCoin).map((c) => (
                              <SelectItem key={c.network} value={c.network}>{c.network}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {/* Estimated Receive Amount */}
                    {rates.length > 0 && amount && parseFloat(amount) > 0 && (
                      <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Estimated receive (best rate)</p>
                        <p className="text-lg font-semibold text-primary">
                          ~{(() => {
                            const bestRate = rates[0];
                            const originalAmount = parseFloat(bestRate.amount_to);
                            const ratio = originalAmount / parseFloat(amount);
                            const estimated = parseFloat(amount) * ratio;
                            return estimated.toFixed(6);
                          })()} {toCoin.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">via {rates[0].provider}</p>
                      </div>
                    )}
                  </div>

                  {/* Receive Address */}
                  <div className="space-y-2">
                    <Label>Receive Address</Label>
                    <Input
                      placeholder={`Your ${toCoin || 'receiving'} address`}
                      value={receiveAddress}
                      onChange={(e) => setReceiveAddress(e.target.value)}
                    />
                  </div>

                  {/* Memo if required */}
                  {toCoin && toNetwork && requiresMemo(toCoin, toNetwork) && (
                    <div className="space-y-2">
                      <Label>Memo/Tag (Required)</Label>
                      <Input
                        placeholder="Enter memo or destination tag"
                        value={addressMemo}
                        onChange={(e) => setAddressMemo(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Refund Address */}
                  <div className="space-y-2">
                    <Label>Refund Address (Optional)</Label>
                    <Input
                      placeholder={`Your ${fromCoin || 'refund'} address`}
                      value={refundAddress}
                      onChange={(e) => setRefundAddress(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={fetchRates}
                    disabled={
                      loadingRates || 
                      !fromCoin || 
                      !toCoin || 
                      !amount ||
                      (getSelectedFromCoin() && (
                        parseFloat(amount) < getSelectedFromCoin()!.minimum ||
                        parseFloat(amount) > getSelectedFromCoin()!.maximum
                      ))
                    }
                  >
                    {loadingRates ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Getting rates...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Get Exchange Rates
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Rates & Execute */}
              <Card>
                <CardHeader>
                  <CardTitle>{aggregator === 'exolix' ? 'Exchange Rate' : 'Available Providers'}</CardTitle>
                  <CardDescription>
                    {aggregator === 'exolix' 
                      ? (exolixRate ? 'Rate fetched from Exolix' : 'Enter swap details to see rate')
                      : (rates.length > 0 ? `${rates.length} providers found` : 'Enter swap details to see rates')
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aggregator === 'exolix' ? (
                    // Exolix single rate display
                    !exolixRate ? (
                      <div className="text-center text-muted-foreground py-8">
                        <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        {hasFetchedRates ? (
                          <>
                            <p className="font-medium text-foreground">Rate not available</p>
                            <p className="text-sm mt-1">{exolixRate === null && hasFetchedRates ? 'This pair may not be supported.' : 'Enter details to get rate.'}</p>
                          </>
                        ) : (
                          <p>No rate yet</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="p-4 rounded-lg border border-primary bg-primary/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Exolix</span>
                            <Badge variant="outline" className="text-xs">No KYC</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">You receive:</span>
                            <span className="font-semibold text-primary">{exolixRate.toAmount} {toCoin.toUpperCase()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Rate: 1 {fromCoin.toUpperCase()} = {exolixRate.rate.toFixed(6)} {toCoin.toUpperCase()}
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={executeTrade}
                          disabled={!receiveAddress || executingTrade}
                        >
                          {executingTrade ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating trade...</>
                          ) : (
                            <>Execute Swap with Exolix<ExternalLink className="h-4 w-4 ml-2" /></>
                          )}
                        </Button>
                      </>
                    )
                  ) : (
                    // Trocador multi-provider display
                    rates.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        {hasFetchedRates ? (
                          <>
                            <p className="font-medium text-foreground">No providers available</p>
                            <p className="text-sm mt-1">This swap pair is not currently supported. Try a different combination.</p>
                          </>
                        ) : (
                          <p>No rates yet</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {rates.map((rate) => (
                            <div
                              key={rate.provider}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedProvider?.provider === rate.provider
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedProvider(rate)}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{rate.provider}</span>
                                <Badge variant="outline" className="text-xs">KYC: {rate.kycrating}</Badge>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-muted-foreground">You receive:</span>
                                <span className="font-semibold text-primary">{rate.amount_to} {toCoin}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ETA: ~{rate.eta} min • Insurance: {rate.insurance}%
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full"
                          onClick={executeTrade}
                          disabled={!selectedProvider || !receiveAddress || executingTrade}
                        >
                          {executingTrade ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating trade...</>
                          ) : (
                            <>Execute Swap with {selectedProvider?.provider}<ExternalLink className="h-4 w-4 ml-2" /></>
                          )}
                        </Button>
                      </>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Swap History */}
          {swapHistory.length > 0 && (
            <Card className="mt-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Swap History
                  </CardTitle>
                  <CardDescription className="mt-1">Your recent swaps on this device</CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear swap history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all swap history from this device. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          localStorage.removeItem('swap_trade_ids');
                          setSwapHistory([]);
                          toast({ title: 'History cleared', description: 'Your swap history has been removed' });
                        }}
                      >
                        Clear History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {swapHistory.map((swap) => (
                      <div
                        key={swap.id}
                        className="p-3 rounded-lg border border-border bg-secondary/30"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {swap.amount} {swap.from_coin.toUpperCase()}
                            </span>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{swap.to_coin.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={
                                swap.status === 'finished' ? 'default' : 
                                swap.status === 'sending' ? 'default' :
                                swap.status === 'confirming' ? 'secondary' :
                                swap.status === 'failed' || swap.status === 'expired' ? 'destructive' :
                                'outline'
                              }
                              className={`text-xs ${swap.status === 'finished' ? 'bg-green-600' : swap.status === 'sending' ? 'bg-blue-600' : ''}`}
                            >
                              {swap.status || 'waiting'}
                            </Badge>
                            {!['finished', 'failed', 'expired', 'halted', 'refunded', 'paid partially'].includes(swap.status?.toLowerCase() || '') && (
                              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(swap.created_at).toLocaleString()}
                          </span>
                          <span>via {swap.provider}</span>
                        </div>
                        <div className="mt-2 text-xs">
                          <a 
                            href={`https://trocador.app/en/checkout/${swap.trade_id}?ref=mkaShKWUZA`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Track swap <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <div className="mt-8 space-y-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by {aggregator === 'exolix' 
                ? <a href="https://exolix.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Exolix</a>
                : <a href="https://trocador.app/?ref=mkaShKWUZA" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Trocador</a>
              } exchange {aggregator === 'trocador' ? 'aggregator' : ''}</p>
              <p className="mt-1">All swaps are non-custodial and anonymous</p>
            </div>

            {/* Fiat & Support */}
            <Card className="bg-secondary/30">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold mb-1">Need help with a swap?</h3>
                    <p className="text-sm text-muted-foreground">Contact Trocador support directly on Telegram</p>
                  </div>
                  <Button asChild variant="outline">
                    <a href="https://t.me/TrocadorSupportBot" target="_blank" rel="noopener noreferrer">
                      Trocador Support <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Recommendation */}
            <Card className="bg-secondary/30">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg mb-1">Need a Wallet?</h3>
                  <p className="text-sm text-muted-foreground">We recommend Cake Wallet - a privacy-focused multi-currency wallet with built-in exchange</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild variant="outline" size="sm">
                    <a href="https://play.google.com/store/apps/details?id=com.cakewallet.cake_wallet" target="_blank" rel="noopener noreferrer">
                      Android
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://apps.apple.com/app/cake-wallet/id1334702542" target="_blank" rel="noopener noreferrer">
                      iOS / Mac
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://github.com/cake-tech/cake_wallet/releases" target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://cakewallet.com" target="_blank" rel="noopener noreferrer">
                      Official Website
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <SiteAssistant />
    </div>
  );
};

export default Swaps;
