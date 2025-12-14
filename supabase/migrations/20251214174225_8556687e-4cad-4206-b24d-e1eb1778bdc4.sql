
-- Fix the security definer view issue by explicitly setting security invoker
DROP VIEW IF EXISTS public.public_market_positions;

CREATE VIEW public.public_market_positions 
WITH (security_invoker = true)
AS
SELECT 
  id,
  market_id,
  side,
  amount,
  created_at
FROM public.market_positions;

-- Grant access to the view
GRANT SELECT ON public.public_market_positions TO anon, authenticated;
