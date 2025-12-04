import { useState, useEffect } from 'react';
import { ArrowRightLeft, Copy, Check, RefreshCw, ExternalLink, Banknote, CreditCard, ArrowDownUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeResult {
  id: string;
  address_from: string;
  extra_id_from?: string;
  currency_from: string;
  currency_to: string;
  amount_to_receive: string;
  status: string;
  redirect_url?: string;
}

const FIAT_CURRENCIES = [
  { ticker: 'usd', label: 'USD', network: '' },
  { ticker: 'eur', label: 'EUR', network: '' },
  { ticker: 'gbp', label: 'GBP', network: '' },
];

const POPULAR_CRYPTO = [
  { ticker: 'usdt', network: 'erc20', label: 'USDT (ERC20)' },
  { ticker: 'usdt', network: 'trc20', label: 'USDT (TRC20)' },
  { ticker: 'btc', network: 'mainnet', label: 'BTC' },
  { ticker: 'eth', network: 'mainnet', label: 'ETH' },
  { ticker: 'ltc', network: 'mainnet', label: 'LTC' },
  { ticker: 'usdc', network: 'erc20', label: 'USDC (ERC20)' },
  { ticker: 'sol', network: 'mainnet', label: 'SOL' },
  { ticker: 'bnb', network: 'bsc', label: 'BNB (BSC)' },
  { ticker: 'xmr', network: 'mainnet', label: 'XMR' },
];

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  exchanging: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sending: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  finished: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  refunded: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const FiatOfframp = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  
  // Sell mode: crypto → fiat
  const [selectedCrypto, setSelectedCrypto] = useState('usdt-erc20');
  const [toFiat, setToFiat] = useState('usd');
  
  // Buy mode: fiat → crypto
  const [fromFiat, setFromFiat] = useState('usd');
  const [toCrypto, setToCrypto] = useState('btc-mainnet');
  
  const [amount, setAmount] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [refundAddress, setRefundAddress] = useState('');
  
  const [minAmount, setMinAmount] = useState<string | null>(null);
  const [maxAmount, setMaxAmount] = useState<string | null>(null);
  const [estimatedReceive, setEstimatedReceive] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  
  const [exchange, setExchange] = useState<ExchangeResult | null>(null);
  const [creatingExchange, setCreatingExchange] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const getSelectedCryptoDetails = (value: string) => {
    const [ticker, network] = value.split('-');
    return { ticker, network };
  };

  const getCurrentPair = () => {
    if (mode === 'sell') {
      const { ticker, network } = getSelectedCryptoDetails(selectedCrypto);
      const fiat = FIAT_CURRENCIES.find(f => f.ticker === toFiat);
      return { fromTicker: ticker, fromNetwork: network, toTicker: toFiat, toNetwork: fiat?.network || '' };
    } else {
      const { ticker, network } = getSelectedCryptoDetails(toCrypto);
      const fiat = FIAT_CURRENCIES.find(f => f.ticker === fromFiat);
      return { fromTicker: fromFiat, fromNetwork: fiat?.network || '', toTicker: ticker, toNetwork: network };
    }
  };

  useEffect(() => {
    const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
    if (fromTicker && toTicker) {
      fetchRange(fromTicker, fromNetwork, toTicker, toNetwork);
    }
    setEstimatedReceive(null);
  }, [mode, selectedCrypto, toFiat, fromFiat, toCrypto]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
      if (fromTicker && toTicker && amount && parseFloat(amount) > 0) {
        fetchEstimate(fromTicker, fromNetwork, toTicker, toNetwork, amount);
      } else {
        setEstimatedReceive(null);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [mode, selectedCrypto, toFiat, fromFiat, toCrypto, amount]);

  const fetchRange = async (fromTicker: string, fromNetwork: string, toTicker: string, toNetwork: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { 
          action: 'get_min_amount', 
          currency_from: fromTicker, 
          network_from: fromNetwork,
          currency_to: toTicker,
          network_to: toNetwork,
        },
      });
      if (error) throw error;
      
      if (data && typeof data === 'object') {
        setMinAmount(data.min?.toString() || null);
        setMaxAmount(data.max?.toString() || null);
      } else if (typeof data === 'string' || typeof data === 'number') {
        setMinAmount(data.toString());
        setMaxAmount(null);
      }
    } catch (error) {
      console.error('Error fetching range:', error);
      setMinAmount(null);
      setMaxAmount(null);
    }
  };

  const fetchEstimate = async (fromTicker: string, fromNetwork: string, toTicker: string, toNetwork: string, amt: string) => {
    setLoadingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { 
          action: 'get_estimated', 
          currency_from: fromTicker, 
          network_from: fromNetwork,
          currency_to: toTicker,
          network_to: toNetwork,
          amount: amt,
        },
      });
      if (error) throw error;
      
      if (data && typeof data === 'object' && data.estimated) {
        setEstimatedReceive(data.estimated.toString());
      } else if (typeof data === 'string' || typeof data === 'number') {
        setEstimatedReceive(data.toString());
      } else {
        setEstimatedReceive(null);
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
      setEstimatedReceive(null);
    }
    setLoadingQuote(false);
  };

  const createExchange = async () => {
    const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
    
    if (!amount) {
      toast({ title: 'Missing amount', description: 'Please enter an amount', variant: 'destructive' });
      return;
    }

    // Buy mode needs receive address, Sell mode needs refund address
    if (mode === 'buy' && !receiveAddress) {
      toast({ title: 'Missing address', description: 'Please enter your crypto receive address', variant: 'destructive' });
      return;
    }
    if (mode === 'sell' && !refundAddress) {
      toast({ title: 'Missing address', description: 'Please enter your refund address', variant: 'destructive' });
      return;
    }

    if (minAmount && parseFloat(amount) < parseFloat(minAmount)) {
      toast({ title: 'Amount too low', description: `Minimum is ${minAmount} ${fromTicker.toUpperCase()}`, variant: 'destructive' });
      return;
    }

    setCreatingExchange(true);
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: {
          action: 'create_exchange',
          currency_from: fromTicker,
          network_from: fromNetwork,
          currency_to: toTicker,
          network_to: toNetwork,
          amount,
          address_to: mode === 'buy' ? receiveAddress : 'FIAT_PAYOUT',
          user_refund_address: mode === 'sell' ? refundAddress : receiveAddress,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setExchange({
        id: data.id || data.publicId,
        address_from: data.addressFrom || data.address_from,
        extra_id_from: data.extraIdFrom || data.extra_id_from,
        currency_from: data.currencyFrom || fromTicker,
        currency_to: data.currencyTo || toTicker,
        amount_to_receive: data.amountTo || data.amount_to || estimatedReceive || '~',
        status: data.status || 'waiting',
        redirect_url: data.redirectUrl || data.redirect_url,
      });

      toast({ title: 'Exchange created!', description: mode === 'sell' ? 'Send your crypto to the address shown' : 'Complete payment to receive crypto' });
    } catch (error: any) {
      console.error('Error creating exchange:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create exchange', variant: 'destructive' });
    }
    setCreatingExchange(false);
  };

  const checkStatus = async () => {
    if (!exchange) return;
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { action: 'get_exchange', id: exchange.id },
      });
      if (error) throw error;
      setExchange(prev => prev ? { 
        ...prev, 
        status: data.status, 
        amount_to_receive: data.amountTo || data.amount_to || prev.amount_to_receive 
      } : null);
    } catch (error) {
      console.error('Error checking status:', error);
    }
    setCheckingStatus(false);
  };

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Address copied to clipboard' });
  };

  const resetExchange = () => {
    setExchange(null);
    setAmount('');
    setReceiveAddress('');
    setRefundAddress('');
  };

  const { fromTicker, toTicker } = getCurrentPair();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Banknote className="h-10 w-10 text-primary" />
              Fiat Gateway
            </h1>
            <p className="text-muted-foreground">Buy crypto or cash out via SimpleSwap</p>
          </div>

          {exchange ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Exchange Created
                </CardTitle>
                <CardDescription>
                  {mode === 'sell' 
                    ? `Send your ${exchange.currency_from.toUpperCase()} to complete the exchange`
                    : `Complete payment to receive ${exchange.currency_to.toUpperCase()}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Exchange ID</Label>
                    <p className="font-mono text-sm">{exchange.id}</p>
                  </div>
                  
                  {mode === 'sell' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Send {amount} {exchange.currency_from.toUpperCase()} to:</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-background p-2 rounded text-sm break-all">{exchange.address_from}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyAddress(exchange.address_from)}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {mode === 'buy' && exchange.redirect_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Complete Payment</Label>
                      <Button className="w-full mt-2" asChild>
                        <a href={exchange.redirect_url} target="_blank" rel="noopener noreferrer">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay with Card / Bank
                        </a>
                      </Button>
                    </div>
                  )}

                  {exchange.extra_id_from && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Memo/Tag (REQUIRED)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-background p-2 rounded text-sm">{exchange.extra_id_from}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyAddress(exchange.extra_id_from!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>You receive:</span>
                    <span className="font-semibold">~{exchange.amount_to_receive} {exchange.currency_to.toUpperCase()}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span>Status:</span>
                    <Badge className={STATUS_COLORS[exchange.status] || 'bg-muted'}>
                      {exchange.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={checkStatus} disabled={checkingStatus}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                    Check Status
                  </Button>
                  <Button className="flex-1" onClick={resetExchange}>
                    New Exchange
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <Tabs value={mode} onValueChange={(v) => { setMode(v as 'sell' | 'buy'); setAmount(''); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sell" className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash Out
                    </TabsTrigger>
                    <TabsTrigger value="buy" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Buy Crypto
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* You Send */}
                <div className="space-y-2">
                  <Label>You Send</Label>
                  <div className="flex gap-2">
                    {mode === 'sell' ? (
                      <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_CRYPTO.map(c => (
                            <SelectItem key={`${c.ticker}-${c.network}`} value={`${c.ticker}-${c.network}`}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={fromFiat} onValueChange={setFromFiat}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIAT_CURRENCIES.map(f => (
                            <SelectItem key={f.ticker} value={f.ticker}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  {minAmount && (
                    <p className="text-xs text-muted-foreground">
                      Min: {minAmount} {fromTicker.toUpperCase()}
                      {maxAmount && ` • Max: ${maxAmount} ${fromTicker.toUpperCase()}`}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <ArrowDownUp className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* You Receive */}
                <div className="space-y-2">
                  <Label>You Receive</Label>
                  <div className="flex gap-2">
                    {mode === 'sell' ? (
                      <Select value={toFiat} onValueChange={setToFiat}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIAT_CURRENCIES.map(f => (
                            <SelectItem key={f.ticker} value={f.ticker}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={toCrypto} onValueChange={setToCrypto}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_CRYPTO.map(c => (
                            <SelectItem key={`${c.ticker}-${c.network}`} value={`${c.ticker}-${c.network}`}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex-1 bg-secondary/50 rounded-md px-3 py-2 flex items-center">
                      {loadingQuote ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : estimatedReceive ? (
                        <span className="text-lg font-semibold text-primary">
                          ~{mode === 'sell' ? parseFloat(estimatedReceive).toFixed(2) : parseFloat(estimatedReceive).toFixed(6)} {toTicker.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Enter amount</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address fields */}
                {mode === 'buy' && (
                  <div className="space-y-2">
                    <Label>Receive Address ({toTicker.toUpperCase()})</Label>
                    <Input
                      placeholder={`Your ${toTicker.toUpperCase()} wallet address`}
                      value={receiveAddress}
                      onChange={(e) => setReceiveAddress(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Where you'll receive your crypto</p>
                  </div>
                )}

                {mode === 'sell' && (
                  <div className="space-y-2">
                    <Label>Refund Address ({fromTicker.toUpperCase()})</Label>
                    <Input
                      placeholder={`Your ${fromTicker.toUpperCase()} address for refunds`}
                      value={refundAddress}
                      onChange={(e) => setRefundAddress(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">In case the exchange fails, funds will be returned here</p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={createExchange}
                  disabled={creatingExchange || !amount || (mode === 'buy' ? !receiveAddress : !refundAddress)}
                >
                  {creatingExchange ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : mode === 'sell' ? (
                    <>
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash Out
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Crypto
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>• Payout methods: Bank transfer, Visa, Mastercard, Google Pay (varies by country)</p>
                  <p>• Fixed 0.4% commission on fiat conversion</p>
                  <p>• SimpleSwap handles KYC/payment collection via secure redirect</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Powered by SimpleSwap</span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://simpleswap.io" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    SimpleSwap.io
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FiatOfframp;
