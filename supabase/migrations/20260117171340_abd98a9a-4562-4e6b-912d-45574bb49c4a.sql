-- Fix private_key_users: Remove overly permissive public read policy
-- The public_private_key_users VIEW already exists and exposes only safe fields
-- Restrict the base table to service role only for full access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow public read of private_key_users" ON public.private_key_users;

-- Create a restrictive policy: service role can read everything
-- Regular users should use the public_private_key_users VIEW instead
CREATE POLICY "Service role can read all private_key_users"
ON public.private_key_users
FOR SELECT
USING (
  (auth.jwt() ->> 'role') = 'service_role'
);

-- For the orders table, the existing policies are appropriate for buyer/seller access
-- But we can add a comment noting the design decision
-- The shipping_address exposure to sellers is necessary for order fulfillment

-- For profiles table, payment_token is user's own data - they should access it
-- This is intentional for wallet management features

-- Ensure the public_private_key_users view is accessible (it should be by default)
-- This view excludes: payment_token, pgp_encrypted_private_key
GRANT SELECT ON public.public_private_key_users TO anon, authenticated;