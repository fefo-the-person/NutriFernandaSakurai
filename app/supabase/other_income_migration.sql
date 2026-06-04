-- ─────────────────────────────────────────────────────────────
-- OTHER INCOME – migration
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- TABLE
CREATE TABLE other_income (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  category    VARCHAR(100) NOT NULL,
  description VARCHAR(200) NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE other_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users_all" ON other_income FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.other_income TO authenticated;
REVOKE ALL ON public.other_income FROM anon;

-- ─────────────────────────────────────────────────────────────
-- Update monthly_summary view to include other_income in revenue
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
    DATE_TRUNC('month', generate_series(
      LEAST(
        (SELECT MIN(date) FROM consultations),
        (SELECT MIN(date) FROM other_income)
      ),
      NOW(),
      '1 month'::interval
    )) AS month
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
