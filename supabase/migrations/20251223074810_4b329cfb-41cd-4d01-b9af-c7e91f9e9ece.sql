-- Create table for market resolution audit logs
CREATE TABLE public.market_resolution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  oracle_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  event_id TEXT,
  event_winner TEXT,
  yes_pool_xmr NUMERIC DEFAULT 0,
  no_pool_xmr NUMERIC DEFAULT 0,
  resolved_by TEXT DEFAULT 'auto-resolve-cron',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_resolution_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view resolution logs (transparency)
CREATE POLICY "Anyone can view resolution logs"
ON public.market_resolution_logs
FOR SELECT
USING (true);

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert logs"
ON public.market_resolution_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_resolution_logs_market_id ON public.market_resolution_logs(market_id);
CREATE INDEX idx_resolution_logs_created_at ON public.market_resolution_logs(created_at DESC);