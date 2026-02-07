-- Create table to cache Exolix coins
CREATE TABLE public.exolix_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  network TEXT NOT NULL,
  memo BOOLEAN DEFAULT false,
  image TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticker, network)
);

-- Allow public read access for coins
ALTER TABLE public.exolix_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exolix coins" 
ON public.exolix_coins 
FOR SELECT 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_exolix_coins_ticker ON public.exolix_coins(ticker);

-- Add comment
COMMENT ON TABLE public.exolix_coins IS 'Cached cryptocurrency list from Exolix exchange API';