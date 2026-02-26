import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Crown, Wallet, ArrowDownToLine, Loader2, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToken } from '@/hooks/useToken';
import { creatorApi, SubscriptionItem } from '@/services/creatorApi';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const FanDashboard = () => {
  const navigate = useNavigate();
  const { token, balance, hasToken, refreshBalance } = useToken();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    if (!token) return;
    setIsLoadingSubs(true);
    try {
      const data = await creatorApi.getMySubscriptions(token);
      setSubscriptions(data.subscriptions || []);
    } catch {
      // No subscriptions
    } finally {
      setIsLoadingSubs(false);
    }
  }, [token]);

  useEffect(() => {
    if (hasToken) {
      loadSubscriptions();
    }
  }, [hasToken, loadSubscriptions]);

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount || !token) return;
    setIsWithdrawing(true);
    try {
      // Use the proxy for withdrawal
      const proxyUrl = `https://qjkojiamexufuxsrupjq.supabase.co/functions/v1/xnull-proxy?path=${encodeURIComponent('/api/token/withdraw')}`;
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, address: withdrawAddress, amount_usd: parseFloat(withdrawAmount) }),
      });
      if (!response.ok) throw new Error('Withdrawal failed');
      toast.success('Withdrawal initiated');
      setWithdrawAddress('');
      setWithdrawAmount('');
      refreshBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <Key className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Fan Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            You need a 0xNull token to access your dashboard.
          </p>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Go to Token Dashboard
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Fan Dashboard</h1>

        {/* Balance Card */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Token Balance</p>
              <p className="text-3xl font-bold text-primary">${balance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {token ? `${token.slice(0, 12)}…${token.slice(-6)}` : ''}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <Wallet className="w-4 h-4 mr-2" />
              Top Up
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="subscriptions">
          <TabsList className="w-full">
            <TabsTrigger value="subscriptions" className="flex-1">
              <Crown className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="mt-4">
            {isLoadingSubs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Active Subscriptions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse creators and subscribe to unlock their content.
                  </p>
                  <Button onClick={() => navigate('/creators')} variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Browse Creators
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <Card key={sub.creator_id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{sub.creator_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {new Date(sub.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{sub.price_xmr.toFixed(4)} XMR/mo</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/creator/${sub.creator_id}`)}
                          className="mt-1"
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdraw" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Withdraw to XMR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>XMR Address</Label>
                  <Input
                    placeholder="4... or 8... (95 characters)"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: ${balance.toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={!withdrawAddress || !withdrawAmount || isWithdrawing}
                  className="w-full"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Withdraw
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No KYC. No bank flags. Private by default.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default FanDashboard;
