import { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, Copy, ExternalLink, Check, Star, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Priority coins for sorting - XMR first, then major liquid coins
const PRIORITY_COINS = ['XMR', 'BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'SOL', 'DOGE', 'TRX', 'BNB'];
const PRIVACY_COINS = ['XMR', 'ZEC', 'DASH'];

const isPriorityCoin = (ticker: string) => PRIORITY_COINS.includes(ticker.toUpperCase());
const isPrivacyCoin = (ticker: string) => PRIVACY_COINS.includes(ticker.toUpperCase());

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
  min: string;
  max: string;
  kycrating: string;
  payment: boolean;
  eta: number;
}

interface TradeResponse {
  trade_id: string;
  address: string;
  address_memo?: string;
  status: string;
  amount_from: string;
  amount_to: string;
}

const popularPairs = [
  { from: 'XMR', to: 'BTC', label: 'XMR → BTC' },
  { from: 'BTC', to: 'XMR', label: 'BTC → XMR' },
  { from: 'ETH', to: 'XMR', label: 'ETH → XMR' },
  { from: 'USDT', to: 'XMR', label: 'USDT → XMR' },
  { from: 'LTC', to: 'XMR', label: 'LTC → XMR' },
];

const Swaps = () => {
  const { toast } = useToast();
  const [coins, setCoins] = useState<Coin[]>([]);
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
  const [selectedProvider, setSelectedProvider] = useState<RateProvider | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [trade, setTrade] = useState<TradeResponse | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    const { data, error } = await supabase.from('coins').select('*').order('ticker');
    if (error) {
      console.error('Error fetching coins:', error);
      toast({ title: 'Error', description: 'Failed to load coins', variant: 'destructive' });
    } else {
      setCoins(data || []);
    }
    setLoading(false);
  };

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

  const getUniqueCoins = () => {
    const unique = new Map<string, Coin>();
    coins.forEach(coin => {
      if (!unique.has(coin.ticker)) {
        unique.set(coin.ticker, coin);
      }
    });
    
    // Sort: Priority coins first (by their order in PRIORITY_COINS), then alphabetical
    return Array.from(unique.values()).sort((a, b) => {
      const aPriority = PRIORITY_COINS.indexOf(a.ticker.toUpperCase());
      const bPriority = PRIORITY_COINS.indexOf(b.ticker.toUpperCase());
      
      // Both are priority coins - sort by priority order
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      // Only a is priority - a comes first
      if (aPriority !== -1) return -1;
      // Only b is priority - b comes first
      if (bPriority !== -1) return 1;
      // Neither is priority - alphabetical
      return a.ticker.localeCompare(b.ticker);
    });
  };

  const getPriorityCoins = () => getUniqueCoins().filter(c => isPriorityCoin(c.ticker));
  const getOtherCoins = () => getUniqueCoins().filter(c => !isPriorityCoin(c.ticker));

  const getNetworksForCoin = (ticker: string) => {
    return coins.filter(c => c.ticker === ticker);
  };

  const requiresMemo = (ticker: string, network: string) => {
    return coins.find(c => c.ticker === ticker && c.network === network)?.memo || false;
  };

  const handleFromCoinChange = (ticker: string) => {
    setFromCoin(ticker);
    const networks = getNetworksForCoin(ticker);
    if (networks.length === 1) {
      setFromNetwork(networks[0].network);
    } else {
      setFromNetwork('');
    }
    setRates([]);
    setSelectedProvider(null);
  };

  const handleToCoinChange = (ticker: string) => {
    setToCoin(ticker);
    const networks = getNetworksForCoin(ticker);
    if (networks.length === 1) {
      setToNetwork(networks[0].network);
    } else {
      setToNetwork('');
    }
    setRates([]);
    setSelectedProvider(null);
  };

  const handleQuickPair = (from: string, to: string) => {
    handleFromCoinChange(from);
    setTimeout(() => handleToCoinChange(to), 100);
  };

  const fetchRates = async () => {
    if (!fromCoin || !fromNetwork || !toCoin || !toNetwork || !amount) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setLoadingRates(true);
    setRates([]);
    setSelectedProvider(null);

    try {
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

      if (Array.isArray(data)) {
        setRates(data);
        if (data.length > 0) {
          setSelectedProvider(data[0]);
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast({ title: 'Error', description: 'Failed to fetch rates', variant: 'destructive' });
    }
    setLoadingRates(false);
  };

  const executeTrade = async () => {
    if (!selectedProvider || !receiveAddress) {
      toast({ title: 'Missing fields', description: 'Please select a provider and enter receive address', variant: 'destructive' });
      return;
    }

    if (requiresMemo(toCoin, toNetwork) && !addressMemo) {
      toast({ title: 'Memo required', description: 'This coin requires a memo/tag', variant: 'destructive' });
      return;
    }

    setExecutingTrade(true);
    try {
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
          provider: selectedProvider.provider,
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
        provider: selectedProvider.provider,
        provider_address: data.address,
        provider_memo: data.address_memo,
        status: data.status,
      });

      toast({ title: 'Trade created!', description: `Send ${amount} ${fromCoin} to the address shown` });
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Crypto Swaps</h1>
            <p className="text-muted-foreground">Exchange cryptocurrencies privately via Trocador aggregator</p>
          </div>

          {/* Quick Pairs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {popularPairs.map((pair) => (
              <Button
                key={pair.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPair(pair.from, pair.to)}
              >
                {pair.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={syncCoins} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Sync Coins
            </Button>
          </div>

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
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <Badge variant="outline">{trade.status}</Badge>
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
                      <Select value={fromCoin} onValueChange={handleFromCoinChange}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select coin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <SelectGroup>
                            <SelectLabel className="flex items-center gap-1 text-primary">
                              <Star className="h-3 w-3" /> Popular
                            </SelectLabel>
                            {getPriorityCoins().map((coin) => (
                              <SelectItem key={coin.ticker} value={coin.ticker}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{coin.ticker}</span>
                                  <span className="text-muted-foreground text-xs">{coin.name}</span>
                                  {isPrivacyCoin(coin.ticker) && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Privacy</Badge>
                                  )}
                                  {coin.ticker === 'XMR' && (
                                    <Zap className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel className="text-muted-foreground">Other Coins</SelectLabel>
                            {getOtherCoins().map((coin) => (
                              <SelectItem key={coin.ticker} value={coin.ticker}>
                                <span>{coin.ticker} - {coin.name}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
                    />
                  </div>

                  {/* To */}
                  <div className="space-y-2">
                    <Label>To</Label>
                    <div className="flex gap-2">
                      <Select value={toCoin} onValueChange={handleToCoinChange}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select coin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <SelectGroup>
                            <SelectLabel className="flex items-center gap-1 text-primary">
                              <Star className="h-3 w-3" /> Popular
                            </SelectLabel>
                            {getPriorityCoins().map((coin) => (
                              <SelectItem key={coin.ticker} value={coin.ticker}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{coin.ticker}</span>
                                  <span className="text-muted-foreground text-xs">{coin.name}</span>
                                  {isPrivacyCoin(coin.ticker) && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Privacy</Badge>
                                  )}
                                  {coin.ticker === 'XMR' && (
                                    <Zap className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel className="text-muted-foreground">Other Coins</SelectLabel>
                            {getOtherCoins().map((coin) => (
                              <SelectItem key={coin.ticker} value={coin.ticker}>
                                <span>{coin.ticker} - {coin.name}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
                    disabled={loadingRates || !fromCoin || !toCoin || !amount}
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
                  <CardTitle>Available Providers</CardTitle>
                  <CardDescription>
                    {rates.length > 0 ? `${rates.length} providers found` : 'Enter swap details to see rates'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rates.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No rates yet</p>
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
                              <Badge variant="outline" className="text-xs">
                                KYC: {rate.kycrating}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-muted-foreground">You receive:</span>
                              <span className="font-semibold text-primary">{rate.amount_to} {toCoin}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ETA: ~{rate.eta} min • Min: {rate.min} • Max: {rate.max}
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
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Creating trade...
                          </>
                        ) : (
                          <>
                            Execute Swap with {selectedProvider?.provider}
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Powered by <a href="https://trocador.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Trocador</a> exchange aggregator</p>
            <p className="mt-1">All swaps are non-custodial and anonymous</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Swaps;
