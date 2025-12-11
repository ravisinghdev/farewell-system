-- =================================================================
-- SUPABASE FUNCTION SCRIPT FIXER (v2 - Dynamic)
-- Fixes "Function Search Path Mutable" (SECURITY) warnings
-- Robust version: Finds functions by loop to avoid signature errors
-- =================================================================

DO $$
DECLARE
    func_record RECORD;
    func_sig TEXT;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'update_farewell_stats_members',
              'update_farewell_stats_messages',
              'backfill_farewell_stats',
              'is_chat_member',
              'is_chat_admin',
              'is_farewell_member',
              'is_farewell_admin',
              'handle_updated_at',
              'update_channel_last_message',
              'approve_contribution',
              'sync_farewell_claims',
              'handle_new_user',
              'notify_new_content',
              'notify_contribution_update',
              'assign_duty',
              'approve_duty_receipt',
              'reject_duty_receipt'
          )
    LOOP
        func_sig := format('%I.%I(%s)', func_record.schema_name, func_record.function_name, func_record.args);
        RAISE NOTICE 'Securing function: %', func_sig;
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_sig);
    END LOOP;
END $$;
