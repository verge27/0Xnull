-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_pk_user_id UUID REFERENCES public.private_key_users(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_pk_user_id UUID REFERENCES public.private_key_users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT one_seller_type CHECK (
    (seller_user_id IS NOT NULL AND seller_pk_user_id IS NULL) OR
    (seller_user_id IS NULL AND seller_pk_user_id IS NOT NULL)
  ),
  CONSTRAINT one_reviewer_type CHECK (
    (reviewer_user_id IS NOT NULL AND reviewer_pk_user_id IS NULL) OR
    (reviewer_user_id IS NULL AND reviewer_pk_user_id IS NOT NULL)
  )
);

-- Add reputation columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  reviewer_user_id = auth.uid() AND
  reviewer_user_id != seller_user_id
);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (reviewer_user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (reviewer_user_id = auth.uid());

-- Create function to update seller reputation
CREATE OR REPLACE FUNCTION public.update_seller_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate new average for profiles
  IF NEW.seller_user_id IS NOT NULL THEN
    SELECT AVG(rating)::INTEGER, COUNT(*) INTO avg_rating, review_count
    FROM reviews
    WHERE seller_user_id = NEW.seller_user_id;
    
    UPDATE profiles
    SET reputation_score = COALESCE(avg_rating, 0),
        total_reviews = review_count
    WHERE id = NEW.seller_user_id;
  END IF;
  
  -- Calculate new average for private_key_users
  IF NEW.seller_pk_user_id IS NOT NULL THEN
    SELECT AVG(rating)::INTEGER, COUNT(*) INTO avg_rating, review_count
    FROM reviews
    WHERE seller_pk_user_id = NEW.seller_pk_user_id;
    
    UPDATE private_key_users
    SET reputation_score = COALESCE(avg_rating, 0),
        total_trades = review_count
    WHERE id = NEW.seller_pk_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update reputation on new review
CREATE TRIGGER update_reputation_on_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_reputation();

-- Trigger to update reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();