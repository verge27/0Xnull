-- Remove user_email column since swaps are anonymous/session-based
-- Email addresses shouldn't be stored in this table
ALTER TABLE public.swap_history DROP COLUMN IF EXISTS user_email;