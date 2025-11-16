-- Enable row level security on assignments so that, in a real deployment,
-- users can only see their own giver rows.

alter table if exists public.assignments enable row level security;

-- TODO: In a production setup, you would map Supabase auth users to
-- participants (e.g. via a foreign key or a mapping table) and write policies
-- based on auth.uid(). Because this demo uses a localStorage-based "pseudo
-- auth" and the anonymous key from the browser, we cannot reliably enforce
-- per-user policies at the database layer here without additional setup.
--
-- Example of the type of policy you would create once auth is wired:
-- create policy "assignments_select_own_giver_only"
--   on public.assignments
--   for select
--   using (giver_id = (select participant_id from public.user_participants where user_id = auth.uid()));


