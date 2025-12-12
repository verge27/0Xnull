import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { toast } from 'sonner';
import { isTorBrowser } from '@/services/api';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRightLeft, 
  Wallet, 
  Shield, 
  Lock,
  MessageCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

type PaymentMethod = 'direct' | 'trocador';

interface Order {
  id: string;
  listing_id: string;
  buyer_user_id: string;
  seller_user_id: string | null;
  seller_pk_user_id: string | null;
  quantity: number;
  unit_price_usd: number;
  shipping_price_usd: number;
  total_price_usd: number;
  status: string;
  shipping_address: string | null;
  conversation_id: string | null;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  images: string[] | null;
  category: string;
}

interface SellerProfile {
  id: string;
  display_name: string;
  xmr_address: string | null;
  pgp_public_key: string | null;
}

const Checkout = () => {
  const isOnTor = isTorBrowser();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usdToXmr } = useExchangeRate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('direct');
  const [copied, setCopied] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Fetch order, listing, and seller data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) return;
      
      setLoading(true);
      
      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        if (orderError || !orderData) {
          console.error('Order fetch error:', orderError);
          setLoading(false);
          return;
        }
        
        setOrder(orderData);
        
        // Fetch listing
        if (orderData.listing_id) {
          const { data: listingData } = await supabase
            .from('listings')
            .select('id, title, images, category')
            .eq('id', orderData.listing_id)
            .maybeSingle();
          
          if (listingData) {
            setListing(listingData);
          }
        }
        
        // Fetch seller profile
        const sellerId = orderData.seller_user_id || orderData.seller_pk_user_id;
        if (sellerId) {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('id, display_name, xmr_address, pgp_public_key')
            .eq('id', sellerId)
            .maybeSingle();
          
          if (sellerData) {
            setSeller(sellerData);
          }
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId]);

  const handleCopyAddress = async () => {
    if (!seller?.xmr_address) return;
    
    await navigator.clipboard.writeText(seller.xmr_address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsPaid = async () => {
    if (!order) return;
    
    setMarkingPaid(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (error) throw error;
      
      toast.success('Payment marked as sent!', {
        description: 'The seller will be notified'
      });
      
      // Navigate to order tracking
      setTimeout(() => navigate(`/orders`), 1500);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      toast.error('Failed to update order status');
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link to="/browse">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalXmr = usdToXmr(order.total_price_usd);
  const isAddressEncrypted = order.shipping_address?.includes('-----BEGIN PGP MESSAGE-----');

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">Complete your purchase securely</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listing && (
                  <div className="flex gap-4">
                    <img
                      src={listing.images?.[0] || '/placeholder.svg'}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold mb-1">{listing.title}</h3>
                      <Badge variant="secondary">{listing.category}</Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item Price × {order.quantity}</span>
                    <span className="font-semibold">${order.unit_price_usd.toFixed(2)}</span>
                  </div>
                  {order.shipping_price_usd > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold">${order.shipping_price_usd.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <span className="font-bold text-primary block">${order.total_price_usd.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">≈ {totalXmr.toFixed(6)} XMR</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono ml-2 text-xs">{order.id}</span>
                  </div>
                  {seller && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="ml-2">{seller.display_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Encrypted Shipping Notice */}
            {isAddressEncrypted && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
                      Shipping Address Encrypted
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      Your shipping address was encrypted with the seller's PGP key. Only they can decrypt it.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message Seller */}
            <Card>
              <CardContent className="p-4">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => order.conversation_id ? navigate(`/messages/${order.conversation_id}`) : navigate('/messages')}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Seller
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  A conversation was started automatically when you placed this order
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Choose how you'd like to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="space-y-3"
                >
                  {/* Direct XMR Payment */}
                  <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'direct' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="direct" id="direct" className="mt-1" />
                    <Label htmlFor="direct" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="font-semibold">Direct XMR Payment</span>
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send XMR directly to the seller's address. Fastest and most private option.
                      </p>
                    </Label>
                  </div>

                  {/* Trocador (only on clearnet) */}
                  {!isOnTor && (
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'trocador' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <RadioGroupItem value="trocador" id="trocador" className="mt-1" />
                      <Label htmlFor="trocador" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowRightLeft className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Pay with Any Crypto</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Use Trocador to pay with BTC, ETH, USDT, or 200+ other coins. Converts to XMR automatically.
                        </p>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {paymentMethod === 'direct' ? 'Send XMR' : 'Complete Payment'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethod === 'direct' ? (
                  <div className="space-y-4">
                    {seller?.xmr_address ? (
                      <>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            Amount to send
                          </Label>
                          <div className="bg-muted p-4 rounded-lg">
                            <span className="font-mono text-2xl font-bold text-primary">
                              {totalXmr.toFixed(6)} XMR
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            Seller's XMR Address
                          </Label>
                          <div className="bg-muted p-4 rounded-lg">
                            <code className="text-xs sm:text-sm break-all font-mono block mb-3">
                              {seller.xmr_address}
                            </code>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full gap-2"
                              onClick={handleCopyAddress}
                            >
                              {copied ? (
                                <>
                                  <Check className="h-4 w-4 text-green-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy Address
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={handleMarkAsPaid}
                            disabled={markingPaid}
                          >
                            {markingPaid ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Marking as Paid...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                I've Sent the Payment
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Click after you've sent the XMR to notify the seller
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Seller Address Not Available</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          The seller hasn't set up their XMR address yet. Please contact them via messages.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/messages')}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Seller
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Trocador iframe
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Pay with any supported cryptocurrency. Trocador will convert it to XMR and send to the seller.
                    </p>
                    {seller?.xmr_address ? (
                      <div className="rounded-lg overflow-hidden border border-border">
                        <iframe
                          src={`https://trocador.app/anonpay/?ref=mkaShKWUZA&ticker_to=xmr&network_to=Mainnet&amount=${totalXmr.toFixed(6)}&address=${encodeURIComponent(seller.xmr_address)}&name=0xNull%20Marketplace&description=Order%20${order.id.slice(0, 8)}`}
                          width="100%"
                          height="600"
                          style={{ border: 'none' }}
                          title="Trocador Payment"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted rounded-lg">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Seller address not configured
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Powered by</span>
                      <a 
                        href="https://trocador.app/?ref=mkaShKWUZA" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Trocador <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust Notice */}
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    Direct Payment - No Escrow
                  </div>
                  <div className="text-amber-600 dark:text-amber-400">
                    This is a direct peer-to-peer payment. 0xNull does not hold funds or mediate disputes. 
                    Only purchase from sellers you trust.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
