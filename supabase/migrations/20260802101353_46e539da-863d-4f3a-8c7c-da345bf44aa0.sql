ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS creator_id uuid DEFAULT auth.uid();

-- Backfill: earliest participant is treated as the conversation creator
UPDATE public.conversations c
SET creator_id = sub.user_id
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, user_id
  FROM public.conversation_participants
  WHERE user_id IS NOT NULL
  ORDER BY conversation_id, created_at ASC
) sub
WHERE sub.conversation_id = c.id
  AND c.creator_id IS NULL;

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can add themselves to eligible conversations" ON public.conversation_participants;
CREATE POLICY "Users can add themselves to eligible conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND private_key_user_id IS NULL
  AND (
    -- the seller of the listing attached to the conversation may join
    EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.listings l ON l.id = c.listing_id
      WHERE c.id = conversation_participants.conversation_id
        AND l.seller_id = auth.uid()
    )
    OR
    -- otherwise only the conversation's own creator may self-join
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.creator_id = auth.uid()
    )
  )
);