-- Add payment_token column to private_key_users for anonymous users
ALTER TABLE public.private_key_users
ADD COLUMN payment_token text UNIQUE;

-- Add payment_token column to profiles for email/password users
ALTER TABLE public.profiles
ADD COLUMN payment_token text UNIQUE;

-- Create policy to allow viewing own profile's payment_token (already covered by existing policy)
-- No new policies needed as profiles already has proper RLS