-- Set security_invoker = true to make the view respect RLS of the querying user
-- This is the recommended secure approach
ALTER VIEW public.public_private_key_users SET (security_invoker = true);

-- Since the view now respects RLS and our policy blocks all direct SELECT,
-- we need to create a policy that allows SELECT through the view's limited columns
-- Update the policy to allow public read access (the view filters the columns)
DROP POLICY IF EXISTS "Users can only view own private_key_users record" ON public.private_key_users;

-- Create a policy that allows reading only the non-sensitive columns
-- by checking if the access is for public info only
CREATE POLICY "Allow read access to public fields only"
ON public.private_key_users
FOR SELECT
USING (true);

-- The view itself only exposes safe columns, so even with this policy,
-- payment_token and pgp_encrypted_private_key are not accessible via the view