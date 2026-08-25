GRANT SELECT ON public.fetch_runs TO authenticated;
GRANT ALL ON public.fetch_runs TO service_role;

CREATE POLICY "Admins can read fetch runs"
ON public.fetch_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_jobs_cron_schedules()
RETURNS TABLE(jobname text, schedule text, active boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT j.jobname::text, j.schedule::text, j.active
  FROM cron.job j
  WHERE j.jobname ILIKE '%job%'
  ORDER BY j.jobname;
END;
$$;

REVOKE ALL ON FUNCTION public.get_jobs_cron_schedules() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_jobs_cron_schedules() TO authenticated;