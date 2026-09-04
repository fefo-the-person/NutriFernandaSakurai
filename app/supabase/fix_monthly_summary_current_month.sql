-- ─────────────────────────────────────────────────────────────
-- FIX: monthly_summary view was skipping the current month
--
-- Root cause: generate_series(MIN(date), NOW(), '1 month') steps
-- forward using the day-of-month of the very first consultation
-- ever logged (e.g. the 15th), instead of calendar month starts.
-- Whenever "today" falls before that day-of-month in the current
-- month (e.g. today is the 4th but the series would only land on
-- the 15th), the current month's row is never generated -- so it
-- silently disappears from the Financeiro screen and its charts.
--
-- Fix: truncate both the start and end of the range to the 1st of
-- the month before generating the series, so it always aligns to
-- calendar months and always includes the current month.
--
-- Run this once in the Supabase SQL Editor.
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

GRANT SELECT ON public.monthly_summary TO authenticated;
REVOKE ALL ON public.monthly_summary FROM anon;
