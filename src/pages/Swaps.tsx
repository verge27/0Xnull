import { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, Copy, ExternalLink, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoinSelector } from '@/components/CoinSelector';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [hasFetchedRates, setHasFetchedRates] = useState(false);

  useEffect(() => {
    fetchCoins();
  }, []);

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
      .limit(2000);
    
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
    return Array.from(unique.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
  };

  // Get popular coins with their preferred networks
  const getPriorityCoins = () => {
    const results: (Coin & { preferredLabel: string })[] = [];
    
    for (const pc of POPULAR_COINS) {
      // Find exact ticker+network match (case-insensitive)
      const coin = coins.find(c => 
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
    return coins.filter(c => c.ticker === ticker);
  };

  const requiresMemo = (ticker: string, network: string) => {
    return coins.find(c => c.ticker === ticker && c.network === network)?.memo || false;
  };

  const getSelectedFromCoin = () => {
    return coins.find(c => c.ticker === fromCoin && c.network === fromNetwork);
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
    setSelectedProvider(null);
    setHasFetchedRates(false);
  };


  const fetchRates = async () => {
    if (!fromCoin || !fromNetwork || !toCoin || !toNetwork || !amount) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setLoadingRates(true);
    setRates([]);
    setSelectedProvider(null);
    setHasFetchedRates(false);

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
    setHasFetchedRates(true);
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 px-2 text-xs text-primary hover:text-primary"
                            onClick={() => setAmount(String(getSelectedFromCoin()?.minimum))}
                          >
                            Use Min
                          </Button>
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
                  <CardTitle>Available Providers</CardTitle>
                  <CardDescription>
                    {rates.length > 0 ? `${rates.length} providers found` : 'Enter swap details to see rates'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rates.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      {hasFetchedRates ? (
                        <>
                          <p className="font-medium text-foreground">No providers available</p>
                          <p className="text-sm mt-1">This swap pair is not currently supported by any exchange providers. Try a different coin or network combination.</p>
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
          <div className="mt-8 space-y-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by <a href="https://trocador.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Trocador</a> exchange aggregator</p>
              <p className="mt-1">All swaps are non-custodial and anonymous</p>
            </div>

            {/* Fiat & Support */}
            <Card className="bg-secondary/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold mb-1">Need to buy crypto with fiat?</h3>
                    <p className="text-sm text-muted-foreground">Use Trocador's buy/sell feature to onramp with card or bank transfer</p>
                  </div>
                  <Button asChild variant="outline">
                    <a href="https://trocador.app/?ref=mkaShKWUZA" target="_blank" rel="noopener noreferrer">
                      Buy/Sell Crypto <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
                
                <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
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
    </div>
  );
};

export default Swaps;
