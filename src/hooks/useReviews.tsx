import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePrivateKeyAuth } from './usePrivateKeyAuth';

export interface Review {
  id: string;
  listing_id: string | null;
  seller_user_id: string | null;
  seller_pk_user_id: string | null;
  reviewer_user_id: string | null;
  reviewer_pk_user_id: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  reviewer_name?: string;
  listing_title?: string;
}

export interface SellerReputation {
  reputation_score: number;
  total_reviews: number;
}

export function useSellerReviews(sellerId: string | undefined, isPrivateKey = false) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reputation, setReputation] = useState<SellerReputation>({ reputation_score: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!sellerId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch reviews
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (isPrivateKey) {
        query = query.eq('seller_pk_user_id', sellerId);
      } else {
        query = query.eq('seller_user_id', sellerId);
      }

      const { data: reviewsData, error: reviewsError } = await query;
      if (reviewsError) throw reviewsError;

      // Fetch reviewer names
      const reviewerUserIds = (reviewsData || []).filter(r => r.reviewer_user_id).map(r => r.reviewer_user_id!);
      const reviewerPkIds = (reviewsData || []).filter(r => r.reviewer_pk_user_id).map(r => r.reviewer_pk_user_id!);

      const { data: profiles } = reviewerUserIds.length > 0
        ? await supabase.from('profiles').select('id, display_name').in('id', reviewerUserIds)
        : { data: [] };

      const { data: pkUsers } = reviewerPkIds.length > 0
        ? await supabase.from('private_key_users').select('id, display_name').in('id', reviewerPkIds)
        : { data: [] };

      // Fetch listing titles
      const listingIds = (reviewsData || []).filter(r => r.listing_id).map(r => r.listing_id!);
      const { data: listings } = listingIds.length > 0
        ? await supabase.from('listings').select('id, title').in('id', listingIds)
        : { data: [] };

      const enrichedReviews: Review[] = (reviewsData || []).map(r => ({
        ...r,
        reviewer_name: 
          (profiles || []).find(p => p.id === r.reviewer_user_id)?.display_name ||
          (pkUsers || []).find(pk => pk.id === r.reviewer_pk_user_id)?.display_name ||
          'Anonymous',
        listing_title: (listings || []).find(l => l.id === r.listing_id)?.title,
      }));

      setReviews(enrichedReviews);

      // Fetch reputation
      if (isPrivateKey) {
        const { data: pkUser } = await supabase
          .from('private_key_users')
          .select('reputation_score, total_trades')
          .eq('id', sellerId)
          .maybeSingle();
        
        if (pkUser) {
          setReputation({
            reputation_score: pkUser.reputation_score || 0,
            total_reviews: pkUser.total_trades || 0,
          });
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('reputation_score, total_reviews')
          .eq('id', sellerId)
          .maybeSingle();
        
        if (profile) {
          setReputation({
            reputation_score: profile.reputation_score || 0,
            total_reviews: profile.total_reviews || 0,
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [sellerId, isPrivateKey]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, reputation, loading, refetch: fetchReviews };
}

export function useCreateReview() {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const [submitting, setSubmitting] = useState(false);

  const createReview = async (
    sellerId: string,
    isSellerPrivateKey: boolean,
    rating: number,
    title?: string,
    content?: string,
    listingId?: string
  ): Promise<boolean> => {
    if (!user && !privateKeyUser) return false;

    setSubmitting(true);
    try {
      const reviewData: any = {
        rating,
        title: title || null,
        content: content || null,
        listing_id: listingId || null,
      };

      // Set seller
      if (isSellerPrivateKey) {
        reviewData.seller_pk_user_id = sellerId;
      } else {
        reviewData.seller_user_id = sellerId;
      }

      // Set reviewer
      if (user) {
        reviewData.reviewer_user_id = user.id;
      } else if (privateKeyUser) {
        reviewData.reviewer_pk_user_id = privateKeyUser.id;
      }

      const { error } = await supabase.from('reviews').insert(reviewData);
      if (error) throw error;

      return true;
    } catch (e) {
      console.error('Failed to create review:', e);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { createReview, submitting, isAuthenticated: !!user || !!privateKeyUser };
}
