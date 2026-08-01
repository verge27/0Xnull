-- Drop the security-definer view created in the previous step
DROP VIEW IF EXISTS public.blocked_market_ids;

-- Public sync table that only stores blocked market IDs, no admin metadata
CREATE TABLE public.blocked_market_ids (
  market_id text NOT NULL PRIMARY KEY
);

GRANT SELECT ON public.blocked_market_ids TO anon;
GRANT SELECT ON public.blocked_market_ids TO authenticated;
GRANT ALL ON public.blocked_market_ids TO service_role;

ALTER TABLE public.blocked_market_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked market IDs"
ON public.blocked_market_ids
FOR SELECT
TO public
USING (true);

-- Populate from existing blocked_markets
INSERT INTO public.blocked_market_ids (market_id)
SELECT market_id FROM public.blocked_markets
ON CONFLICT (market_id) DO NOTHING;

-- Trigger function to keep the public table in sync with the admin-only table
CREATE OR REPLACE FUNCTION public.sync_blocked_market_ids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.blocked_market_ids (market_id)
    VALUES (NEW.market_id)
    ON CONFLICT (market_id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.blocked_market_ids WHERE market_id = OLD.market_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.market_id IS DISTINCT FROM NEW.market_id THEN
      DELETE FROM public.blocked_market_ids WHERE market_id = OLD.market_id;
      INSERT INTO public.blocked_market_ids (market_id)
      VALUES (NEW.market_id)
      ON CONFLICT (market_id) DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_blocked_market_ids() TO service_role;

CREATE TRIGGER sync_blocked_market_ids
AFTER INSERT OR UPDATE OR DELETE ON public.blocked_markets
FOR EACH ROW EXECUTE FUNCTION public.sync_blocked_market_ids();