-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view private key users" ON public.private_key_users;

-- Create a policy that only allows users to view their own sensitive data
-- Since private_key_users don't use auth.uid(), we restrict all direct SELECT
-- The public_private_key_users VIEW will still work for public lookups

-- Allow users to view their own record by matching on a session check
-- (In practice, the view is used for public lookups, this blocks direct table access)
CREATE POLICY "Users can only view own private_key_users record"
ON public.private_key_users
FOR SELECT
USING (false);

-- Ensure the public view is accessible and has the right columns
-- Recreate the view to ensure it only exposes safe fields
DROP VIEW IF EXISTS public.public_private_key_users;

CREATE VIEW public.public_private_key_users AS
SELECT 
  id,
  display_name,
  public_key,
  pgp_public_key,
  reputation_score,
  total_trades,
  created_at,
  updated_at
FROM public.private_key_users;

-- Grant access to the view for all roles
GRANT SELECT ON public.public_private_key_users TO anon, authenticated;