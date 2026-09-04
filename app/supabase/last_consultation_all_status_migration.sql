-- ─────────────────────────────────────────────────────────────
-- LAST CONSULTATION – count unpaid consultations too
--
-- The paid_status_migration made patient_crm's last_consultation,
-- days_since_last and Ativo/Em risco/Inativo status paid-only,
-- along with the financial totals (total_billed, avg_ticket,
-- total_consultations). On reflection, "last consultation" should
-- reflect that the patient actually showed up, whether or not
-- she's been paid yet — only the financial figures should stay
-- paid-only.
--
-- This migration re-splits patient_crm:
--   • first_consultation / last_consultation / days_since_last /
--     status  → computed from ALL consultations (paid or not)
--   • total_consultations / total_billed / avg_ticket → still
--     paid-only
--
-- Run this once in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW patient_crm WITH (security_invoker = true) AS
SELECT
  p.id,
  p.cpf,
  p.name,
  p.notes,
  MIN(c.date)                                              AS first_consultation,
  MAX(c.date)                                              AS last_consultation,
  COUNT(c.id) FILTER (WHERE c.paid = true)                 AS total_consultations,
  COALESCE(SUM(c.amount) FILTER (WHERE c.paid = true), 0)  AS total_billed,
  COALESCE(AVG(c.amount) FILTER (WHERE c.paid = true), 0)  AS avg_ticket,
  CURRENT_DATE - MAX(c.date)                               AS days_since_last,
  CASE
    WHEN MAX(c.date) IS NULL                         THEN 'Sem consultas'
    WHEN CURRENT_DATE - MAX(c.date) <= 60            THEN 'Ativo'
    WHEN CURRENT_DATE - MAX(c.date) <= 120           THEN 'Em risco'
    ELSE                                                  'Inativo'
  END                                                      AS status
FROM patients p
LEFT JOIN consultations c ON p.id = c.patient_id
GROUP BY p.id, p.cpf, p.name, p.notes;

GRANT SELECT ON public.patient_crm TO authenticated;
REVOKE ALL ON public.patient_crm FROM anon;
