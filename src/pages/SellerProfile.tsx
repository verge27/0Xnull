import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { DEMO_USERS, getListings } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, ShoppingBag, MessageCircle } from 'lucide-react';
import { SellerReviews, ReputationBadge } from '@/components/SellerReviews';
import { useSellerReviews } from '@/hooks/useReviews';

const SellerProfile = () => {
  const { id } = useParams();
  const seller = DEMO_USERS.find(u => u.id === id);
  const listings = getListings().filter(l => l.sellerId === id && l.status === 'active');
  
  // Fetch real reviews from database
  const { reputation } = useSellerReviews(id, false);

  if (!seller) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Seller not found</h1>
          <Link to="/browse">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = new Date(seller.joinedAt);
  const formattedJoinDate = joinDate.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Seller Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={seller.avatar} alt={seller.displayName} />
                <AvatarFallback className="text-2xl">{seller.displayName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{seller.displayName}</h1>
                
                <div className="flex items-center gap-2 mb-3">
                  <ReputationBadge 
                    score={reputation.reputation_score || seller.rating} 
                    reviewCount={reputation.total_reviews || seller.reviewCount} 
                    size="md"
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {formattedJoinDate}</span>
                  </div>
                  {seller.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{seller.totalSales} sales</span>
                  </div>
                </div>

                <Button className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message Seller
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="listings">
              Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reputation.total_reviews || seller.reviewCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                {seller.bio ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {seller.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    This seller hasn't added a bio yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            {listings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    This seller doesn't have any active listings.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {id && <SellerReviews sellerId={id} showForm={true} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerProfile;
