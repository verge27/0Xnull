import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { getOrder, getListing, getCurrentUser, updateOrder } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_USERS } from '@/lib/data';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = getOrder(orderId!);
  const listing = order ? getListing(order.listingId) : null;
  const seller = order ? DEMO_USERS.find(u => u.id === order.sellerId) : null;
  const currentUser = getCurrentUser();

  if (!order || !listing || !seller) {
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

  const handleSimulatePayment = () => {
    updateOrder(order.id, { status: 'paid' });
    toast.success('Payment simulated! Order marked as paid.');
    setTimeout(() => navigate(`/order/${order.id}`), 1000);
  };

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
                
                <div className="flex gap-4 mb-4">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold mb-1">{listing.title}</h3>
                    <Badge variant="secondary">{listing.category}</Badge>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item Price</span>
                    <span className="font-semibold">{listing.priceXmr} XMR</span>
                  </div>
                  {listing.shippingPriceXmr > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold">{listing.shippingPriceXmr} XMR</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (2%)</span>
                    <span className="font-semibold">{(order.totalXmr * 0.02).toFixed(4)} XMR</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">{order.totalXmr} XMR</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="text-sm mb-2">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono ml-2">{order.id}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="ml-2">{seller.displayName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Controls */}
            <Card className="mt-4 bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Demo Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a demo environment. Click below to simulate a successful payment.
                </p>
                <Button onClick={handleSimulatePayment} className="w-full">
                  Simulate Payment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Iframe */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Use Trocador AnonPay to complete your purchase with cryptocurrency.
                </p>
                
                <div className="rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={`https://trocador.app/anonpay/?ticker_to=xmr&network_to=Mainnet&amount=${order.totalXmr}&address=${seller.xmrAddress}&name=0xNull%20Marketplace&description=Order%20${order.id}`}
                    width="100%"
                    height="600"
                    style={{ border: 'none' }}
                    title="Trocador Payment"
                  />
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
