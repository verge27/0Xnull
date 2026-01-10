import { useState } from 'react';
import { 
  Package, 
  Lock, 
  Loader2, 
  Copy, 
  Check, 
  Clock,
  Eye,
  Sparkles
} from 'lucide-react';
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
import { ContentItem, CreatorProfile, creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';

export interface ContentBundle {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  items: ContentItem[];
  original_price_xmr: number;
  bundle_price_xmr: number;
  discount_percent: number;
}

interface ContentBundleCardProps {
  bundle: ContentBundle;
  creator: CreatorProfile;
  isPurchased?: boolean;
  onPurchase?: () => void;
}

export const ContentBundleCard = ({ 
  bundle, 
  creator, 
  isPurchased = false,
  onPurchase 
}: ContentBundleCardProps) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock payment address
  const paymentAddress = '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H';

  const handlePurchase = () => {
    setIsPaymentOpen(true);
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    toast.success('Bundle purchased! 🎉');
    setIsPaymentOpen(false);
    onPurchase?.();
  };

  return (
    <>
      <Card className="overflow-hidden hover:border-[#FF6600]/30 transition-colors">
        {/* Cover Image / Preview Grid */}
        <div className="relative aspect-video bg-muted">
          {bundle.cover_image ? (
            <img
              src={creatorApi.getMediaUrl(bundle.cover_image)}
              alt={bundle.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
              {bundle.items.slice(0, 4).map((item, i) => (
                <div key={item.id} className="relative overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={creatorApi.getMediaUrl(item.thumbnail_url)}
                      alt=""
                      className={`w-full h-full object-cover ${!isPurchased ? 'blur-sm' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Eye className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  {i === 3 && bundle.items.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold">+{bundle.items.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Bundle badge */}
          <Badge className="absolute top-3 left-3 bg-[#FF6600] text-white gap-1">
            <Package className="w-3 h-3" />
            Bundle
          </Badge>

          {/* Discount badge */}
          <Badge className="absolute top-3 right-3 bg-green-600 text-white">
            {bundle.discount_percent}% OFF
          </Badge>

          {/* Locked overlay */}
          {!isPurchased && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#FF6600]" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{bundle.title}</CardTitle>
          {bundle.description && (
            <CardDescription className="line-clamp-2">
              {bundle.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Items count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{bundle.items.length} items included</span>
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#FF6600]">
              {bundle.bundle_price_xmr} XMR
            </span>
            <span className="text-lg text-muted-foreground line-through">
              {bundle.original_price_xmr} XMR
            </span>
          </div>

          {/* Purchase button */}
          {isPurchased ? (
            <Button className="w-full" variant="outline" disabled>
              <Check className="w-4 h-4 mr-2" />
              Purchased
            </Button>
          ) : (
            <Button 
              onClick={handlePurchase}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Bundle
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF6600]" />
              Purchase Bundle
            </DialogTitle>
            <DialogDescription>
              Get {bundle.items.length} items for {bundle.bundle_price_xmr} XMR ({bundle.discount_percent}% off!)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Bundle summary */}
            <Card className="bg-[#FF6600]/5 border-[#FF6600]/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">{bundle.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{bundle.items.length} items</span>
                  <div className="text-right">
                    <p className="font-bold text-[#FF6600]">{bundle.bundle_price_xmr} XMR</p>
                    <p className="text-xs text-muted-foreground line-through">
                      {bundle.original_price_xmr} XMR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={`monero:${paymentAddress}?tx_amount=${bundle.bundle_price_xmr}`}
                size={180}
                level="M"
              />
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
              Address valid for 30 minutes
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
                'Check Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
