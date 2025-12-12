-- Add views column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Create a function to increment views (bypasses RLS for counting)
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE listings SET views = views + 1 WHERE id = listing_id;
END;
$$;