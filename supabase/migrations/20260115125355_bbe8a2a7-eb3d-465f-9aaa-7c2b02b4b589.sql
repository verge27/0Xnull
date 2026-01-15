-- Temporarily allow public read access to voucher_analytics
DROP POLICY IF EXISTS "Admins can read analytics" ON public.voucher_analytics;
CREATE POLICY "Anyone can read analytics" ON public.voucher_analytics
FOR SELECT USING (true);