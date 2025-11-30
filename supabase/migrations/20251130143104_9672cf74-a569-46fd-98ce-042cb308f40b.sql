-- Update RLS policy to restrict profiles to authenticated users only
-- This prevents public scraping of all wallet addresses while still allowing marketplace functionality

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Only authenticated users can view profiles (buyers/sellers in the marketplace)
CREATE POLICY "Profiles viewable by authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Optionally, also allow profile owner to view even if not authenticated
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);