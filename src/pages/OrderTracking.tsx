import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { getOrder, getListing, updateOrder, getCurrentUser } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, MessageCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DEMO_USERS } from '@/lib/data';
import { OrderStepper } from '@/components/OrderStepper';
import { useState } from 'react';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = getOrder(id!);
  const listing = order ? getListing(order.listingId) : null;
  const currentUser = getCurrentUser();
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  if (!order || !listing) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link to="/orders">
            <Button>View Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const seller = DEMO_USERS.find(u => u.id === order.sellerId);
  const isSeller = currentUser?.id === order.sellerId;
  const isBuyer = currentUser?.id === order.buyerId;

  const handleMarkShipped = () => {
    if (!trackingCarrier || !trackingNumber) {
      toast.error('Please enter tracking information');
      return;
    }
    
    const trackingUrl = getTrackingUrl(trackingCarrier, trackingNumber);
    updateOrder(order.id, { 
      status: 'shipped',
      trackingCarrier,
      trackingNumber,
      trackingUrl,
      shippedAt: new Date().toISOString()
    });
    toast.success('Order marked as shipped!');
    navigate(0);
  };

  const handleMarkDelivered = () => {
    updateOrder(order.id, { 
      status: 'delivered',
      deliveredAt: new Date().toISOString()
    });
    toast.success('Order marked as delivered!');
    navigate(0);
  };

  const handleMarkCompleted = () => {
    updateOrder(order.id, { 
      status: 'completed',
      completedAt: new Date().toISOString()
    });
    toast.success('Order completed! Leave a review?');
    navigate(0);
  };

  const getTrackingUrl = (carrier: string, number: string) => {
    const carriers: Record<string, string> = {
      'Royal Mail': `https://www.royalmail.com/track-your-item#/tracking-results/${number}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${number}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${number}`,
      'UPS': `https://www.ups.com/track?tracknum=${number}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${number}`,
    };
    return carriers[carrier] || '#';
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">Order #{order.id}</p>
        </div>

        {/* Order Status */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <OrderStepper status={order.status as any} />
          </CardContent>
        </Card>

        {/* Tracking Information */}
        {order.trackingNumber && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tracking Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Carrier</span>
                  <p className="font-medium">{order.trackingCarrier}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tracking Number</span>
                  <p className="font-mono text-sm">{order.trackingNumber}</p>
                </div>
                {order.trackingUrl && (
                  <a 
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Track Package <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Product</h2>
              <div className="flex gap-4">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold mb-2">{listing.title}</h3>
                  <Badge variant="secondary">{listing.category}</Badge>
                  <div className="mt-2 text-lg font-bold text-primary">
                    {order.totalXmr} XMR
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Info</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Order ID</span>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Created</span>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Seller</span>
                  <p>{seller?.displayName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Quantity</span>
                  <p>{order.quantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seller Actions */}
        {isSeller && order.status === 'paid' && (
          <Card className="mt-6 bg-primary/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Mark as Shipped</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="carrier">Shipping Carrier</Label>
                  <Input
                    id="carrier"
                    placeholder="e.g., Royal Mail, DHL, FedEx"
                    value={trackingCarrier}
                    onChange={(e) => setTrackingCarrier(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    placeholder="e.g., RM123456789GB"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <Button onClick={handleMarkShipped} className="w-full">
                  Mark as Shipped
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isSeller && order.status === 'shipped' && (
          <Card className="mt-6 bg-primary/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Seller Actions</h3>
              <Button onClick={handleMarkDelivered} className="w-full">
                Mark as Delivered
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Buyer Actions */}
        {isBuyer && order.status === 'delivered' && (
          <Card className="mt-6 bg-primary/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Confirm Receipt</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Have you received your order?
              </p>
              <Button onClick={handleMarkCompleted} className="w-full">
                Confirm Delivery & Complete Order
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.info('Messaging coming soon!')}>
                <MessageCircle className="w-4 h-4" />
                Message {isSeller ? 'Buyer' : 'Seller'}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.info('Dispute system coming soon!')}>
                <AlertCircle className="w-4 h-4" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTracking;
