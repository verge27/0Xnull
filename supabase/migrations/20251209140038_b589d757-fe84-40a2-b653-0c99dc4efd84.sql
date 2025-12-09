-- Create table for private key (anonymous) users
CREATE TABLE public.private_key_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  reputation_score integer DEFAULT 0,
  total_trades integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.private_key_users ENABLE ROW LEVEL SECURITY;

-- Anyone can view private key users (for reputation display)
CREATE POLICY "Anyone can view private key users"
ON public.private_key_users
FOR SELECT
USING (true);

-- Anyone can create a private key user (registration is open)
CREATE POLICY "Anyone can create private key users"
ON public.private_key_users
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_private_key_users_updated_at
BEFORE UPDATE ON public.private_key_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();