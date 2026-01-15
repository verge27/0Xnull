-- Create table to track voucher/referral conversions
CREATE TABLE public.voucher_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_code TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'bet_placed', 'bet_won'
  user_token TEXT, -- anonymous user identifier (from localStorage)
  page TEXT, -- which page they viewed
  market_id UUID, -- for bet events
  bet_amount NUMERIC, -- for bet events
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by voucher code
CREATE INDEX idx_voucher_analytics_code ON public.voucher_analytics(voucher_code);
CREATE INDEX idx_voucher_analytics_event ON public.voucher_analytics(event_type);
CREATE INDEX idx_voucher_analytics_created ON public.voucher_analytics(created_at DESC);

-- Enable RLS but allow inserts from anonymous users (tracking is public)
ALTER TABLE public.voucher_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics events
CREATE POLICY "Anyone can insert analytics events"
ON public.voucher_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics"
ON public.voucher_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add to realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.voucher_analytics;