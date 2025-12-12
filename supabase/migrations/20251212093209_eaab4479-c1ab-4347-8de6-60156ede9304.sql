-- Fix: Customer Payment Tokens and Crypto Addresses Exposed to Public
-- The "Anyone can view public keys" policy exposes ALL columns including sensitive payment_token and xmr_address

-- Step 1: Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view public keys" ON public.profiles;

-- Step 2: Create a secure view that only exposes safe public profile data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  reputation_score,
  total_reviews,
  pgp_public_key,
  created_at
FROM public.profiles;

-- Step 3: Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Step 4: Enable RLS on the base profiles table is already done
-- Users can still see their own full profile via "Users can view own profile" policy