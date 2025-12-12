import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isTorBrowser } from '@/services/api';
import { Copy, Wallet, ArrowRightLeft, MessageCircle, Lock, Loader2 } from 'lucide-react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useAuth } from '@/hooks/useAuth';
import { PaymentMethodSelector, PaymentMethod } from '@/components/PaymentMethodSelector';

interface CheckoutOrder {
  id: string;
  total_price_usd: number;
  quantity: number;
  shipping_address: string | null;
  conversation_id: string | null;
  listing: {
    id: string;
    title: string;
    images: string[] | null;
  } | null;
  seller: {
    display_name: string;
    xmr_address: string | null;
  } | null;
}

const Checkout = () => {
  const isOnTor = isTorBrowser();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usdToXmr } = useExchangeRate();
  
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('direct_xmr');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order with listing details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            total_price_usd,
            quantity,
            shipping_address,
            conversation_id,
            seller_user_id,
            listing_id,
            listings(id, title, images)
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (orderError || !orderData) {
          console.error('Order fetch error:', orderError);
          setLoading(false);
          return;
        }

        // Fetch seller info
        let seller: { display_name: string; xmr_address: string | null } | null = null;
        if (orderData.seller_user_id) {
          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('display_name, xmr_address')
            .eq('id', orderData.seller_user_id)
            .maybeSingle();
          
          seller = sellerProfile;
        }

        setOrder({
          id: orderData.id,
          total_price_usd: orderData.total_price_usd,
          quantity: orderData.quantity,
          shipping_address: orderData.shipping_address,
          conversation_id: orderData.conversation_id,
          listing: orderData.listings as CheckoutOrder['listing'],
          seller,
        });
      } catch (e) {
        console.error('Failed to fetch order:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleMarkAsPaid = async () => {
    if (!order) return;
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Payment confirmed! Seller has been notified.');
      setTimeout(() => navigate(`/order/${order.id}`), 1500);
    } catch (e) {
      console.error('Failed to update order status:', e);
      toast.error('Failed to confirm payment');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
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
  const sellerAddress = order.seller?.xmr_address || 'Address not available';
  const isAddressEncrypted = order.shipping_address?.includes('-----BEGIN PGP MESSAGE-----');

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                {order.listing && (
                  <div className="flex gap-4 mb-4">
                    <img
                      src={order.listing.images?.[0] || '/placeholder.svg'}
                      alt={order.listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold mb-1">{order.listing.title}</h3>
                      <Badge variant="secondary">Qty: {order.quantity}</Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <div className="font-bold text-primary">${order.total_price_usd.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">≈ {totalXmr.toFixed(6)} XMR</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono ml-2 text-xs">{order.id.slice(0, 8)}...</span>
                  </div>
                  {order.seller && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="ml-2">{order.seller.display_name}</span>
                    </div>
                  )}
                  {isAddressEncrypted && (
                    <div className="text-sm flex items-center gap-1 text-green-600">
                      <Lock className="w-3 h-3" />
                      <span>Shipping address encrypted</span>
                    </div>
                  )}
                </div>

                {/* Conversation Link */}
                {order.conversation_id && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 gap-2"
                    onClick={() => navigate(`/messages/${order.conversation_id}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    View Order Conversation
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Selector */}
            <Card className="mt-4">
              <CardContent className="p-6">
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                  totalXmr={totalXmr}
                />
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
                
                {paymentMethod === 'direct_xmr' || isOnTor ? (
                  // Direct XMR payment
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Wallet className="w-5 h-5" />
                      <span className="font-medium">Direct XMR Transfer</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send <span className="font-mono font-bold text-foreground">{totalXmr.toFixed(6)} XMR</span> to the seller's address:
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-xs sm:text-sm break-all font-mono">{sellerAddress}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(sellerAddress);
                          toast.success('Address copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy Address
                      </Button>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMarkAsPaid}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        'I Have Sent Payment'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      The seller will verify payment and ship your order.
                    </p>
                  </div>
                ) : (
                  // Trocador AnonPay
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <ArrowRightLeft className="w-5 h-5" />
                      <span className="font-medium">Pay with Any Crypto</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use Trocador AnonPay to pay with BTC, ETH, or 200+ other cryptocurrencies.
                    </p>
                    <div className="rounded-lg overflow-hidden border border-border">
                      <iframe
                        src={`https://trocador.app/anonpay/?ref=mkaShKWUZA&ticker_to=xmr&network_to=Mainnet&amount=${totalXmr.toFixed(6)}&address=${encodeURIComponent(sellerAddress)}&name=0xNull%20Marketplace&description=Order%20${order.id.slice(0, 8)}`}
                        width="100%"
                        height="600"
                        style={{ border: 'none' }}
                        title="Trocador Payment"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={handleMarkAsPaid}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        'Payment Complete - Notify Seller'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
