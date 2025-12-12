-- Add shipping_countries column to listings table
ALTER TABLE public.listings 
ADD COLUMN shipping_countries text[] DEFAULT NULL;