DROP POLICY IF EXISTS "Anyone can view resolution logs" ON public.market_resolution_logs;

CREATE POLICY "Only admins can view resolution logs"
ON public.market_resolution_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.market_resolution_logs FROM anon;