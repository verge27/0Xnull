import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCreateReview } from '@/hooks/useReviews';

interface ReviewFormProps {
  sellerId: string;
  isSellerPrivateKey?: boolean;
  listingId?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ sellerId, isSellerPrivateKey = false, listingId, onSuccess }: ReviewFormProps) {
  const { createReview, submitting, isAuthenticated } = useCreateReview();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const success = await createReview(
      sellerId,
      isSellerPrivateKey,
      rating,
      title || undefined,
      content || undefined,
      listingId
    );

    if (success) {
      toast.success('Review submitted');
      setRating(0);
      setTitle('');
      setContent('');
      onSuccess?.();
    } else {
      toast.error('Failed to submit review');
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Sign in to leave a review
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoveredRating(i + 1)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      i < (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-title" className="text-sm font-medium mb-2 block">
              Title (optional)
            </label>
            <Input
              id="review-title"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="review-content" className="text-sm font-medium mb-2 block">
              Review (optional)
            </label>
            <Textarea
              id="review-content"
              placeholder="Share details about your experience with this seller"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
