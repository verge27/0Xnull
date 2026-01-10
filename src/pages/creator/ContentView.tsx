import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Unlock, Loader2, ArrowLeft, Eye, Clock, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { creatorApi, ContentItem, UnlockResponse } from '@/services/creatorApi';
import { useToken } from '@/hooks/useToken';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const ContentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useToken();
  
  const [content, setContent] = useState<(ContentItem & { is_unlocked: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment flow
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<UnlockResponse | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await creatorApi.getContent(id);
      setContent(data);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Content not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleUnlock = async () => {
    if (!token) {
      console.warn('[ContentView] Missing token - redirecting to /ai');
      navigate('/ai');
      return;
    }

    if (!id) return;

    try {
      const payment = await creatorApi.unlockContent(id, token);
      setPaymentInfo(payment);
      setPaymentMessage(null);
      setIsPaymentOpen(true);
    } catch (err) {
      console.error('Failed to start unlock:', err);
      setPaymentMessage(err instanceof Error ? err.message : 'Failed to start unlock');
    }
  };

  const checkPaymentStatus = async () => {
    if (!id || !token) return;

    setIsCheckingPayment(true);
    try {
      const { unlocked } = await creatorApi.checkUnlockStatus(id, token);
      if (unlocked) {
        console.log('[ContentView] Payment confirmed - content unlocked');
        setPaymentMessage('Payment confirmed! Content unlocked.');
        setIsPaymentOpen(false);
        fetchContent(); // Refresh to show unlocked content
      } else {
        setPaymentMessage('Payment not yet received. Keep waiting...');
      }
    } catch (err) {
      console.error('Failed to check payment:', err);
      setPaymentMessage('Failed to check payment status');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const copyAddress = async () => {
    if (!paymentInfo) return;
    await navigator.clipboard.writeText(paymentInfo.payment_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setPaymentMessage('Address copied.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/creators')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Creators
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLocked = content.tier === 'paid' && !content.is_unlocked;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Content Display */}
        <div className="relative rounded-lg overflow-hidden bg-muted mb-6">
          {isLocked ? (
            // Locked state - blurred preview
            <div className="relative aspect-video">
              {content.thumbnail_url && (
                <img
                  src={creatorApi.getMediaUrl(content.thumbnail_url)}
                  alt={content.title}
                  className="w-full h-full object-cover blur-2xl scale-110"
                />
              )}
              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center">
                <Lock className="w-12 h-12 mb-4 text-[#FF6600]" />
                <p className="text-lg font-medium mb-2">This content is locked</p>
                <Badge className="bg-[#FF6600] text-white text-lg px-4 py-1 mb-4">
                  {content.price_xmr} XMR
                </Badge>
                <Button
                  onClick={handleUnlock}
                  className="bg-[#FF6600] hover:bg-[#FF6600]/90"
                  size="lg"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Now
                </Button>
              </div>
            </div>
          ) : (
            // Unlocked or free - show full content
            <div className="aspect-video">
              {content.media_hash ? (
                content.media_hash.endsWith('.mp4') || content.media_hash.endsWith('.webm') ? (
                  <video
                    src={creatorApi.getMediaUrl(content.media_hash)}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={creatorApi.getMediaUrl(content.media_hash)}
                    alt={content.title}
                    className="w-full h-full object-contain bg-black"
                  />
                )
              ) : content.thumbnail_url ? (
                <img
                  src={creatorApi.getMediaUrl(content.thumbnail_url)}
                  alt={content.title}
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{content.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {content.view_count} views
                </span>
                <Badge variant={content.tier === 'paid' ? 'default' : 'secondary'}>
                  {content.tier === 'paid' ? `${content.price_xmr} XMR` : 'Free'}
                </Badge>
              </div>
            </div>
          </div>

          {content.description && (
            <p className="text-muted-foreground">{content.description}</p>
          )}

          <Link
            to={`/creator/${content.creator_id}`}
            className="inline-block text-[#FF6600] hover:underline"
          >
            View Creator Profile →
          </Link>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FF6600]" />
              Unlock Content
            </DialogTitle>
            <DialogDescription>
              Send exactly {paymentInfo?.amount_xmr} XMR to unlock this content
            </DialogDescription>
          </DialogHeader>
          
          {paymentInfo && (
            <div className="space-y-4">
              {paymentMessage && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {paymentMessage}
                </div>
              )}

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={`monero:${paymentInfo.payment_address}?tx_amount=${paymentInfo.amount_xmr}`}
                  size={200}
                  level="M"
                />
              </div>

              {/* Amount */}
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-[#FF6600]">
                    {paymentInfo.amount_xmr} XMR
                  </p>
                </CardContent>
              </Card>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                    {paymentInfo.payment_address}
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
                Payment address expires at {new Date(paymentInfo.expires_at).toLocaleTimeString()}
              </p>

              {/* Check Payment Button */}
              <Button
                onClick={checkPaymentStatus}
                disabled={isCheckingPayment}
                className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Payment Status'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentView;
