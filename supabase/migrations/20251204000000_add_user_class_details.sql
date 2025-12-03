-- Add grade and section to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section TEXT;

-- Update handle_new_user trigger to copy grade and section from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, username, grade, section)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'grade')::INTEGER,
    NEW.raw_user_meta_data->>'section'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    grade = COALESCE(EXCLUDED.grade, public.users.grade),
    section = COALESCE(EXCLUDED.section, public.users.section);
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
