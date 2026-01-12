-- Create comments table for creator content
CREATE TABLE public.creator_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pk_user_id UUID REFERENCES public.private_key_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.creator_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_content_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_user_type CHECK (
    (user_id IS NOT NULL AND pk_user_id IS NULL) OR
    (user_id IS NULL AND pk_user_id IS NOT NULL)
  )
);

-- Create index for efficient lookups
CREATE INDEX idx_creator_comments_content_id ON public.creator_comments(content_id);
CREATE INDEX idx_creator_comments_parent_id ON public.creator_comments(parent_id);
CREATE INDEX idx_creator_comments_user_id ON public.creator_comments(user_id);
CREATE INDEX idx_creator_comments_pk_user_id ON public.creator_comments(pk_user_id);

-- Enable Row Level Security
ALTER TABLE public.creator_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
ON public.creator_comments
FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.creator_comments
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (pk_user_id IS NOT NULL)
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.creator_comments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.creator_comments
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_comments;