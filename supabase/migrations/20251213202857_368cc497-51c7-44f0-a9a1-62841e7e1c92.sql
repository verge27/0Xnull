-- Prediction Markets
CREATE TABLE public.prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id),
  creator_pk_id UUID REFERENCES public.private_key_users(id),
  question TEXT NOT NULL,
  description TEXT,
  resolution_date TIMESTAMPTZ,
  resolution_criteria TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  total_yes_pool DECIMAL NOT NULL DEFAULT 0,
  total_no_pool DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('open', 'closed', 'resolved_yes', 'resolved_no', 'cancelled'))
);

-- Market Positions
CREATE TABLE public.market_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  user_pk_id UUID REFERENCES public.private_key_users(id),
  side TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  payout_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_side CHECK (side IN ('yes', 'no')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Market Payouts
CREATE TABLE public.market_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.market_positions(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  txid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positive_payout CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prediction_markets
CREATE POLICY "Anyone can view markets" ON public.prediction_markets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create markets" ON public.prediction_markets
  FOR INSERT WITH CHECK (auth.uid() = creator_id OR creator_pk_id IS NOT NULL);

CREATE POLICY "Creators can update own markets" ON public.prediction_markets
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Admins can update any market" ON public.prediction_markets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for market_positions
CREATE POLICY "Anyone can view positions" ON public.market_positions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create positions" ON public.market_positions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for market_payouts
CREATE POLICY "Anyone can view payouts" ON public.market_payouts
  FOR SELECT USING (true);

CREATE POLICY "Admins can create payouts" ON public.market_payouts
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_prediction_markets_updated_at
  BEFORE UPDATE ON public.prediction_markets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_markets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_positions;