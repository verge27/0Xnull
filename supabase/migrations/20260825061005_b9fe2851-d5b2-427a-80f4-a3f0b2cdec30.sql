CREATE OR REPLACE FUNCTION public.prevent_profile_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.xmr_balance IS DISTINCT FROM OLD.xmr_balance
     OR NEW.reputation_score IS DISTINCT FROM OLD.reputation_score
     OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews THEN
    RAISE EXCEPTION 'Balance and reputation fields cannot be modified directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privileged_updates_trg ON public.profiles;

CREATE TRIGGER prevent_profile_privileged_updates_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privileged_updates();

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privileged_updates() FROM anon, authenticated;