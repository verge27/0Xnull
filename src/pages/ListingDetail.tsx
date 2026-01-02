import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { getListing, DEMO_USERS } from '@/lib/data';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ShoppingCart, ArrowLeft, Package, Shield, MessageCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { SellerCard } from '@/components/SellerCard';
import { ImageGallery } from '@/components/ImageGallery';
import { startConversation } from '@/hooks/useMessages';
import { createOrder } from '@/hooks/useOrders';
import { Listing } from '@/lib/types';
import { findCategoryBySlug } from '@/lib/categories';
import { usePGP } from '@/hooks/usePGP';
import { PGPRequiredDialog } from '@/components/PGPRequiredDialog';
import { PGPPassphraseDialog } from '@/components/PGPPassphraseDialog';
import { PaymentMethodSelector, PaymentMethod } from '@/components/PaymentMethodSelector';
import { useProductSEO } from '@/hooks/useSEO';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const { usdToXmr } = useExchangeRate();
  const { checkHasKeys, getRecipientPublicKey, encryptMessage, isUnlocked, restoreSession } = usePGP();
  
  const [listing, setListing] = useState<(Listing & { isDbListing?: boolean; secondaryCategory?: string | null; tertiaryCategory?: string | null }) | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('direct_xmr');
  
  // PGP state
  const [pgpDialogType, setPgpDialogType] = useState<'buyer_missing' | 'seller_missing' | 'buyer_locked' | null>(null);
  const [showPgpPassphraseDialog, setShowPgpPassphraseDialog] = useState(false);
  const [sellerHasPGP, setSellerHasPGP] = useState<boolean | null>(null);
  const [pendingBuyAction, setPendingBuyAction] = useState(false);

  const isAuthenticated = !!user || !!privateKeyUser;

  // Fetch listing from Supabase first, then fallback to demo
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setLoadingListing(true);
      
      // Try Supabase first
      const { data: dbListing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (dbListing && !error) {
        setListing({
          id: dbListing.id,
          sellerId: dbListing.seller_id,
          title: dbListing.title,
          description: dbListing.description,
          priceUsd: dbListing.price_usd,
          category: dbListing.category,
          secondaryCategory: dbListing.secondary_category,
          tertiaryCategory: dbListing.tertiary_category,
          images: dbListing.images?.length > 0 ? dbListing.images : ['/placeholder.svg'],
          stock: dbListing.stock,
          shippingPriceUsd: dbListing.shipping_price_usd,
          status: dbListing.status as 'active' | 'sold_out' | 'draft',
          condition: dbListing.condition as 'new' | 'used' | 'digital',
          createdAt: dbListing.created_at,
          isDbListing: true
        });
        
        // Increment view count for DB listings (fire and forget)
        (async () => {
          try {
            await supabase.rpc('increment_listing_views', { listing_id: id });
          } catch (e) {
            console.error('Failed to increment views:', e);
          }
        })();
      } else {
        // Fallback to demo listings
        const demoListing = getListing(id);
        setListing(demoListing || null);
      }
      
      setLoadingListing(false);
    };
    
    fetchListing();
  }, [id]);

  // Restore PGP session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Check seller PGP status when listing loads
  useEffect(() => {
    const checkSellerPGP = async () => {
      if (!listing) return;
      
      // For DB listings, check if seller has PGP
      if (listing.isDbListing && listing.sellerId) {
        const { data } = await supabase
          .from('profiles')
          .select('pgp_public_key')
          .eq('id', listing.sellerId)
          .maybeSingle();
        setSellerHasPGP(!!data?.pgp_public_key);
      } else {
        // Demo sellers - assume they have PGP for testing
        setSellerHasPGP(true);
      }
    };
    checkSellerPGP();
  }, [listing]);

  const seller = listing ? DEMO_USERS.find(u => u.id === listing.sellerId) : null;

  // SEO for product schema
  useProductSEO(listing ? {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    priceUsd: listing.priceUsd,
    images: listing.images,
    category: listing.category,
    condition: listing.condition,
    stock: listing.stock,
    sellerName: seller?.displayName,
  } : null);

  if (loadingListing) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Link to="/browse">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Please sign in to contact seller');
      navigate('/auth');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    const conversationId = await startConversation(
      listing.id,
      listing.sellerId,
      user.id,
      message.trim()
    );
    setLoading(false);

    if (conversationId) {
      toast.success('Message sent!');
      setShowContactDialog(false);
      setMessage('');
      navigate(`/messages/${conversationId}`);
    } else {
      toast.error('Failed to send message');
    }
  };

  // Handle the Buy Now button click - check PGP requirements first
  const handleBuyNowClick = async () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      navigate('/auth');
      return;
    }

    // Check buyer PGP keys
    const buyerHasKeys = await checkHasKeys();
    if (!buyerHasKeys) {
      setPgpDialogType('buyer_missing');
      return;
    }

    // Check seller PGP keys (for DB listings)
    if (listing?.isDbListing && sellerHasPGP === false) {
      setPgpDialogType('seller_missing');
      return;
    }

    // If buyer keys are locked, prompt for unlock
    if (!isUnlocked) {
      setPendingBuyAction(true);
      setShowPgpPassphraseDialog(true);
      return;
    }

    // All checks passed, show buy dialog
    setShowBuyDialog(true);
  };

  // Handle PGP unlock success
  const handlePgpUnlocked = () => {
    setShowPgpPassphraseDialog(false);
    if (pendingBuyAction) {
      setPendingBuyAction(false);
      setShowBuyDialog(true);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !listing) {
      toast.error('Please sign in to make a purchase');
      navigate('/auth');
      return;
    }

    if (listing.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Encrypt shipping address with seller's public key (MANDATORY)
      let encryptedAddress: string;
      
      const sellerPublicKey = await getRecipientPublicKey(listing.sellerId, undefined);
      if (!sellerPublicKey) {
        toast.error('Seller has not set up PGP encryption. Cannot place order.');
        setLoading(false);
        return;
      }
      
      const encrypted = await encryptMessage(shippingAddress.trim(), sellerPublicKey);
      if (!encrypted) {
        toast.error('Failed to encrypt shipping address');
        setLoading(false);
        return;
      }
      encryptedAddress = encrypted;

      // Step 2: Auto-start conversation with order context
      let conversationId: string | null = null;
      try {
        const orderMessage = `📦 New Order Placed!\n\nItem: ${listing.title}\nQuantity: ${quantity}\nTotal: $${totalPrice.toFixed(2)} (≈ ${usdToXmr(totalPrice).toFixed(6)} XMR)\n\nShipping address has been encrypted and attached to the order.`;
        
        conversationId = await startConversation(
          listing.id,
          listing.sellerId,
          user.id,
          orderMessage
        );
      } catch (e) {
        console.error('Failed to create conversation:', e);
        // Continue with order creation even if conversation fails
      }

      // Step 3: Create order with encrypted address and conversation link
      const orderId = await createOrder({
        listingId: listing.id,
        sellerId: listing.sellerId,
        isSellerPrivateKey: false,
        quantity,
        unitPrice: listing.priceUsd,
        shippingPrice: listing.shippingPriceUsd,
        encryptedShippingAddress: encryptedAddress,
        conversationId: conversationId || undefined,
      });

      if (orderId) {
        toast.success('Order created! Redirecting to checkout...');
        setShowBuyDialog(false);
        navigate(`/checkout/${orderId}`);
      } else {
        toast.error('Failed to create order');
      }
    } catch (e) {
      console.error('Buy flow error:', e);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = (listing.priceUsd * quantity) + listing.shippingPriceUsd;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/browse')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <ImageGallery images={listing.images} title={listing.title} />
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge>{findCategoryBySlug(listing.category)?.name || listing.category}</Badge>
                  {listing.secondaryCategory && (
                    <Badge variant="secondary">{findCategoryBySlug(listing.secondaryCategory)?.name || listing.secondaryCategory}</Badge>
                  )}
                  {listing.tertiaryCategory && (
                    <Badge variant="secondary">{findCategoryBySlug(listing.tertiaryCategory)?.name || listing.tertiaryCategory}</Badge>
                  )}
                  {!listing.isDbListing && <Badge variant="outline">Demo Listing</Badge>}
                </div>
                <h1 className="text-4xl font-bold mb-2">{listing.title}</h1>
              </div>
            </div>

            <div className="mb-6">
              <PriceDisplay 
                usdAmount={listing.priceUsd} 
                className="text-4xl font-bold text-primary block mb-2"
              />
              {listing.shippingPriceUsd > 0 && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <PriceDisplay usdAmount={listing.shippingPriceUsd} /> shipping
                </div>
              )}
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Seller Card */}
            {seller && (
              <div className="mb-6">
                <h2 className="font-semibold mb-3">Seller</h2>
                <SellerCard seller={seller} />
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <Badge variant={listing.stock > 0 ? 'default' : 'destructive'} className="text-base py-2 px-4">
                {listing.stock > 0 ? `${listing.stock} in stock` : 'Sold Out'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2 text-lg"
                  onClick={handleBuyNowClick}
                  disabled={listing.stock < 1}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please sign in to contact seller');
                      navigate('/auth');
                      return;
                    }
                    setShowContactDialog(true);
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-foreground mb-1">End-to-End Encrypted</div>
                    <div className="text-muted-foreground">
                      Your shipping address is PGP-encrypted so only the seller can read it. Pay via XMR, crypto, or any method you negotiate with the seller (including bank transfer).
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Send a message to {seller?.displayName || 'the seller'} about "{listing.title}"
              </p>
              <Textarea
                placeholder="Hi, I'm interested in this item..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactSeller} disabled={loading || !message.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Now Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {listing.images[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-muted-foreground">
                  ${listing.priceUsd.toFixed(2)} each
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <Input
                type="number"
                min={1}
                max={listing.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(listing.stock, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Shipping Address
                <span className="text-xs text-muted-foreground">(will be PGP encrypted)</span>
              </label>
              <Textarea
                placeholder="Enter your shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
              />
            </div>

            {/* Payment Method Selector */}
            <PaymentMethodSelector
              selected={paymentMethod}
              onChange={setPaymentMethod}
              totalXmr={usdToXmr(totalPrice)}
            />

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                <span>${(listing.priceUsd * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>${listing.shippingPriceUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ {usdToXmr(totalPrice).toFixed(6)} XMR
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuyNow} disabled={loading || !shippingAddress.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Place Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PGP Required Dialog */}
      <PGPRequiredDialog
        open={pgpDialogType !== null}
        onOpenChange={(open) => !open && setPgpDialogType(null)}
        type={pgpDialogType || 'buyer_missing'}
        onUnlock={() => {
          setPgpDialogType(null);
          setShowPgpPassphraseDialog(true);
        }}
      />

      {/* PGP Passphrase Dialog */}
      <PGPPassphraseDialog
        open={showPgpPassphraseDialog}
        onOpenChange={setShowPgpPassphraseDialog}
        onUnlocked={handlePgpUnlocked}
      />
    </div>
  );
};

export default ListingDetail;
