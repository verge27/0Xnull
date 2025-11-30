import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/lib/types';
import { PriceDisplay } from './PriceDisplay';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="card-hover overflow-hidden group">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
            <div className="flex gap-1 ml-2 shrink-0">
              <Badge variant="secondary" className="text-xs">
                {listing.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Demo
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {listing.description}
          </p>
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
