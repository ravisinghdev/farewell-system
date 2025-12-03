-- Grant permissions for Legacy tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_gifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_thank_you_notes TO authenticated;

-- Grant permissions for Legacy tables to service_role (for admin tasks/scripts)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_videos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_gifts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_thank_you_notes TO service_role;

-- Ensure helper functions are executable
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO service_role;
GRANT EXECUTE ON FUNCTION public.is_farewell_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farewell_admin TO service_role;
