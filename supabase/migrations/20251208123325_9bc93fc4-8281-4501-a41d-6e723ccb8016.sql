-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock INTEGER NOT NULL DEFAULT 1,
  shipping_price_usd NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  condition TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
ON public.listings
FOR SELECT
USING (status = 'active');

-- Users can view their own listings regardless of status
CREATE POLICY "Users can view own listings"
ON public.listings
FOR SELECT
USING (auth.uid() = seller_id);

-- Users can create their own listings
CREATE POLICY "Users can create listings"
ON public.listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
ON public.listings
FOR UPDATE
USING (auth.uid() = seller_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
ON public.listings
FOR DELETE
USING (auth.uid() = seller_id);

-- Create trigger for updated_at
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();