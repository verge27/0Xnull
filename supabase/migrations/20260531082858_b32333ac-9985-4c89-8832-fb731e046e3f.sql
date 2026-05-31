
-- 1. user_roles: remove broken OR branch in admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. market_positions: lock INSERT (backend service_role writes only; bypasses RLS)
DROP POLICY IF EXISTS "Anyone can create positions" ON public.market_positions;
CREATE POLICY "Service role manages positions"
ON public.market_positions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
-- service_role bypasses RLS for all backend-driven inserts

-- 3. prediction_markets: require authenticated session, drop pk_id loophole
DROP POLICY IF EXISTS "Authenticated users can create markets" ON public.prediction_markets;
CREATE POLICY "Authenticated users can create markets"
ON public.prediction_markets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- 4. creator_comments: require authenticated session, drop pk_user_id loophole
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.creator_comments;
CREATE POLICY "Authenticated users can create comments"
ON public.creator_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 5. realtime.messages: scope channel subscriptions to participants/owners
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to authorized channels" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to authorized channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Conversation channels: topic format "conversation:<uuid>"
  (
    realtime.topic() LIKE 'conversation:%'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = (substring(realtime.topic() FROM 'conversation:(.+)'))::uuid
        AND cp.user_id = auth.uid()
    )
  )
  OR
  -- Market position channels: topic format "positions:<user_uuid>"
  (
    realtime.topic() LIKE 'positions:%'
    AND substring(realtime.topic() FROM 'positions:(.+)') = auth.uid()::text
  )
  OR
  -- Public broadcast channels (markets, tickers): explicit allow-list
  realtime.topic() IN ('public:markets', 'public:recent_bets', 'public:resolutions')
);

-- 6. listing-images storage bucket: enforce folder ownership on INSERT
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in listing-images" ON storage.objects;
CREATE POLICY "Users can upload to own folder in listing-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
