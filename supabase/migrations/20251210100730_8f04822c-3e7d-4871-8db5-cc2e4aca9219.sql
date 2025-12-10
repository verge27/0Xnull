-- Add PGP key columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pgp_public_key TEXT,
ADD COLUMN IF NOT EXISTS pgp_encrypted_private_key TEXT;

-- Add PGP key columns to private_key_users
ALTER TABLE public.private_key_users 
ADD COLUMN IF NOT EXISTS pgp_public_key TEXT,
ADD COLUMN IF NOT EXISTS pgp_encrypted_private_key TEXT;

-- Update RLS to allow users to read others' public keys
CREATE POLICY "Anyone can view public keys" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow users to update their own PGP keys
CREATE POLICY "Users can update own PGP keys"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);