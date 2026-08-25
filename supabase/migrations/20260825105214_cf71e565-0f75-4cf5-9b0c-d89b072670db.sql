CREATE OR REPLACE FUNCTION public.restrict_order_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_buyer boolean;
  v_is_seller boolean;
BEGIN
  -- Backend (service role) may perform any update
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Financial and structural fields are immutable after creation
  IF NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.unit_price_usd IS DISTINCT FROM OLD.unit_price_usd
     OR NEW.shipping_price_usd IS DISTINCT FROM OLD.shipping_price_usd
     OR NEW.total_price_usd IS DISTINCT FROM OLD.total_price_usd
     OR NEW.listing_id IS DISTINCT FROM OLD.listing_id
     OR NEW.buyer_user_id IS DISTINCT FROM OLD.buyer_user_id
     OR NEW.buyer_pk_user_id IS DISTINCT FROM OLD.buyer_pk_user_id
     OR NEW.seller_user_id IS DISTINCT FROM OLD.seller_user_id
     OR NEW.seller_pk_user_id IS DISTINCT FROM OLD.seller_pk_user_id THEN
    RAISE EXCEPTION 'Order amounts and parties cannot be modified after creation';
  END IF;

  -- Status timestamps are set-once and only alongside a matching status
  IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
    IF OLD.paid_at IS NOT NULL OR NEW.status NOT IN ('paid', 'shipped', 'delivered', 'completed') THEN
      RAISE EXCEPTION 'paid_at cannot be modified';
    END IF;
  END IF;

  IF NEW.shipped_at IS DISTINCT FROM OLD.shipped_at THEN
    IF OLD.shipped_at IS NOT NULL OR NEW.status NOT IN ('shipped', 'delivered', 'completed') THEN
      RAISE EXCEPTION 'shipped_at cannot be modified';
    END IF;
  END IF;

  IF NEW.delivered_at IS DISTINCT FROM OLD.delivered_at THEN
    IF OLD.delivered_at IS NOT NULL OR NEW.status NOT IN ('delivered', 'completed') THEN
      RAISE EXCEPTION 'delivered_at cannot be modified';
    END IF;
  END IF;

  IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    IF OLD.completed_at IS NOT NULL OR NEW.status <> 'completed' THEN
      RAISE EXCEPTION 'completed_at cannot be modified';
    END IF;
  END IF;

  -- Enforce the status transition graph with role-appropriate transitions
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_is_buyer := auth.uid() IS NOT NULL AND auth.uid() = OLD.buyer_user_id;
    v_is_seller := auth.uid() IS NOT NULL AND auth.uid() = OLD.seller_user_id;

    IF NOT (
      (OLD.status = 'pending'   AND NEW.status IN ('paid', 'cancelled', 'disputed')) OR
      (OLD.status = 'paid'      AND NEW.status IN ('shipped', 'cancelled', 'disputed')) OR
      (OLD.status = 'shipped'   AND NEW.status IN ('delivered', 'disputed')) OR
      (OLD.status = 'delivered' AND NEW.status IN ('completed', 'disputed'))
    ) THEN
      RAISE EXCEPTION 'Invalid order status transition from % to %', OLD.status, NEW.status;
    END IF;

    -- Only the seller can mark an order as shipped
    IF NEW.status = 'shipped' AND NOT v_is_seller THEN
      RAISE EXCEPTION 'Only the seller can mark an order as shipped';
    END IF;

    -- Only the buyer can mark paid, confirm delivery or complete the order
    IF NEW.status IN ('paid', 'delivered', 'completed') AND NOT v_is_buyer THEN
      RAISE EXCEPTION 'Only the buyer can perform this status change';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_order_field_updates_trg ON public.orders;
CREATE TRIGGER restrict_order_field_updates_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_order_field_updates();