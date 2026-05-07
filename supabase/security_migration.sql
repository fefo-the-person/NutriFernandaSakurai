-- ═══════════════════════════════════════════════════════════════
-- SEGURANÇA – Nutri Fernanda Sakurai
-- Executa no Supabase SQL Editor (uma única vez)
-- Resolve todos os avisos de segurança e aplica conformidade LGPD
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. ROW LEVEL SECURITY – bloqueia acesso público às tabelas
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────
-- 2. REMOVE acesso anônimo (anon role) das tabelas
--    Isso impede qualquer leitura sem login, mesmo com a API pública
-- ───────────────────────────────────────────────────────────────
REVOKE ALL ON public.patients      FROM anon;
REVOKE ALL ON public.consultations FROM anon;
REVOKE ALL ON public.expenses      FROM anon;

-- ───────────────────────────────────────────────────────────────
-- 3. POLÍTICAS RLS – somente usuários autenticados têm acesso
-- ───────────────────────────────────────────────────────────────

-- Remove políticas antigas se existirem (evita conflito)
DROP POLICY IF EXISTS "authenticated_users_all" ON public.patients;
DROP POLICY IF EXISTS "authenticated_users_all" ON public.consultations;
DROP POLICY IF EXISTS "authenticated_users_all" ON public.expenses;
DROP POLICY IF EXISTS "auth_only" ON public.patients;
DROP POLICY IF EXISTS "auth_only" ON public.consultations;
DROP POLICY IF EXISTS "auth_only" ON public.expenses;

-- Cria políticas: somente usuário logado pode ler/criar/editar/deletar
CREATE POLICY "somente_autenticados" ON public.patients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "somente_autenticados" ON public.consultations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "somente_autenticados" ON public.expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- 4. VIEWS – recria com security_invoker para respeitar o RLS
--    Sem isso, as views rodam como superusuário e ignoram o RLS
-- ───────────────────────────────────────────────────────────────

-- View CRM de pacientes
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
    WHEN MAX(c.date) IS NULL              THEN 'Sem consultas'
    WHEN CURRENT_DATE - MAX(c.date) <= 60 THEN 'Ativo'
    WHEN CURRENT_DATE - MAX(c.date) <= 120 THEN 'Em risco'
    ELSE                                       'Inativo'
  END                                        AS status
FROM public.patients p
LEFT JOIN public.consultations c ON p.id = c.patient_id
GROUP BY p.id, p.cpf, p.name, p.notes;

-- View resumo mensal
DROP VIEW IF EXISTS public.monthly_summary;
CREATE OR REPLACE VIEW public.monthly_summary
  WITH (security_invoker = true)
AS
SELECT
  TO_CHAR(month, 'YYYY-MM')                          AS month,
  COALESCE(revenue, 0)                               AS revenue,
  COALESCE(consultation_count, 0)                    AS consultation_count,
  COALESCE(expenses_total, 0)                        AS expenses_total,
  COALESCE(revenue, 0) - COALESCE(expenses_total, 0) AS net_income
FROM (
  SELECT DATE_TRUNC('month', generate_series(
    (SELECT MIN(date) FROM public.consultations),
    NOW(),
    '1 month'::interval
  )) AS month
) months
LEFT JOIN (
  SELECT DATE_TRUNC('month', date) AS m,
         SUM(amount)               AS revenue,
         COUNT(*)                  AS consultation_count
  FROM public.consultations GROUP BY 1
) c ON c.m = months.month
LEFT JOIN (
  SELECT DATE_TRUNC('month', date) AS m,
         SUM(amount)               AS expenses_total
  FROM public.expenses GROUP BY 1
) e ON e.m = months.month
ORDER BY month DESC;

-- ───────────────────────────────────────────────────────────────
-- 5. Permissões das views — somente usuário autenticado pode ler
-- ───────────────────────────────────────────────────────────────
REVOKE ALL ON public.patient_crm    FROM anon;
REVOKE ALL ON public.monthly_summary FROM anon;
GRANT SELECT ON public.patient_crm    TO authenticated;
GRANT SELECT ON public.monthly_summary TO authenticated;

-- ───────────────────────────────────────────────────────────────
-- VERIFICAÇÃO – rode estas queries para confirmar que tudo está ok
-- ───────────────────────────────────────────────────────────────
-- RLS ativado nas tabelas:
SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;

-- Políticas criadas:
SELECT tablename, policyname, roles, cmd
  FROM pg_policies WHERE schemaname = 'public'
  ORDER BY tablename;
