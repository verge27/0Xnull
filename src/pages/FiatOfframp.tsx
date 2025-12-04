import { useState, useEffect } from 'react';
import { ArrowRightLeft, Copy, Check, RefreshCw, ExternalLink, Banknote, CreditCard } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  symbol: string;
  name: string;
  image: string;
  has_extra_id: boolean;
  is_fiat: boolean;
}

interface ExchangeResult {
  id: string;
  address_from: string;
  extra_id_from?: string;
  currency_from: string;
  currency_to: string;
  amount_to_receive: string;
  status: string;
}

const FIAT_CURRENCIES = ['usd', 'eur', 'gbp'];
const POPULAR_CRYPTO = ['usdt', 'btc', 'eth', 'xmr', 'ltc', 'usdc', 'sol', 'bnb'];

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
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fromCrypto, setFromCrypto] = useState('usdt');
  const [toFiat, setToFiat] = useState('usd');
  const [amount, setAmount] = useState('');
  const [refundAddress, setRefundAddress] = useState('');
  
  const [minAmount, setMinAmount] = useState<string | null>(null);
  const [estimatedReceive, setEstimatedReceive] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  
  const [exchange, setExchange] = useState<ExchangeResult | null>(null);
  const [creatingExchange, setCreatingExchange] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (fromCrypto && toFiat) {
      fetchMinAmount();
    }
  }, [fromCrypto, toFiat]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (fromCrypto && toFiat && amount && parseFloat(amount) > 0) {
        fetchEstimate();
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [fromCrypto, toFiat, amount]);

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { action: 'get_all_currencies' },
      });
      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast({ title: 'Error', description: 'Failed to load currencies', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchMinAmount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { action: 'get_min_amount', currency_from: fromCrypto, currency_to: toFiat },
      });
      if (error) throw error;
      setMinAmount(data);
    } catch (error) {
      console.error('Error fetching min amount:', error);
    }
  };

  const fetchEstimate = async () => {
    setLoadingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: { action: 'get_estimated', currency_from: fromCrypto, currency_to: toFiat, amount },
      });
      if (error) throw error;
      setEstimatedReceive(data);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      setEstimatedReceive(null);
    }
    setLoadingQuote(false);
  };

  const createExchange = async () => {
    if (!amount || !refundAddress) {
      toast({ title: 'Missing fields', description: 'Please enter amount and refund address', variant: 'destructive' });
      return;
    }

    if (minAmount && parseFloat(amount) < parseFloat(minAmount)) {
      toast({ title: 'Amount too low', description: `Minimum is ${minAmount} ${fromCrypto.toUpperCase()}`, variant: 'destructive' });
      return;
    }

    setCreatingExchange(true);
    try {
      const { data, error } = await supabase.functions.invoke('simpleswap-api', {
        body: {
          action: 'create_exchange',
          currency_from: fromCrypto,
          currency_to: toFiat,
          amount,
          address_to: 'FIAT_PAYOUT', // SimpleSwap handles this via redirect
          user_refund_address: refundAddress,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setExchange({
        id: data.id,
        address_from: data.address_from,
        extra_id_from: data.extra_id_from,
        currency_from: data.currency_from,
        currency_to: data.currency_to,
        amount_to_receive: data.amount_to || estimatedReceive || '~',
        status: data.status,
      });

      toast({ title: 'Exchange created!', description: 'Send your crypto to the address shown' });
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
      setExchange(prev => prev ? { ...prev, status: data.status, amount_to_receive: data.amount_to || prev.amount_to_receive } : null);
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

  const cryptoCurrencies = currencies.filter(c => !c.is_fiat && POPULAR_CRYPTO.includes(c.symbol.toLowerCase()));
  const fiatCurrencies = currencies.filter(c => c.is_fiat && FIAT_CURRENCIES.includes(c.symbol.toLowerCase()));
  
  // Fallback if API doesn't return fiat
  const displayFiats = fiatCurrencies.length > 0 ? fiatCurrencies : FIAT_CURRENCIES.map(f => ({ symbol: f, name: f.toUpperCase(), image: '', has_extra_id: false, is_fiat: true }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Banknote className="h-10 w-10 text-primary" />
              Cash Out
            </h1>
            <p className="text-muted-foreground">Convert crypto to fiat via SimpleSwap</p>
          </div>

          {exchange ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Exchange Created
                </CardTitle>
                <CardDescription>Send your {exchange.currency_from.toUpperCase()} to complete the exchange</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Exchange ID</Label>
                    <p className="font-mono text-sm">{exchange.id}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Send {amount} {exchange.currency_from.toUpperCase()} to:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-background p-2 rounded text-sm break-all">{exchange.address_from}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyAddress(exchange.address_from)}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

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
                  <Button className="flex-1" onClick={() => setExchange(null)}>
                    New Exchange
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  SimpleSwap will redirect you to enter your bank/card details for fiat payout
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Crypto to Fiat
                </CardTitle>
                <CardDescription>Receive via bank transfer, Visa, Mastercard, or Google Pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* From Crypto */}
                <div className="space-y-2">
                  <Label>You Send</Label>
                  <div className="flex gap-2">
                    <Select value={fromCrypto} onValueChange={setFromCrypto}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_CRYPTO.map(symbol => {
                          const c = cryptoCurrencies.find(cc => cc.symbol.toLowerCase() === symbol);
                          return (
                            <SelectItem key={symbol} value={symbol}>
                              <span className="flex items-center gap-2">
                                {c?.image && <img src={c.image} alt="" className="w-4 h-4" />}
                                {symbol.toUpperCase()}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  {minAmount && (
                    <p className="text-xs text-muted-foreground">Min: {minAmount} {fromCrypto.toUpperCase()}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                {/* To Fiat */}
                <div className="space-y-2">
                  <Label>You Receive</Label>
                  <div className="flex gap-2">
                    <Select value={toFiat} onValueChange={setToFiat}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {displayFiats.map(f => (
                          <SelectItem key={f.symbol} value={f.symbol.toLowerCase()}>
                            {f.symbol.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1 bg-secondary/50 rounded-md px-3 py-2 flex items-center">
                      {loadingQuote ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : estimatedReceive ? (
                        <span className="text-lg font-semibold text-primary">~{parseFloat(estimatedReceive).toFixed(2)} {toFiat.toUpperCase()}</span>
                      ) : (
                        <span className="text-muted-foreground">Enter amount</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Refund Address */}
                <div className="space-y-2">
                  <Label>Refund Address ({fromCrypto.toUpperCase()})</Label>
                  <Input
                    placeholder={`Your ${fromCrypto.toUpperCase()} address for refunds`}
                    value={refundAddress}
                    onChange={(e) => setRefundAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">In case the exchange fails, funds will be returned here</p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={createExchange}
                  disabled={creatingExchange || !amount || !refundAddress}
                >
                  {creatingExchange ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash Out
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>• Payout methods: Bank transfer, Visa, Mastercard, Google Pay (varies by country)</p>
                  <p>• Fixed 0.4% commission on fiat conversion</p>
                  <p>• SimpleSwap handles KYC/payout collection via secure redirect</p>
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
