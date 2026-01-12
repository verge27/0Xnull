import { useState } from 'react';
import { Crown, Check, Loader2, Copy, Clock, Star, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreatorProfile } from '@/services/creatorApi';
import { SubscriptionTier, TIER_COLORS, getCreatorTiers } from '@/hooks/useSubscriptionTiers';
import { triggerCreatorNotification } from '@/hooks/useCreatorNotifications';
import { toast } from 'sonner';

interface SubscriptionCardProps {
  creator: CreatorProfile;
  isSubscribed?: boolean;
  currentTier?: string | null; // ID of current subscription tier
  subscriptionPrice?: number; // Fallback for legacy single-tier
  onSubscribe?: (tierId: string) => void;
}

const getTierIcon = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'vip':
      return <Sparkles className="w-4 h-4" />;
    case 'premium':
      return <Star className="w-4 h-4" />;
    default:
      return <Crown className="w-4 h-4" />;
  }
};

export const SubscriptionCard = ({ 
  creator, 
  isSubscribed = false,
  currentTier = null,
  subscriptionPrice = 0.02,
  onSubscribe,
}: SubscriptionCardProps) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get creator's tier configuration
  const tiersConfig = getCreatorTiers(creator.id);
  const { tiers, enableTiers } = tiersConfig;

  // Mock payment address
  const paymentAddress = '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H';

  const handleSelectTier = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setIsPaymentOpen(true);
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPayment = async () => {
    if (!selectedTier) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);

    // Trigger notification for creator
    triggerCreatorNotification(
      creator.id,
      'new_subscriber',
      'New Subscriber! 🎉',
      `Someone subscribed to your ${selectedTier.name} tier for ${selectedTier.priceXmr} XMR/month`,
      { tier: selectedTier.id, amount: selectedTier.priceXmr }
    );

    toast.success(`Subscribed to ${selectedTier.name} tier!`);
    onSubscribe?.(selectedTier.id);
    setIsPaymentOpen(false);
    setSelectedTier(null);
  };

  // Show subscribed state
  if (isSubscribed && currentTier) {
    const activeTier = tiers.find(t => t.id === currentTier);
    const colors = activeTier ? TIER_COLORS[activeTier.color] : TIER_COLORS.orange;
    
    return (
      <Card className={`${colors.border} ${colors.bg}`}>
        <CardContent className="p-4">
          <div className={`flex items-center gap-2 ${colors.text}`}>
            {activeTier && getTierIcon(activeTier.name)}
            <span className="font-semibold">{activeTier?.name || 'Subscribed'}</span>
            <Badge variant="secondary" className="ml-auto">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            You have full access to {activeTier?.name.toLowerCase() || 'subscriber'} content
          </p>
        </CardContent>
      </Card>
    );
  }

  // Legacy single-tier display
  if (!enableTiers || tiers.length === 0) {
    return (
      <Card className="border-[#FF6600]/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-[#FF6600]/20 to-[#FF6600]/5 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#FF6600]" />
            Subscribe
          </CardTitle>
          <CardDescription>
            Get full access to {creator.display_name}'s content
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-[#FF6600]">{subscriptionPrice} XMR</p>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
          <Button 
            onClick={() => handleSelectTier({
              id: 'default',
              name: 'Subscription',
              priceXmr: subscriptionPrice,
              benefits: ['Full access to all paid content'],
              color: 'orange',
            })}
            className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Multi-tier display
  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-[#FF6600]" />
            Subscribe to {creator.display_name}
          </CardTitle>
          <CardDescription>Choose a tier that works for you</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {tiers.map((tier) => {
            const colors = TIER_COLORS[tier.color] || TIER_COLORS.orange;
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-lg border ${colors.border} overflow-hidden transition-all hover:scale-[1.01] cursor-pointer`}
                onClick={() => handleSelectTier(tier)}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className={`absolute top-0 right-0 ${colors.bg} ${colors.text} text-xs font-medium px-2 py-0.5 rounded-bl-lg`}>
                    {tier.badge}
                  </div>
                )}
                
                <div className={`p-4 bg-gradient-to-r ${colors.gradient}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={colors.text}>{getTierIcon(tier.name)}</span>
                      <span className="font-semibold">{tier.name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${colors.text}`}>{tier.priceXmr} XMR</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  
                  {/* Benefits preview */}
                  <ul className="space-y-1 mt-3">
                    {tier.benefits.slice(0, 3).map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className={`w-3 h-3 ${colors.text} shrink-0 mt-0.5`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {tier.benefits.length > 3 && (
                      <li className="text-xs text-muted-foreground pl-5">
                        +{tier.benefits.length - 3} more benefits
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            Cancel anytime. Payments in Monero (XMR) only.
          </p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTier && getTierIcon(selectedTier.name)}
              <span className={selectedTier ? TIER_COLORS[selectedTier.color]?.text : ''}>
                {selectedTier?.name} Subscription
              </span>
            </DialogTitle>
            <DialogDescription>
              Subscribe to {creator.display_name} for {selectedTier?.priceXmr} XMR/month
            </DialogDescription>
          </DialogHeader>
          
          {selectedTier && (
            <div className="space-y-4">
              {/* Benefits */}
              <Card className={`${TIER_COLORS[selectedTier.color]?.bg} ${TIER_COLORS[selectedTier.color]?.border}`}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">What you'll get:</p>
                  <ul className="space-y-1.5">
                    {selectedTier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 ${TIER_COLORS[selectedTier.color]?.text} shrink-0 mt-0.5`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={`monero:${paymentAddress}?tx_amount=${selectedTier.priceXmr}`}
                  size={180}
                  level="M"
                />
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pay exactly</p>
                <p className={`text-2xl font-bold ${TIER_COLORS[selectedTier.color]?.text}`}>
                  {selectedTier.priceXmr} XMR
                </p>
                <Badge variant="secondary" className="mt-1">1 Month</Badge>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                    {paymentAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Address valid for 30 minutes
              </p>

              <Button
                onClick={checkPayment}
                disabled={isProcessing}
                className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking Payment...
                  </>
                ) : (
                  'Check Payment Status'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
