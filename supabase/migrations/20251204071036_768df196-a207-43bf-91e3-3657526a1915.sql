CREATE TABLE public.coins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker text NOT NULL,
  name text NOT NULL,
  network text NOT NULL,
  memo boolean NOT NULL DEFAULT false,
  image text,
  minimum numeric NOT NULL,
  maximum numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ticker, network)
);

ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coins" ON public.coins FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_coins_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_coins_updated_at BEFORE UPDATE ON public.coins
FOR EACH ROW EXECUTE FUNCTION public.update_coins_updated_at();

CREATE TABLE public.swap_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id text NOT NULL,
  from_coin text NOT NULL,
  from_network text NOT NULL,
  to_coin text NOT NULL,
  to_network text NOT NULL,
  amount text NOT NULL,
  receive_address text NOT NULL,
  provider text NOT NULL,
  provider_address text NOT NULL,
  provider_memo text,
  user_email text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create swap records" ON public.swap_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view swaps by email" ON public.swap_history FOR SELECT USING (true);