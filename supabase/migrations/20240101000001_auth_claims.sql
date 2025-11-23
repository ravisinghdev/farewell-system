-- Function to sync farewell roles to app_metadata
CREATE OR REPLACE FUNCTION public.sync_farewell_claims()
RETURNS TRIGGER AS $$
DECLARE
  user_farewells JSONB;
  current_metadata JSONB;
BEGIN
  -- Fetch all farewell memberships for the user
  SELECT jsonb_object_agg(farewell_id, role)
  INTO user_farewells
  FROM public.farewell_members
  WHERE user_id = NEW.user_id AND active = true;

  -- Get current metadata
  SELECT raw_app_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Update app_metadata with new farewells object
  -- We use 'farewells' key to store the map of farewell_id -> role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(current_metadata, '{}'::jsonb) || 
    jsonb_build_object('farewells', COALESCE(user_farewells, '{}'::jsonb))
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for INSERT or UPDATE on farewell_members
DROP TRIGGER IF EXISTS on_farewell_member_change ON public.farewell_members;
CREATE TRIGGER on_farewell_member_change
  AFTER INSERT OR UPDATE ON public.farewell_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_farewell_claims();

-- Trigger for DELETE on farewell_members (to remove claim)
CREATE OR REPLACE FUNCTION public.remove_farewell_claims()
RETURNS TRIGGER AS $$
DECLARE
  user_farewells JSONB;
  current_metadata JSONB;
BEGIN
  -- Fetch remaining farewell memberships
  SELECT jsonb_object_agg(farewell_id, role)
  INTO user_farewells
  FROM public.farewell_members
  WHERE user_id = OLD.user_id AND active = true;

  -- Get current metadata
  SELECT raw_app_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = OLD.user_id;

  -- Update app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(current_metadata, '{}'::jsonb) || 
    jsonb_build_object('farewells', COALESCE(user_farewells, '{}'::jsonb))
  WHERE id = OLD.user_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_farewell_member_delete ON public.farewell_members;
CREATE TRIGGER on_farewell_member_delete
  AFTER DELETE ON public.farewell_members
  FOR EACH ROW EXECUTE FUNCTION public.remove_farewell_claims();
