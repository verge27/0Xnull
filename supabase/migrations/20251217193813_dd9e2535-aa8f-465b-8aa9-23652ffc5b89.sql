-- Create blocked_markets table for admin-managed market blocklist
CREATE TABLE public.blocked_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL UNIQUE,
  reason text,
  blocked_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_markets ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked markets (needed for filtering)
CREATE POLICY "Anyone can view blocked markets"
ON public.blocked_markets
FOR SELECT
USING (true);

-- Only admins can insert blocked markets
CREATE POLICY "Admins can block markets"
ON public.blocked_markets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete blocked markets (unblock)
CREATE POLICY "Admins can unblock markets"
ON public.blocked_markets
FOR DELETE
USING (has_role(auth.uid(), 'admin'));