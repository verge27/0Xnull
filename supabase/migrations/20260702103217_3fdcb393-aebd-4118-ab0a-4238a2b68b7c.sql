
-- 1) conversation_participants
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add themselves to eligible conversations"
ON public.conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND private_key_user_id IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.listings l ON l.id = c.listing_id
      WHERE c.id = conversation_participants.conversation_id
        AND l.seller_id = auth.uid()
    )
    OR (
      SELECT COUNT(*) FROM public.conversation_participants existing
      WHERE existing.conversation_id = conversation_participants.conversation_id
    ) < 2
  )
);

-- 2) creator_comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.creator_comments;
CREATE POLICY "Authenticated users can create comments"
ON public.creator_comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND pk_user_id IS NULL
);

-- 3) market_positions
DROP POLICY IF EXISTS "Service role manages positions" ON public.market_positions;
CREATE POLICY "Authenticated users insert own positions"
ON public.market_positions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND user_pk_id IS NULL
);

-- 4) prediction_markets
DROP POLICY IF EXISTS "Authenticated users can create markets" ON public.prediction_markets;
CREATE POLICY "Authenticated users can create markets"
ON public.prediction_markets
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND creator_pk_id IS NULL
);

-- 5) swap_history
DROP POLICY IF EXISTS "Users can create swap records" ON public.swap_history;
CREATE POLICY "Authenticated users create own swap records"
ON public.swap_history
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6) api_call_logs
DROP POLICY IF EXISTS "Service role can insert logs" ON public.api_call_logs;
CREATE POLICY "Only service role can insert api logs"
ON public.api_call_logs
FOR INSERT TO public
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 7) market_resolution_logs
DROP POLICY IF EXISTS "Service role can insert logs" ON public.market_resolution_logs;
CREATE POLICY "Only service role can insert resolution logs"
ON public.market_resolution_logs
FOR INSERT TO public
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
