CREATE OR REPLACE FUNCTION public.message_identity_unchanged(
  p_message_id uuid,
  p_new_conversation_id uuid,
  p_new_sender_user_id uuid,
  p_new_sender_private_key_user_id uuid,
  p_new_content text,
  p_new_created_at timestamp with time zone
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messages
    WHERE id = p_message_id
      AND conversation_id IS NOT DISTINCT FROM p_new_conversation_id
      AND sender_user_id IS NOT DISTINCT FROM p_new_sender_user_id
      AND sender_private_key_user_id IS NOT DISTINCT FROM p_new_sender_private_key_user_id
      AND content IS NOT DISTINCT FROM p_new_content
      AND created_at IS NOT DISTINCT FROM p_new_created_at
  )
$$;

GRANT EXECUTE ON FUNCTION public.message_identity_unchanged(uuid, uuid, uuid, uuid, text, timestamp with time zone) TO public;

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

CREATE POLICY "Users can mark messages as read"
  ON public.messages
  FOR UPDATE
  TO public
  USING (
    is_conversation_participant(conversation_id, auth.uid(), NULL::uuid)
  )
  WITH CHECK (
    is_conversation_participant(conversation_id, auth.uid(), NULL::uuid)
    AND public.message_identity_unchanged(
      id,
      conversation_id,
      sender_user_id,
      sender_private_key_user_id,
      content,
      created_at
    )
  );