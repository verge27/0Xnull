import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { getWishlist, getListing } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingBag } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const Wishlist = () => {
  useSEO();
  const wishlistIds = getWishlist();
  const wishlistListings = wishlistIds.map(id => getListing(id)).filter(Boolean);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            {wishlistListings.length} {wishlistListings.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {wishlistListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start adding items to your wishlist to save them for later
              </p>
              <Link to="/browse">
                <Button className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Start Browsing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
