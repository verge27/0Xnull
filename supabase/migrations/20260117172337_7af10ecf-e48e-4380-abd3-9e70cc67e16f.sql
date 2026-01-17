-- Restrict voucher_analytics to admin-only read access
DROP POLICY IF EXISTS "Anyone can read analytics" ON public.voucher_analytics;

-- Only admins can view analytics data
CREATE POLICY "Admins can read analytics"
ON public.voucher_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Keep insert policy for tracking (anonymous events)
-- The existing "Anyone can insert analytics events" is intentional for tracking