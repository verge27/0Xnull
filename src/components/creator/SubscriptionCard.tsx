import { useState } from 'react';
import { Crown, Check, Lock, Loader2, Copy, Clock } from 'lucide-react';
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

interface SubscriptionCardProps {
  creator: CreatorProfile;
  isSubscribed?: boolean;
  subscriptionPrice?: number; // Monthly price in XMR
  onSubscribe?: () => void;
}

const SUBSCRIPTION_BENEFITS = [
  'Full access to all paid content',
  'Exclusive posts and updates',
  'Direct messaging with creator',
  'Early access to new content',
  'Support your favorite creator',
];

export const SubscriptionCard = ({ 
  creator, 
  isSubscribed = false,
  subscriptionPrice = 0.5, // Default 0.5 XMR/month
  onSubscribe,
}: SubscriptionCardProps) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock payment address - in production this would come from the API
  const paymentAddress = '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H';

  const handleSubscribe = async () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      setIsPaymentOpen(true);
    }
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPayment = async () => {
    setIsProcessing(true);
    // Simulate payment check
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  if (isSubscribed) {
    return (
      <Card className="border-[#FF6600]/30 bg-[#FF6600]/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#FF6600]">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Subscribed</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            You have full access to all content
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
          {/* Price */}
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-[#FF6600]">
              {subscriptionPrice} XMR
            </p>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>

          {/* Benefits */}
          <ul className="space-y-2">
            {SUBSCRIPTION_BENEFITS.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-[#FF6600] shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Subscribe button */}
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Payments in Monero (XMR) only.
          </p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#FF6600]" />
              Subscribe to {creator.display_name}
            </DialogTitle>
            <DialogDescription>
              Send exactly {subscriptionPrice} XMR to subscribe for 1 month
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={`monero:${paymentAddress}?tx_amount=${subscriptionPrice}`}
                size={200}
                level="M"
              />
            </div>

            {/* Amount */}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-[#FF6600]">
                  {subscriptionPrice} XMR
                </p>
                <Badge variant="secondary" className="mt-2">1 Month</Badge>
              </CardContent>
            </Card>

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
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expiry */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              This address is valid for 30 minutes
            </p>

            {/* Check Payment Button */}
            <Button
              onClick={checkPayment}
              disabled={isProcessing}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Payment Status'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
