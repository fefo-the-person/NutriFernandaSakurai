-- ─────────────────────────────────────────────────────────────
-- PAID STATUS – migration
--
-- Adds a paid/unpaid status to consultations. A consultation can
-- now be logged before the patient has actually paid; while it is
-- unpaid it is excluded from every aggregate view (patient_crm,
-- monthly_summary) so it doesn't distort revenue, patient status,
-- or any other financial analysis until it's marked as paid.
--
-- Run this once in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────
-- patient_crm — only paid consultations count towards a
-- patient's totals, ticket average, last-consultation date and
-- Ativo/Em risco/Inativo status
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW patient_crm WITH (security_invoker = true) AS
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
FROM patients p
LEFT JOIN consultations c ON p.id = c.patient_id AND c.paid = true
GROUP BY p.id, p.cpf, p.name, p.notes;

-- ─────────────────────────────────────────────────────────────
-- monthly_summary — only paid consultations count as revenue
-- (keeps the other_income + current-month fixes already live)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_summary WITH (security_invoker = true) AS
SELECT
  TO_CHAR(month, 'YYYY-MM')                                              AS month,
  COALESCE(consultation_revenue, 0) + COALESCE(other_revenue, 0)        AS revenue,
  COALESCE(consultation_count, 0)                                        AS consultation_count,
  COALESCE(expenses_total, 0)                                            AS expenses_total,
  COALESCE(consultation_revenue, 0) + COALESCE(other_revenue, 0)
    - COALESCE(expenses_total, 0)                                        AS net_income
FROM (
  SELECT
    generate_series(
      DATE_TRUNC('month', LEAST(
        (SELECT MIN(date) FROM consultations),
        (SELECT MIN(date) FROM other_income)
      )),
      DATE_TRUNC('month', NOW()),
      '1 month'::interval
    ) AS month
) months
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS consultation_revenue,
    COUNT(*)                  AS consultation_count
  FROM consultations
  WHERE paid = true
  GROUP BY 1
) c ON c.m = months.month
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS other_revenue
  FROM other_income
  GROUP BY 1
) oi ON oi.m = months.month
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS expenses_total
  FROM expenses
  GROUP BY 1
) e ON e.m = months.month
ORDER BY month DESC;

GRANT SELECT ON public.patient_crm     TO authenticated;
GRANT SELECT ON public.monthly_summary TO authenticated;
REVOKE ALL ON public.patient_crm     FROM anon;
REVOKE ALL ON public.monthly_summary FROM anon;
