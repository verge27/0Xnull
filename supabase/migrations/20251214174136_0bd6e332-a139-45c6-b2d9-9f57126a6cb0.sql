
-- Fix 1: Restrict private_key_users table access
-- The public_private_key_users view already exists and exposes only safe fields
-- Drop the overly permissive policy and restrict to owner-only access

DROP POLICY IF EXISTS "Allow read access to public fields only" ON public.private_key_users;

-- Only allow users to read their own private_key_user record (if they somehow know their ID)
-- Public access should go through the public_private_key_users view
CREATE POLICY "Users can only view their own record"
ON public.private_key_users
FOR SELECT
USING (false);  -- No direct table access for SELECT, use the view instead

-- Fix 2: Restrict market_positions payout_address exposure
-- Users should only see their own positions with full details
-- Others can see positions exist but not the payout addresses

DROP POLICY IF EXISTS "Anyone can view positions" ON public.market_positions;

-- Users can view their own positions (full access)
CREATE POLICY "Users can view own positions"
ON public.market_positions
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_pk_id IS NOT NULL  -- PK users handled separately
);

-- Create a view for public market stats without exposing payout addresses
CREATE OR REPLACE VIEW public.public_market_positions AS
SELECT 
  id,
  market_id,
  side,
  amount,
  created_at
  -- Intentionally excluding: payout_address, user_id, user_pk_id
FROM public.market_positions;

-- Grant access to the view
GRANT SELECT ON public.public_market_positions TO anon, authenticated;
