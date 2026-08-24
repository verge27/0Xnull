ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'fetch';

ALTER TABLE public.sources
  DROP CONSTRAINT IF EXISTS sources_mode_check;

ALTER TABLE public.sources
  ADD CONSTRAINT sources_mode_check CHECK (mode IN ('fetch','ingest'));

UPDATE public.sources SET mode = 'ingest' WHERE id = 'tg-monerojobs';