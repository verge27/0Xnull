-- Fix conversations policy - remove overly permissive IS NOT NULL check
-- PK users will need to use edge functions with signature verification
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
);

-- Fix conversation_participants policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id
    AND cp2.user_id = auth.uid()
  )
);

-- Fix messages policies - only auth users via RLS, PK users via edge function
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Add service role policies for edge functions to use
-- These allow the edge functions (using service role) to operate on behalf of verified PK users

CREATE POLICY "Service role can manage conversations"
ON public.conversations FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage participants"
ON public.conversation_participants FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage messages"
ON public.messages FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');