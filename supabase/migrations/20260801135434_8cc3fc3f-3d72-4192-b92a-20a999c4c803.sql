-- Restrict blocked_markets to admin-only
DROP POLICY IF EXISTS "Anyone can view blocked markets" ON public.blocked_markets;
CREATE POLICY "Admins can view blocked markets"
ON public.blocked_markets
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public view that exposes only the blocked market IDs
CREATE OR REPLACE VIEW public.blocked_market_ids AS
SELECT market_id FROM public.blocked_markets;

GRANT SELECT ON public.blocked_market_ids TO anon;
GRANT SELECT ON public.blocked_market_ids TO authenticated;

-- Restrict market_payouts to admin-only
DROP POLICY IF EXISTS "Anyone can view payouts" ON public.market_payouts;
CREATE POLICY "Admins can view payouts"
ON public.market_payouts
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict voucher_analytics INSERT to service_role
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.voucher_analytics;
CREATE POLICY "Service role can insert analytics events"
ON public.voucher_analytics
FOR INSERT
TO service_role
WITH CHECK (true);