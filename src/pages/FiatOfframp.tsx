import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ExternalLink, Banknote, ArrowDownUp } from 'lucide-react';
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

interface ExchangeResult {
  id: string;
  address_from: string;
  extra_id_from?: string;
  currency_from: string;
  currency_to: string;
  amount_to_receive: string;
  status: string;
}

const FIAT_CURRENCIES = [
  { ticker: 'usd', label: 'USD', network: 'usd' },
  { ticker: 'eur', label: 'EUR', network: 'eur' },
  { ticker: 'gbp', label: 'GBP', network: 'gbp' },
];

const POPULAR_CRYPTO = [
  { ticker: 'usdt', network: 'eth', label: 'USDT (ETH)' },
  { ticker: 'usdt', network: 'tron', label: 'USDT (TRC20)' },
  { ticker: 'btc', network: 'btc', label: 'BTC' },
  { ticker: 'eth', network: 'eth', label: 'ETH' },
  { ticker: 'ltc', network: 'ltc', label: 'LTC' },
  { ticker: 'usdc', network: 'eth', label: 'USDC (ETH)' },
  { ticker: 'sol', network: 'solana', label: 'SOL' },
  { ticker: 'bnb', network: 'bsc', label: 'BNB (BSC)' },
  { ticker: 'xmr', network: 'xmr', label: 'XMR' },
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
  
  const [selectedCrypto, setSelectedCrypto] = useState('usdt-eth');
  const [toFiat, setToFiat] = useState('usd');
  const [amount, setAmount] = useState('');
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
    const { ticker, network } = getSelectedCryptoDetails(selectedCrypto);
    const fiat = FIAT_CURRENCIES.find(f => f.ticker === toFiat);
    return { fromTicker: ticker, fromNetwork: network, toTicker: toFiat, toNetwork: fiat?.network || '' };
  };

  useEffect(() => {
    const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
    if (fromTicker && toTicker) {
      fetchRange(fromTicker, fromNetwork, toTicker, toNetwork);
    }
  }, [selectedCrypto, toFiat]);

  useEffect(() => {
    const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
    const amtNum = parseFloat(amount);
    const minNum = minAmount ? parseFloat(minAmount) : 0;
    const maxNum = maxAmount ? parseFloat(maxAmount) : Infinity;
    
    if (amount && amtNum > 0 && amtNum >= minNum && amtNum <= maxNum) {
      fetchEstimate(fromTicker, fromNetwork, toTicker, toNetwork, amount);
    } else {
      setEstimatedReceive(null);
    }
  }, [amount, selectedCrypto, toFiat, minAmount, maxAmount]);

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
      
      if (data?.result) {
        setMinAmount(data.result.min);
        setMaxAmount(data.result.max);
      } else if (data?.min) {
        setMinAmount(data.min);
        setMaxAmount(data.max || null);
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
          amount: parseFloat(amt),
        },
      });
      if (error) throw error;
      
      if (data?.result?.estimatedAmount) {
        setEstimatedReceive(data.result.estimatedAmount);
      } else if (data?.result && typeof data.result === 'string') {
        setEstimatedReceive(data.result);
      } else if (typeof data === 'string' || typeof data === 'number') {
        setEstimatedReceive(String(data));
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
      setEstimatedReceive(null);
    }
    setLoadingQuote(false);
  };

  const createExchange = async () => {
    const { fromTicker, fromNetwork, toTicker, toNetwork } = getCurrentPair();
    
    if (!refundAddress) {
      toast({ title: 'Refund address required', variant: 'destructive' });
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
          amount: parseFloat(amount),
          address_to: 'fiat_payout',
          user_refund_address: refundAddress,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setExchange({
        id: data.id,
        address_from: data.addressFrom || data.address_from,
        extra_id_from: data.extraIdFrom || data.extra_id_from,
        currency_from: fromTicker,
        currency_to: toTicker,
        amount_to_receive: data.amountTo || data.amount_to || estimatedReceive || '0',
        status: data.status || 'waiting',
      });
      
      toast({ title: 'Exchange created!', description: 'Send crypto to the provided address' });
    } catch (error) {
      console.error('Error creating exchange:', error);
      toast({ title: 'Failed to create exchange', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
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
                <CardDescription>
                  Send your {exchange.currency_from.toUpperCase()} to complete the exchange
                </CardDescription>
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
                  <Button className="flex-1" onClick={resetExchange}>
                    New Exchange
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Crypto to Fiat
                </CardTitle>
                <CardDescription>
                  Receive USD, EUR, or GBP via bank transfer or card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* You Send */}
                <div className="space-y-2">
                  <Label>You Send</Label>
                  <div className="flex gap-2">
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
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  {minAmount && (
                    <p className={`text-xs ${amount && (parseFloat(amount) < parseFloat(minAmount) || (maxAmount && parseFloat(amount) > parseFloat(maxAmount))) ? 'text-destructive' : 'text-muted-foreground'}`}>
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
                    <div className="flex-1 bg-secondary/50 rounded-md px-3 py-2 flex items-center">
                      {loadingQuote ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : estimatedReceive ? (
                        <span className="text-lg font-semibold text-primary">
                          ~{parseFloat(estimatedReceive).toFixed(2)} {toTicker.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Enter amount</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Refund Address */}
                <div className="space-y-2">
                  <Label>Refund Address ({fromTicker.toUpperCase()})</Label>
                  <Input
                    placeholder={`Your ${fromTicker.toUpperCase()} address for refunds`}
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
                  <a href="https://simpleswap.io/?ref=9996a1ef14d0" target="_blank" rel="noopener noreferrer">
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
