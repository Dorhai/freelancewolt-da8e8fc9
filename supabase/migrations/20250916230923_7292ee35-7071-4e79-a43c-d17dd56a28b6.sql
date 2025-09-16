-- Fix security issue: Set search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    photo_url,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'::user_role
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    photo_url = COALESCE(EXCLUDED.photo_url, public.users.photo_url);
  
  RETURN NEW;
END;
$$;

-- Fix the update_updated_at_column function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;