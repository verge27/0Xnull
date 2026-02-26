import { useState, useEffect } from 'react';
import { Loader2, Coins, Crown, Users, Save, TrendingUp, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';

export const DashboardSubscriptionTab = () => {
  const [stats, setStats] = useState({ active_subscribers: 0, total_revenue_xmr: 0, price_xmr: 0 });
  const [priceInput, setPriceInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await creatorApi.getSubscriptionStats();
        setStats(data);
        setPriceInput(data.price_xmr?.toString() || '');
      } catch {
        // No subscription tier set
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setIsSaving(true);
    try {
      await creatorApi.setSubscriptionTier(price);
      toast.success('Subscription tier updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.active_subscribers}</p>
            <p className="text-xs text-muted-foreground">Active Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Coins className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.total_revenue_xmr.toFixed(4)} XMR</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5" />
            Subscription Tier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Monthly Price (XMR)</Label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.02"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              95% payout — creators keep 95% of all earnings. 0.4% platform fee.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Subscription Price
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const DashboardEarningsTab = () => {
  const [earnings, setEarnings] = useState({
    total_tips_xmr: 0,
    total_content_xmr: 0,
    total_subscriptions_xmr: 0,
    pending_xmr: 0,
    disbursed_xmr: 0,
  });
  const [chatEarnings, setChatEarnings] = useState(0);
  const [voiceEarnings, setVoiceEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutAddress, setPayoutAddress] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [paymentData, chatData, voiceData] = await Promise.allSettled([
          creatorApi.getPaymentEarnings(),
          creatorApi.getChatPersona(),
          creatorApi.getMyVoice(),
        ]);
        if (paymentData.status === 'fulfilled') setEarnings(paymentData.value);
        if (chatData.status === 'fulfilled') setChatEarnings(chatData.value.total_earned || 0);
        if (voiceData.status === 'fulfilled') setVoiceEarnings(voiceData.value.total_earned || 0);
      } catch {
        // No earnings data
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalXmr = earnings.total_tips_xmr + earnings.total_content_xmr + earnings.total_subscriptions_xmr;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tips</p>
            <p className="text-lg font-bold font-mono">{earnings.total_tips_xmr.toFixed(4)} XMR</p>
            <p className="text-[10px] text-muted-foreground">100% to creator</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Content Sales</p>
            <p className="text-lg font-bold font-mono">{earnings.total_content_xmr.toFixed(4)} XMR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Subscriptions</p>
            <p className="text-lg font-bold font-mono">{earnings.total_subscriptions_xmr.toFixed(4)} XMR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">AI Chat</p>
            <p className="text-lg font-bold font-mono">${chatEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Voice</p>
            <p className="text-lg font-bold font-mono">${voiceEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total XMR</p>
            <p className="text-lg font-bold font-mono text-primary">{totalXmr.toFixed(4)} XMR</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-mono font-bold">{earnings.pending_xmr.toFixed(4)} XMR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Disbursed</span>
            <span className="font-mono">{earnings.disbursed_xmr.toFixed(4)} XMR</span>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowDownToLine className="w-5 h-5" />
            XMR Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Payout Address</Label>
            <Input
              placeholder="4... or 8... (95 characters)"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <Button disabled={!payoutAddress || earnings.pending_xmr <= 0} className="gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            Withdraw {earnings.pending_xmr.toFixed(4)} XMR
          </Button>
          <p className="text-xs text-muted-foreground">
            No KYC. No bank flags. Private by default.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
