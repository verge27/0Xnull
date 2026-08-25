ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'hiring';

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_listing_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_listing_type_check CHECK (listing_type IN ('hiring','offering'));

CREATE INDEX IF NOT EXISTS jobs_listing_type_idx ON public.jobs (listing_type);

-- Freelancer directories are always people offering services.
UPDATE public.jobs
SET listing_type = 'offering'
WHERE source_id IN ('monerica-freelancers', 'freelanceforcoins');

-- Wording-based classification for the remaining sources.
UPDATE public.jobs
SET listing_type = 'offering'
WHERE source_id NOT IN ('monerica-freelancers', 'freelanceforcoins')
  AND (
    (title || ' ' || body) ~* '(i (can|will|am able to|offer|do|build|design|write|provide)|available for (hire|work)|for hire|my services|offering my|hire me|dm me for|i''m a |i am a |open (for|to) (work|commissions)|accepting (clients|commissions|orders)|portfolio)'
  )
  AND (title || ' ' || body) !~* '(we are hiring|hiring|we need|looking to hire|job offer|vacancy|we''re looking for|paying [0-9])';