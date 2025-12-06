-- First, delete any existing anonymous swap records (orphaned data)
DELETE FROM public.swap_history WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent anonymous swaps
ALTER TABLE public.swap_history ALTER COLUMN user_id SET NOT NULL;

-- Drop the old INSERT policy that allowed anonymous swaps
DROP POLICY IF EXISTS "Authenticated users can create swap records" ON public.swap_history;

-- Create new INSERT policy that requires authentication
CREATE POLICY "Authenticated users can create swap records"
ON public.swap_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);