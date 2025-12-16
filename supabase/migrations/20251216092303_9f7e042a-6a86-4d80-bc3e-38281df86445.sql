-- Drop the existing restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can create private key users" ON private_key_users;

CREATE POLICY "Anyone can create private key users" 
ON private_key_users 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);