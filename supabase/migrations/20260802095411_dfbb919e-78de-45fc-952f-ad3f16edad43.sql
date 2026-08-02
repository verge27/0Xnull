CREATE TABLE public.robots_txt_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robots_url text NOT NULL,
  http_status integer,
  content_hash text NOT NULL,
  content text,
  sitemap_directive text,
  sitemap_http_status integer,
  sitemap_url_count integer NOT NULL DEFAULT 0,
  is_healthy boolean NOT NULL DEFAULT false,
  changed_from_previous boolean NOT NULL DEFAULT false,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  checked_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX robots_txt_checks_checked_at_idx ON public.robots_txt_checks (checked_at DESC);

GRANT SELECT ON public.robots_txt_checks TO authenticated;
GRANT ALL ON public.robots_txt_checks TO service_role;

ALTER TABLE public.robots_txt_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view robots.txt checks"
ON public.robots_txt_checks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));