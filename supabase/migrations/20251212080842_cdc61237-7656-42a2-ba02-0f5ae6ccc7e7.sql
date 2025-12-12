-- Create listing analytics table for daily tracking
CREATE TABLE public.listing_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, date)
);

-- Enable RLS
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Sellers can view analytics for their own listings
CREATE POLICY "Sellers can view own listing analytics"
ON public.listing_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_analytics.listing_id 
    AND listings.seller_id = auth.uid()
  )
);

-- Create function to increment daily views
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total views on listing
  UPDATE listings SET views = views + 1 WHERE id = listing_id;
  
  -- Upsert daily analytics
  INSERT INTO listing_analytics (listing_id, date, views)
  VALUES (listing_id, CURRENT_DATE, 1)
  ON CONFLICT (listing_id, date) 
  DO UPDATE SET views = listing_analytics.views + 1;
END;
$$;

-- Create function to record sale (call this when order is created)
CREATE OR REPLACE FUNCTION public.record_listing_sale(p_listing_id uuid, p_quantity integer, p_revenue numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO listing_analytics (listing_id, date, sales, revenue)
  VALUES (p_listing_id, CURRENT_DATE, p_quantity, p_revenue)
  ON CONFLICT (listing_id, date) 
  DO UPDATE SET 
    sales = listing_analytics.sales + p_quantity,
    revenue = listing_analytics.revenue + p_revenue;
END;
$$;

-- Create index for faster queries
CREATE INDEX idx_listing_analytics_listing_date ON public.listing_analytics(listing_id, date DESC);