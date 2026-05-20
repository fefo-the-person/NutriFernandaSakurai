-- ═══════════════════════════════════════════════════════════════
-- GRANT MIGRATION – Nutri Fernanda Sakurai
-- Run this once in the Supabase SQL Editor
--
-- Context: Starting May 30 2026, Supabase no longer auto-grants
-- access to tables in the "public" schema. Explicit GRANTs are
-- required for the Data API (supabase-js) to work.
-- Deadline for existing projects: October 30, 2026.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Base tables: authenticated users can read/write their own data
-- (access is still gated by RLS policies defined in security_migration.sql)
-- ───────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses      TO authenticated;

-- anon role must never access these tables
REVOKE ALL ON public.patients      FROM anon;
REVOKE ALL ON public.consultations FROM anon;
REVOKE ALL ON public.expenses      FROM anon;

-- ───────────────────────────────────────────────────────────────
-- Views: already granted, kept here for completeness
-- ───────────────────────────────────────────────────────────────
GRANT SELECT ON public.patient_crm     TO authenticated;
GRANT SELECT ON public.monthly_summary TO authenticated;

REVOKE ALL ON public.patient_crm     FROM anon;
REVOKE ALL ON public.monthly_summary FROM anon;

-- ───────────────────────────────────────────────────────────────
-- Verification – run after applying to confirm grants are in place
-- ───────────────────────────────────────────────────────────────
SELECT grantee, table_name, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND grantee IN ('anon', 'authenticated')
 ORDER BY table_name, grantee, privilege_type;
