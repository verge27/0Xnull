import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewCard, StarRating } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { useSellerReviews } from '@/hooks/useReviews';

interface SellerReviewsProps {
  sellerId: string;
  isPrivateKey?: boolean;
  showForm?: boolean;
  listingId?: string;
}

export function SellerReviews({ sellerId, isPrivateKey = false, showForm = true, listingId }: SellerReviewsProps) {
  const { reviews, reputation, loading, refetch } = useSellerReviews(sellerId, isPrivateKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reputation Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{reputation.reputation_score || 0}</div>
              <StarRating rating={reputation.reputation_score} size="md" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Based on {reputation.total_reviews} review{reputation.total_reviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showForm && (
        <ReviewForm 
          sellerId={sellerId} 
          isSellerPrivateKey={isPrivateKey}
          listingId={listingId}
          onSuccess={refetch}
        />
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reviews</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length > 0 ? (
            <div className="divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="p-4">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ReputationBadgeProps {
  score: number;
  reviewCount: number;
  size?: 'sm' | 'md';
}

export function ReputationBadge({ score, reviewCount, size = 'sm' }: ReputationBadgeProps) {
  if (reviewCount === 0) {
    return (
      <span className="text-muted-foreground text-sm">New seller</span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <StarRating rating={score} size={size} />
      <span className="text-sm text-muted-foreground">({reviewCount})</span>
    </div>
  );
}
