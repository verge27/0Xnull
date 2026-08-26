DO $$ BEGIN
  CREATE TYPE public.blog_queue_status AS ENUM ('pending','generated','published','skipped','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_publish_mode AS ENUM ('auto','draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.blog_voice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spec text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_mode public.blog_publish_mode NOT NULL DEFAULT 'draft',
  run_hour_london int NOT NULL DEFAULT 7,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index int NOT NULL UNIQUE,
  product_key text NOT NULL,
  title_hint text NOT NULL,
  reader text NOT NULL,
  page_url text NOT NULL,
  "constraint" text,
  facts text NOT NULL,
  status public.blog_queue_status NOT NULL DEFAULT 'pending',
  generated_at timestamptz,
  published_at timestamptz,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  raw_response text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_voice TO authenticated;
GRANT SELECT, UPDATE ON public.blog_settings TO authenticated;
GRANT SELECT, UPDATE ON public.blog_queue TO authenticated;
GRANT ALL ON public.blog_voice TO service_role;
GRANT ALL ON public.blog_settings TO service_role;
GRANT ALL ON public.blog_queue TO service_role;

ALTER TABLE public.blog_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage blog voice" ON public.blog_voice;
CREATE POLICY "Admins manage blog voice" ON public.blog_voice FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage blog settings" ON public.blog_settings;
CREATE POLICY "Admins manage blog settings" ON public.blog_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage blog queue" ON public.blog_queue;
CREATE POLICY "Admins manage blog queue" ON public.blog_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));