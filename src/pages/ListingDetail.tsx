import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { getListing, addOrder, updateListing, DEMO_USERS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Package, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { SellerCard } from '@/components/SellerCard';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = getListing(id!);
  const { user } = useAuth();
  const { usdToXmr } = useExchangeRate();
  const seller = listing ? DEMO_USERS.find(u => u.id === listing.sellerId) : null;

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

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      navigate('/auth');
      return;
    }

    if (listing.stock < 1) {
      toast.error('This item is out of stock');
      return;
    }

    const orderId = `order-${Date.now()}`;
    const totalUsd = listing.priceUsd + listing.shippingPriceUsd;
    const totalXmr = usdToXmr(totalUsd);

    addOrder({
      id: orderId,
      listingId: listing.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      quantity: 1,
      totalXmr,
      status: 'pending_payment',
      createdAt: new Date().toISOString()
    });

    // Decrease stock
    updateListing(listing.id, { stock: listing.stock - 1 });

    toast.success('Order created! Redirecting to checkout...');
    setTimeout(() => navigate(`/checkout/${orderId}`), 500);
  };

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
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <Badge>{listing.category}</Badge>
                  <Badge variant="secondary">Demo Listing</Badge>
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
              <Button
                size="lg"
                className="w-full gap-2 text-lg"
                onClick={handleBuyNow}
                disabled={listing.stock < 1}
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now with XMR
              </Button>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-foreground mb-1">Anonymous Payment</div>
                    <div className="text-muted-foreground">
                      Pay securely with cryptocurrency through Trocador AnonPay. Your privacy is protected.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
