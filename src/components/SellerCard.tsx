import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SellerCardProps {
  seller: User;
}

export const SellerCard = ({ seller }: SellerCardProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-primary text-primary" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-primary/50 text-primary" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-muted-foreground" />
        );
      }
    }
    return stars;
  };

  return (
    <Link 
      to={`/seller/${seller.id}`}
      className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
    >
      <Avatar className="w-12 h-12">
        <AvatarImage src={seller.avatar} alt={seller.displayName} />
        <AvatarFallback>{seller.displayName[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">
          {seller.displayName}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5">
            {renderStars(seller.rating)}
          </div>
          <span>({seller.rating.toFixed(1)})</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            <span>{seller.totalSales} sales</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
