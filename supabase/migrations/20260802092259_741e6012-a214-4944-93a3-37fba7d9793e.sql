CREATE TABLE public.seo_index_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  verdict text,
  coverage_state text,
  robots_txt_state text,
  indexing_state text,
  page_fetch_state text,
  google_canonical text,
  user_canonical text,
  last_crawl_time timestamp with time zone,
  error_message text,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_index_snapshots_url_checked_at ON public.seo_index_snapshots (url, checked_at DESC);

GRANT SELECT ON public.seo_index_snapshots TO authenticated;
GRANT ALL ON public.seo_index_snapshots TO service_role;

ALTER TABLE public.seo_index_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view seo index snapshots"
ON public.seo_index_snapshots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));