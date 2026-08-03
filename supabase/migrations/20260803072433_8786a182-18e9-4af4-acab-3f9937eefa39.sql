CREATE OR REPLACE FUNCTION public.add_listing_seller_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller uuid;
BEGIN
  IF NEW.listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT seller_id INTO v_seller FROM public.listings WHERE id = NEW.listing_id;

  IF v_seller IS NOT NULL AND v_seller IS DISTINCT FROM NEW.creator_id THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (NEW.id, v_seller)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_add_seller_participant ON public.conversations;
CREATE TRIGGER conversations_add_seller_participant
AFTER INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.add_listing_seller_participant();