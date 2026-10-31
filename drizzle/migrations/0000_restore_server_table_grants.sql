-- Remixed project: tables already exist in the database (schema copied from the source project);
-- the migration journal starts empty, so this migration only restores the access the server needs.
-- Both tables are read/written exclusively by server-side code (speech cache + AI access-state guard),
-- so only the privileged service role gets grants; RLS stays on and no anon/authenticated policies exist.
GRANT ALL ON public.speech_cache TO service_role;
GRANT ALL ON public.ai_access_state TO service_role;
