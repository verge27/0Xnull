-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create private key users" ON public.private_key_users;

-- Create restrictive policy that only allows service_role (edge functions) to insert
-- This forces all registration through pk-register edge function which validates PoW
CREATE POLICY "Only service role can create private key users"
ON public.private_key_users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add a comment explaining the security model
COMMENT ON TABLE public.private_key_users IS 'User accounts created via pk-register edge function with PoW verification. Direct inserts blocked by RLS.';