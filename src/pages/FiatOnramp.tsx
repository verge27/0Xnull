import { useState } from 'react';
import { CreditCard, ExternalLink, Wallet, Info, CheckCircle, ArrowRightLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FIAT_CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
];

const CRYPTO_OPTIONS = [
  { ticker: 'eth', network: 'ethereum', name: 'Ethereum', networkName: 'Ethereum' },
  { ticker: 'btc', network: 'bitcoin', name: 'Bitcoin', networkName: 'Bitcoin' },
  { ticker: 'usdt', network: 'ethereum', name: 'Tether', networkName: 'Ethereum (ERC20)' },
  { ticker: 'usdt', network: 'tron', name: 'Tether', networkName: 'Tron (TRC20)' },
  { ticker: 'usdc', network: 'ethereum', name: 'USD Coin', networkName: 'Ethereum (ERC20)' },
  { ticker: 'usdc', network: 'polygon', name: 'USD Coin', networkName: 'Polygon' },
  { ticker: 'sol', network: 'solana', name: 'Solana', networkName: 'Solana' },
  { ticker: 'matic', network: 'polygon', name: 'Polygon', networkName: 'Polygon' },
  { ticker: 'bnb', network: 'bsc', name: 'BNB', networkName: 'BNB Chain' },
  { ticker: 'doge', network: 'dogecoin', name: 'Dogecoin', networkName: 'Dogecoin' },
];

const FiatOnramp = () => {
  useSEO();
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [fiatCurrency, setFiatCurrency] = useState('usd');
  const [fiatAmount, setFiatAmount] = useState('100');
  const [selectedCrypto, setSelectedCrypto] = useState('eth-ethereum');
  const [walletAddress, setWalletAddress] = useState('');

  const getCryptoDetails = (value: string) => {
    const [ticker, network] = value.split('-');
    return CRYPTO_OPTIONS.find(c => c.ticker === ticker && c.network === network);
  };

  const selectedCryptoDetails = getCryptoDetails(selectedCrypto);

  const openOnramper = () => {
    const [cryptoCode, network] = selectedCrypto.split('-');
    
    // Build Onramper URL with parameters
    const baseUrl = 'https://buy.onramper.com';
    
    const params = new URLSearchParams({
      apiKey: 'pk_prod_01HETEQF46GSK6BS5JWKDF31BT', // Onramper demo key
      mode: mode,
      defaultCrypto: cryptoCode,
      defaultFiat: fiatCurrency,
      defaultAmount: fiatAmount,
      themeName: 'dark',
      primaryColor: 'F97316', // Orange theme
    });

    // Add network-specific wallet if provided
    if (walletAddress) {
      params.append('networkWallets', `${network}:${walletAddress}`);
    }

    const onramperUrl = `${baseUrl}?${params.toString()}`;
    window.open(onramperUrl, '_blank', 'width=450,height=700');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <CreditCard className="h-10 w-10 text-primary" />
              {mode === 'buy' ? 'Buy Crypto' : 'Sell Crypto'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'buy' 
                ? 'Purchase crypto with card or bank transfer' 
                : 'Convert crypto to fiat currency'}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'buy' | 'sell')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Buy Crypto
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Sell Crypto
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {mode === 'buy' ? 'Fiat to Crypto' : 'Crypto to Fiat'}
              </CardTitle>
              <CardDescription>
                {mode === 'buy' 
                  ? 'Best rates from 30+ providers including Stripe, Revolut, MoonPay'
                  : 'Cash out your crypto to bank account or card'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount & Fiat Currency */}
              <div className="space-y-2">
                <Label>{mode === 'buy' ? 'You Pay' : 'You Receive'}</Label>
                <div className="flex gap-2">
                  <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIAT_CURRENCIES.map(f => (
                        <SelectItem key={f.code} value={f.code}>
                          {f.symbol} {f.code.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={fiatAmount}
                    onChange={(e) => setFiatAmount(e.target.value)}
                    className="flex-1"
                    min="20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum varies by provider (~$20)</p>
              </div>

              {/* Crypto Selection */}
              <div className="space-y-2">
                <Label>{mode === 'buy' ? 'You Receive' : 'You Send'}</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_OPTIONS.map(c => (
                      <SelectItem key={`${c.ticker}-${c.network}`} value={`${c.ticker}-${c.network}`}>
                        {c.ticker.toUpperCase()} - {c.name} ({c.networkName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label>Your Wallet Address (Optional)</Label>
                <Input
                  placeholder={`Enter your ${selectedCryptoDetails?.ticker.toUpperCase() || 'crypto'} wallet address`}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {mode === 'buy' 
                    ? 'Leave empty to enter in widget, or pre-fill to skip that step'
                    : 'Address to send crypto from (you\'ll confirm in widget)'}
                </p>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full" 
                size="lg" 
                onClick={openOnramper}
                disabled={!fiatAmount || parseFloat(fiatAmount) < 10}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {mode === 'buy' 
                  ? `Buy ${selectedCryptoDetails?.ticker.toUpperCase()} with ${fiatCurrency.toUpperCase()}`
                  : `Sell ${selectedCryptoDetails?.ticker.toUpperCase()} for ${fiatCurrency.toUpperCase()}`}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              {/* Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Onramper aggregates 30+ providers to find you the best rates. KYC may be required on first purchase.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Providers Section */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Supported Providers</h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {['MoonPay', 'Transak', 'Ramp', 'Stripe', 'Revolut', 'Coinbase', 'Banxa', 'Mercuryo', 'Simplex'].map(provider => (
                  <span key={provider} className="bg-secondary/50 px-2 py-1 rounded">
                    {provider}
                  </span>
                ))}
                <span className="bg-secondary/50 px-2 py-1 rounded">+20 more</span>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">Best Rates</h3>
                <p className="text-xs text-muted-foreground">Compares 30+ providers in real-time</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">800+ Cryptos</h3>
                <p className="text-xs text-muted-foreground">BTC, ETH, USDT, SOL, and more</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">130+ Payment Methods</h3>
                <p className="text-xs text-muted-foreground">Cards, bank transfer, Apple Pay</p>
              </CardContent>
            </Card>
          </div>

          {/* Powered By */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Powered by Onramper</span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://onramper.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Onramper.com
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

export default FiatOnramp;
