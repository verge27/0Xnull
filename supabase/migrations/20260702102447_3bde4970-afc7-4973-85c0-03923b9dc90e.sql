
-- Lock down SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated
-- Trigger functions and RLS helpers don't need direct call access
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role_by_pk(text, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_coins_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_seller_reputation() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_record_listing_sale() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_listing_sale(uuid, integer, numeric) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_swap_by_trade_id(text) FROM anon, PUBLIC;

-- Explicitly grant EXECUTE only where clients need it
GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_swap_by_trade_id_limited(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_swap_by_trade_id(text) TO authenticated;

-- Drop broad SELECT policies on public storage buckets to block folder listing.
-- Public buckets remain readable via the /object/public/ CDN path without RLS.
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
