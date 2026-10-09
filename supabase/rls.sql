-- supabase/rls.sql — enable Row Level Security on EVERY table in the public schema.
-- Run in the Supabase SQL editor. Idempotent: safe to run again.
--
-- Why this is safe for the app: every read and write goes through the Vercel /api/* functions,
-- which use the SERVICE ROLE key (api/_lib/supabase.js). The service role bypasses RLS. The web
-- and mobile apps never talk to Supabase directly, so with RLS on and NO policies, the public
-- anon / authenticated keys can read or write nothing — which is exactly what we want.
-- Covers tables created by hand too (not only the ones in schema.sql).

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- Verify: every row should show rls_enabled = true.
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;
