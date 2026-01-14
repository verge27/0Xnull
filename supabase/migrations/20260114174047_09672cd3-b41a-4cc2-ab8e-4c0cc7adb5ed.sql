-- Drop the broken SELECT policy
DROP POLICY IF EXISTS "Users can only view their own record" ON public.private_key_users;

-- Create a new policy that allows reading public user info (needed for login lookup)
CREATE POLICY "Allow public read of private_key_users"
ON public.private_key_users
FOR SELECT
USING (true);