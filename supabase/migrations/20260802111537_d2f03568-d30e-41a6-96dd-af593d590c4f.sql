-- Fix anti-impersonation finding MISSING_ANTI_IMPERSONATION_CHECK
-- Restrict the authenticated INSERT policy on messages so a JWT-authenticated user
-- cannot set sender_private_key_user_id to impersonate a private-key (token) user.

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND sender_private_key_user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);