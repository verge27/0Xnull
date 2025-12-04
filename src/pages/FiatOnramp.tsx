import { useState } from 'react';
import { CreditCard, ExternalLink, Wallet, Info, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FIAT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const CRYPTO_OPTIONS = [
  { ticker: 'ETH', network: 'ethereum', name: 'Ethereum', networkName: 'Ethereum' },
  { ticker: 'BTC', network: 'mainnet', name: 'Bitcoin', networkName: 'Mainnet' },
  { ticker: 'USDT', network: 'ethereum', name: 'Tether', networkName: 'Ethereum (ERC20)' },
  { ticker: 'USDT', network: 'tron', name: 'Tether', networkName: 'Tron (TRC20)' },
  { ticker: 'USDC', network: 'ethereum', name: 'USD Coin', networkName: 'Ethereum (ERC20)' },
  { ticker: 'USDC', network: 'polygon', name: 'USD Coin', networkName: 'Polygon' },
  { ticker: 'SOL', network: 'solana', name: 'Solana', networkName: 'Solana' },
  { ticker: 'MATIC', network: 'polygon', name: 'Polygon', networkName: 'Polygon' },
  { ticker: 'BNB', network: 'bsc', name: 'BNB', networkName: 'BNB Chain' },
  { ticker: 'DOGE', network: 'mainnet', name: 'Dogecoin', networkName: 'Mainnet' },
];

const FiatOnramp = () => {
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [fiatAmount, setFiatAmount] = useState('100');
  const [selectedCrypto, setSelectedCrypto] = useState('ETH-ethereum');
  const [walletAddress, setWalletAddress] = useState('');

  const getCryptoDetails = (value: string) => {
    const [ticker, network] = value.split('-');
    return CRYPTO_OPTIONS.find(c => c.ticker === ticker && c.network === network);
  };

  const selectedCryptoDetails = getCryptoDetails(selectedCrypto);

  const openTransak = () => {
    const [cryptoCode, network] = selectedCrypto.split('-');
    
    // Build Transak URL with parameters
    // Using staging environment - replace with production for live
    const baseUrl = 'https://global-stg.transak.com';
    
    const params = new URLSearchParams({
      apiKey: '4fcd6904-706b-4aff-bd9d-77422813bbb7', // Transak staging test key
      environment: 'STAGING',
      defaultCryptoCurrency: cryptoCode,
      network: network,
      defaultFiatCurrency: fiatCurrency,
      defaultFiatAmount: fiatAmount,
      fiatCurrency: fiatCurrency,
      cryptoCurrencyCode: cryptoCode,
      themeColor: 'F97316', // Orange theme
      hideMenu: 'true',
      disableWalletAddressForm: walletAddress ? 'true' : 'false',
    });

    if (walletAddress) {
      params.append('walletAddress', walletAddress);
    }

    const transakUrl = `${baseUrl}?${params.toString()}`;
    window.open(transakUrl, '_blank', 'width=450,height=700');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <CreditCard className="h-10 w-10 text-primary" />
              Buy Crypto
            </h1>
            <p className="text-muted-foreground">Purchase crypto with card or bank transfer via Transak</p>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Fiat to Crypto
              </CardTitle>
              <CardDescription>
                Buy BTC, ETH, USDT, and more with Visa, Mastercard, Apple Pay, or bank transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount & Fiat Currency */}
              <div className="space-y-2">
                <Label>You Pay</Label>
                <div className="flex gap-2">
                  <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIAT_CURRENCIES.map(f => (
                        <SelectItem key={f.code} value={f.code}>
                          {f.symbol} {f.code}
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
                <p className="text-xs text-muted-foreground">Minimum: $20 equivalent</p>
              </div>

              {/* Crypto Selection */}
              <div className="space-y-2">
                <Label>You Receive</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_OPTIONS.map(c => (
                      <SelectItem key={`${c.ticker}-${c.network}`} value={`${c.ticker}-${c.network}`}>
                        {c.ticker} - {c.name} ({c.networkName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label>Your Wallet Address (Optional)</Label>
                <Input
                  placeholder={`Enter your ${selectedCryptoDetails?.ticker || 'crypto'} wallet address`}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to enter in Transak widget, or pre-fill to skip that step
                </p>
              </div>

              {/* Buy Button */}
              <Button 
                className="w-full" 
                size="lg" 
                onClick={openTransak}
                disabled={!fiatAmount || parseFloat(fiatAmount) < 20}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Buy {selectedCryptoDetails?.ticker} with {fiatCurrency}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              {/* Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You'll be redirected to Transak's secure payment page. KYC verification may be required for first-time purchases.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">Secure Payments</h3>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Apple Pay, Google Pay</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">136+ Cryptos</h3>
                <p className="text-xs text-muted-foreground">BTC, ETH, USDT, SOL, and more</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">64+ Countries</h3>
                <p className="text-xs text-muted-foreground">Global coverage with local payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Powered By */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Powered by Transak</span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://transak.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Transak.com
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
