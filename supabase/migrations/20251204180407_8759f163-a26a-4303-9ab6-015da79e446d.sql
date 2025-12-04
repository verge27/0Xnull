-- Add user_id column to swap_history (nullable to preserve existing records)
ALTER TABLE public.swap_history ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the old overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view swaps by email" ON public.swap_history;

-- Create new SELECT policy that restricts to user's own swaps
CREATE POLICY "Users can view their own swaps" 
ON public.swap_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update INSERT policy to set user_id automatically
DROP POLICY IF EXISTS "Anyone can create swap records" ON public.swap_history;

CREATE POLICY "Authenticated users can create swap records" 
ON public.swap_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);