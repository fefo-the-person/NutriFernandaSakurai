-- ─────────────────────────────────────────────────────────────
-- SECURITY MIGRATION – Nutri Fernanda Sakurai
-- Run this in the Supabase SQL Editor to fix all security warnings
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Enable Row Level Security on all tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Create RLS policies — only authenticated users can access data
-- This means only someone logged in via Supabase Auth can read/write
-- ─────────────────────────────────────────────────────────────

-- PATIENTS
CREATE POLICY "authenticated_users_all" ON public.patients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CONSULTATIONS
CREATE POLICY "authenticated_users_all" ON public.consultations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- EXPENSES
CREATE POLICY "authenticated_users_all" ON public.expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Fix Security Definer Views
-- Recreate both views with security_invoker = true so they
-- respect the calling user's permissions and RLS policies
-- instead of running as the view creator (superuser)
-- ─────────────────────────────────────────────────────────────

-- Drop and recreate patient_crm with security_invoker
DROP VIEW IF EXISTS public.patient_crm;
CREATE OR REPLACE VIEW public.patient_crm
  WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.cpf,
  p.name,
  p.notes,
  MIN(c.date)                                AS first_consultation,
  MAX(c.date)                                AS last_consultation,
  COUNT(c.id)                                AS total_consultations,
  COALESCE(SUM(c.amount), 0)                 AS total_billed,
  COALESCE(AVG(c.amount), 0)                 AS avg_ticket,
  CURRENT_DATE - MAX(c.date)                 AS days_since_last,
  CASE
    WHEN MAX(c.date) IS NULL                         THEN 'Sem consultas'
    WHEN CURRENT_DATE - MAX(c.date) <= 60            THEN 'Ativo'
    WHEN CURRENT_DATE - MAX(c.date) <= 120           THEN 'Em risco'
    ELSE                                                  'Inativo'
  END                                        AS status
FROM public.patients p
LEFT JOIN public.consultations c ON p.id = c.patient_id
GROUP BY p.id, p.cpf, p.name, p.notes;

-- Drop and recreate monthly_summary with security_invoker
DROP VIEW IF EXISTS public.monthly_summary;
CREATE OR REPLACE VIEW public.monthly_summary
  WITH (security_invoker = true)
AS
SELECT
  TO_CHAR(month, 'YYYY-MM')                AS month,
  COALESCE(revenue, 0)                     AS revenue,
  COALESCE(consultation_count, 0)          AS consultation_count,
  COALESCE(expenses_total, 0)              AS expenses_total,
  COALESCE(revenue, 0) - COALESCE(expenses_total, 0) AS net_income
FROM (
  SELECT
    DATE_TRUNC('month', generate_series(
      (SELECT MIN(date) FROM public.consultations),
      NOW(),
      '1 month'::interval
    )) AS month
) months
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS revenue,
    COUNT(*)                  AS consultation_count
  FROM public.consultations
  GROUP BY 1
) c ON c.m = months.month
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS expenses_total
  FROM public.expenses
  GROUP BY 1
) e ON e.m = months.month
ORDER BY month DESC;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Grant view access to authenticated users
-- ─────────────────────────────────────────────────────────────
GRANT SELECT ON public.patient_crm    TO authenticated;
GRANT SELECT ON public.monthly_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION — run these SELECTs to confirm everything is set
-- ─────────────────────────────────────────────────────────────
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist:
-- SELECT tablename, policyname, roles FROM pg_policies WHERE schemaname = 'public';

-- Check views have security_invoker:
-- SELECT viewname, definition FROM pg_views WHERE schemaname = 'public';
