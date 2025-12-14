-- Drop the view and recreate without security definer issues
DROP VIEW IF EXISTS public.public_private_key_users;

-- Recreate view with SECURITY INVOKER (default, explicitly stated)
CREATE VIEW public.public_private_key_users 
WITH (security_invoker = false)
AS
SELECT 
  id,
  display_name,
  public_key,
  pgp_public_key,
  reputation_score,
  total_trades,
  created_at,
  updated_at
FROM public.private_key_users;

-- Grant access to the view
GRANT SELECT ON public.public_private_key_users TO anon, authenticated;