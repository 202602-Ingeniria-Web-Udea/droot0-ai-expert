-- Supabase exposed the public schema through its Data API. RLS was disabled and
-- the anon/authenticated roles had full table privileges.
--
-- The application accesses PostgreSQL through Prisma using the postgres role,
-- which bypasses RLS. No Supabase Data API table access is required by the app,
-- so the correct configuration is default-deny for anon and authenticated.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Defense in depth: remove existing Data API privileges even if RLS were
-- accidentally disabled later.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Future tables and sequences created in the public schema must also deny
-- Data API access by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
