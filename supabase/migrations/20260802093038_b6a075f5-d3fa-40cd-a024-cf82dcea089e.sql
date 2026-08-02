CREATE TABLE public.seo_deploy_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deploy_fingerprint TEXT NOT NULL,
  asset_count INTEGER,
  served_sitemap_count INTEGER,
  triggered_by TEXT NOT NULL DEFAULT 'cron',
  forced BOOLEAN NOT NULL DEFAULT false,
  sitemap_submitted BOOLEAN NOT NULL DEFAULT false,
  sitemap_status JSONB,
  inspection_summary JSONB,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_deploy_checks_checked_at ON public.seo_deploy_checks (checked_at DESC);

GRANT SELECT ON public.seo_deploy_checks TO authenticated;
GRANT ALL ON public.seo_deploy_checks TO service_role;

ALTER TABLE public.seo_deploy_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deploy checks"
ON public.seo_deploy_checks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));