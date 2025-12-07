-- Create rate limiting table for RPC calls
CREATE TABLE IF NOT EXISTS public.rpc_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_rpc_rate_limits_lookup ON public.rpc_rate_limits (ip_address, function_name, window_start);

-- Enable RLS
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access
CREATE POLICY "Service role only" ON public.rpc_rate_limits FOR ALL USING (false);

-- Create rate-limited version of the function
CREATE OR REPLACE FUNCTION public.get_swap_by_trade_id_limited(p_trade_id text, p_client_ip text DEFAULT NULL)
RETURNS SETOF swap_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ip TEXT;
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_rate_limit INTEGER := 10; -- 10 requests per minute
  v_window_minutes INTEGER := 1;
BEGIN
  -- Use provided IP or default
  v_ip := COALESCE(p_client_ip, 'unknown');
  v_window_start := now() - (v_window_minutes || ' minutes')::INTERVAL;
  
  -- Count recent requests from this IP
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM rpc_rate_limits
  WHERE ip_address = v_ip
    AND function_name = 'get_swap_by_trade_id'
    AND window_start > v_window_start;
  
  -- Check rate limit
  IF v_count >= v_rate_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  -- Log this request (upsert)
  INSERT INTO rpc_rate_limits (ip_address, function_name, request_count, window_start)
  VALUES (v_ip, 'get_swap_by_trade_id', 1, now())
  ON CONFLICT DO NOTHING;
  
  -- Return the swap data
  RETURN QUERY SELECT * FROM swap_history WHERE trade_id = p_trade_id LIMIT 1;
END;
$$;

-- Clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM rpc_rate_limits WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;