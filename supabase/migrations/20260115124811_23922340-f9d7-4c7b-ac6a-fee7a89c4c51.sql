-- Add pk_user_id column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN pk_user_id uuid REFERENCES public.private_key_users(id) ON DELETE CASCADE;

-- Make user_id nullable (since we might have only pk_user_id)
ALTER TABLE public.user_roles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure at least one user reference is set
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_check 
CHECK (user_id IS NOT NULL OR pk_user_id IS NOT NULL);

-- Drop the old unique constraint and add a new one that includes pk_user_id
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
CREATE UNIQUE INDEX user_roles_user_id_role_idx ON public.user_roles (user_id, role) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX user_roles_pk_user_id_role_idx ON public.user_roles (pk_user_id, role) WHERE pk_user_id IS NOT NULL;

-- Update has_role function to support private key users
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE (user_id = _user_id OR pk_user_id = _user_id)
      AND role = _role
  )
$$;

-- Create a function to check role by public key
CREATE OR REPLACE FUNCTION public.has_role_by_pk(public_key_hex text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.private_key_users pku ON ur.pk_user_id = pku.id
    WHERE pku.public_key = public_key_hex
      AND ur.role = _role
  )
$$;

-- First, ensure the private key user exists (insert if not)
INSERT INTO public.private_key_users (public_key, display_name)
VALUES ('0xn_386009029be00bfc16d88fed2ece0575cbeacde2a355df51830e4b0729398124', 'Admin_0XN')
ON CONFLICT (public_key) DO NOTHING;

-- Add admin role to this private key user
INSERT INTO public.user_roles (pk_user_id, role)
SELECT id, 'admin'::app_role
FROM public.private_key_users
WHERE public_key = '0xn_386009029be00bfc16d88fed2ece0575cbeacde2a355df51830e4b0729398124';

-- Update RLS policies to also allow private key admins
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.private_key_users pku
    JOIN public.user_roles ur ON ur.pk_user_id = pku.id
    WHERE ur.role = 'admin'::app_role
  )
);

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role)
);