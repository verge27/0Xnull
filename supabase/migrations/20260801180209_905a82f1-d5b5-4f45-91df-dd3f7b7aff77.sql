DROP POLICY IF EXISTS "Users can add themselves to eligible conversations" ON public.conversation_participants;

CREATE POLICY "Users can add themselves to eligible conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND private_key_user_id IS NULL
  AND (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.listings l ON l.id = c.listing_id
      WHERE c.id = conversation_participants.conversation_id
        AND l.seller_id = auth.uid()
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.conversation_participants existing
      WHERE existing.conversation_id = conversation_participants.conversation_id
    )
  )
);