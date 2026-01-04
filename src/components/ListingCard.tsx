import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/lib/types';
import { PriceDisplay } from './PriceDisplay';
import { DEMO_USERS, toggleWishlist, isInWishlist } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Heart, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing & { isXMRBazaar?: boolean; isDbListing?: boolean; isPartner?: boolean; isDemo?: boolean };
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist(listing.id));
  
  const seller = listing.isXMRBazaar 
    ? { 
        displayName: (listing as any).seller?.name || 'XMRBazaar Seller', 
        rating: (listing as any).seller?.rating || 0, 
        reviewCount: (listing as any).seller?.reviews || 0,
        avatar: undefined
      }
    : DEMO_USERS.find(u => u.id === listing.sellerId);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(listing.id);
    setIsWishlisted(!isWishlisted);
  };

  const linkUrl = listing.isXMRBazaar ? (listing as any).xmrbazaarUrl : `/listing/${listing.id}`;
  const linkTarget = listing.isXMRBazaar ? "_blank" : undefined;
  const linkRel = listing.isXMRBazaar ? "noopener noreferrer" : undefined;

  return (
    <Link to={linkUrl} target={linkTarget} rel={linkRel}>
      <Card className="card-hover overflow-hidden group">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Top left badges */}
          {listing.isXMRBazaar && (
            <a
              href={(listing as any).xmrbazaarUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 left-3 z-10"
            >
              <Badge className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white border-0 gap-1 cursor-pointer transition-colors">
                <ExternalLink className="w-3 h-3" />
                XMRBazaar
              </Badge>
            </a>
          )}
          
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors z-10"
          >
            <Heart 
              className={`w-5 h-5 transition-all ${
                isWishlisted ? 'fill-primary text-primary' : 'text-foreground'
              }`}
            />
          </button>
          {listing.images.length > 1 && (
            <Badge variant="secondary" className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm gap-1">
              <ImageIcon className="w-3 h-3" />
              {listing.images.length}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
            <div className="flex gap-1 ml-2 shrink-0">
              <Badge variant="secondary" className="text-xs">
                {listing.category}
              </Badge>
              {!listing.isXMRBazaar && !listing.isDbListing && !listing.isPartner && (
                <Badge variant="outline" className="text-xs">
                  Demo
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {listing.description}
          </p>
          
          {/* Seller Info */}
          {seller && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              {seller.avatar && (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={seller.avatar} alt={seller.displayName} />
                  <AvatarFallback className="text-xs">{seller.displayName[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground truncate block">
                  {seller.displayName}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span className="text-xs text-muted-foreground">
                  {seller.rating.toFixed(1)}
                </span>
                {seller.reviewCount && (
                  <span className="text-xs text-muted-foreground">
                    ({seller.reviewCount})
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div>
            <PriceDisplay 
              usdAmount={listing.priceUsd} 
              className="text-2xl font-bold text-primary block"
              showBrackets={true}
            />
            {listing.shippingPriceUsd > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                <PriceDisplay 
                  usdAmount={listing.shippingPriceUsd} 
                  className="text-xs"
                  showBrackets={false}
                /> shipping
              </div>
            )}
          </div>
          <Badge variant={listing.stock > 0 ? 'default' : 'destructive'}>
            {listing.stock > 0 ? `${listing.stock} in stock` : 'Sold Out'}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
};
