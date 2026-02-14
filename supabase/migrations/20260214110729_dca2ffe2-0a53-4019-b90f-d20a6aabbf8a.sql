
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own positions" ON public.market_positions;
DROP POLICY IF EXISTS "Anyone can view market positions" ON public.market_positions;
DROP POLICY IF EXISTS "Public can view positions" ON public.market_positions;

-- Create restrictive policy: only authenticated users can see their own positions
CREATE POLICY "Users can view own positions"
ON public.market_positions FOR SELECT
USING (user_id = auth.uid());

-- PK users should access their positions via edge functions only, not direct DB access
-- The public_market_positions view (which strips payout_address) remains available for aggregate data
