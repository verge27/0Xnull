CREATE OR REPLACE FUNCTION public.market_update_allowed(
  p_market_id uuid,
  p_new_status text,
  p_new_resolved_at timestamp with time zone,
  p_new_total_yes_pool numeric,
  p_new_total_no_pool numeric
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.prediction_markets
    WHERE id = p_market_id
      AND status = 'open'
      AND status IS NOT DISTINCT FROM p_new_status
      AND resolved_at IS NOT DISTINCT FROM p_new_resolved_at
      AND total_yes_pool IS NOT DISTINCT FROM p_new_total_yes_pool
      AND total_no_pool IS NOT DISTINCT FROM p_new_total_no_pool
  )
$$;

CREATE OR REPLACE FUNCTION public.order_identity_unchanged(
  p_order_id uuid,
  p_new_buyer_user_id uuid,
  p_new_buyer_pk_user_id uuid,
  p_new_seller_user_id uuid,
  p_new_seller_pk_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = p_order_id
      AND buyer_user_id IS NOT DISTINCT FROM p_new_buyer_user_id
      AND buyer_pk_user_id IS NOT DISTINCT FROM p_new_buyer_pk_user_id
      AND seller_user_id IS NOT DISTINCT FROM p_new_seller_user_id
      AND seller_pk_user_id IS NOT DISTINCT FROM p_new_seller_pk_user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.review_identity_unchanged(
  p_review_id uuid,
  p_new_reviewer_user_id uuid,
  p_new_reviewer_pk_user_id uuid,
  p_new_seller_user_id uuid,
  p_new_seller_pk_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE id = p_review_id
      AND reviewer_user_id IS NOT DISTINCT FROM p_new_reviewer_user_id
      AND reviewer_pk_user_id IS NOT DISTINCT FROM p_new_reviewer_pk_user_id
      AND seller_user_id IS NOT DISTINCT FROM p_new_seller_user_id
      AND seller_pk_user_id IS NOT DISTINCT FROM p_new_seller_pk_user_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.market_update_allowed(uuid, text, timestamp with time zone, numeric, numeric) TO public;
GRANT EXECUTE ON FUNCTION public.order_identity_unchanged(uuid, uuid, uuid, uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION public.review_identity_unchanged(uuid, uuid, uuid, uuid, uuid) TO public;

DROP POLICY IF EXISTS "Creators can update own markets" ON public.prediction_markets;
CREATE POLICY "Creators can update own markets"
ON public.prediction_markets
FOR UPDATE
TO public
USING (auth.uid() = creator_id)
WITH CHECK (
  auth.uid() = creator_id
  AND public.market_update_allowed(id, status, resolved_at, total_yes_pool, total_no_pool)
);

DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
CREATE POLICY "Buyers can create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (buyer_user_id = auth.uid() AND buyer_pk_user_id IS NULL);

DROP POLICY IF EXISTS "Buyers can update their orders" ON public.orders;
CREATE POLICY "Buyers can update their orders"
ON public.orders
FOR UPDATE
TO public
USING (buyer_user_id = auth.uid())
WITH CHECK (
  buyer_user_id = auth.uid()
  AND buyer_pk_user_id IS NULL
  AND public.order_identity_unchanged(id, buyer_user_id, buyer_pk_user_id, seller_user_id, seller_pk_user_id)
);

DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
CREATE POLICY "Sellers can update order status"
ON public.orders
FOR UPDATE
TO public
USING (seller_user_id = auth.uid())
WITH CHECK (
  seller_user_id = auth.uid()
  AND seller_pk_user_id IS NULL
  AND public.order_identity_unchanged(id, buyer_user_id, buyer_pk_user_id, seller_user_id, seller_pk_user_id)
);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND reviewer_user_id = auth.uid()
  AND reviewer_user_id <> seller_user_id
  AND reviewer_pk_user_id IS NULL
);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO public
USING (reviewer_user_id = auth.uid())
WITH CHECK (
  reviewer_user_id = auth.uid()
  AND reviewer_pk_user_id IS NULL
  AND public.review_identity_unchanged(id, reviewer_user_id, reviewer_pk_user_id, seller_user_id, seller_pk_user_id)
);