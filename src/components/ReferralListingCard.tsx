import { ExternalLink, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface ReferralListing {
  id: string;
  title: string;
  description?: string;
  priceUsd: number;
  priceXmr?: number;
  images: string[];
  referralUrl?: string;
  discreteShipping?: boolean;
}

interface ReferralListingCardProps {
  listing: ReferralListing;
  partnerName: string;
}

export const ReferralListingCard = ({ listing, partnerName }: ReferralListingCardProps) => {
  const handleBuyClick = () => {
    if (listing.referralUrl) {
      window.open(listing.referralUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-slate-900 border-slate-700 relative">
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-orange-500 text-white text-xs">
          {partnerName}
        </Badge>
      </div>

      <div className="aspect-square bg-slate-800 relative">
        <img
          src={listing.images[0] || '/placeholder.svg'}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        {listing.discreteShipping && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-slate-900/80 text-xs text-slate-300 border-slate-600">
              <Truck className="w-3 h-3 mr-1" />
              Discreet
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium text-white line-clamp-2 mb-2">
          {listing.title}
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-white">
            ${listing.priceUsd.toFixed(2)}
          </span>
          {listing.priceXmr && (
            <span className="text-sm text-slate-400">
              ({listing.priceXmr.toFixed(2)} XMR)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Shield className="w-3 h-3" />
          <span>Accepts crypto</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleBuyClick}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          Buy at {partnerName}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};