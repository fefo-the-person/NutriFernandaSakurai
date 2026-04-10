-- ─────────────────────────────────────────────────────────────
-- NUTRI FERNANDA SAKURAI – Database Schema
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- PATIENTS
CREATE TABLE patients (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf         VARCHAR(11) UNIQUE,
  name        VARCHAR(200) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CONSULTATIONS
CREATE TABLE consultations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  channel     VARCHAR(20) DEFAULT 'PRESENCIAL' CHECK (channel IN ('ONLINE', 'PRESENCIAL')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE expenses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  category    VARCHAR(100),
  description VARCHAR(200) NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CRM VIEW – per-patient aggregated metrics
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW patient_crm AS
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
LEFT JOIN consultations c ON p.id = c.patient_id
GROUP BY p.id, p.cpf, p.name, p.notes;

-- ─────────────────────────────────────────────────────────────
-- MONTHLY SUMMARY VIEW
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  TO_CHAR(month, 'YYYY-MM')                AS month,
  COALESCE(revenue, 0)                     AS revenue,
  COALESCE(consultation_count, 0)          AS consultation_count,
  COALESCE(expenses_total, 0)              AS expenses_total,
  COALESCE(revenue, 0) - COALESCE(expenses_total, 0) AS net_income
FROM (
  SELECT
    DATE_TRUNC('month', generate_series(
      (SELECT MIN(date) FROM consultations),
      NOW(),
      '1 month'::interval
    )) AS month
) months
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS revenue,
    COUNT(*)                  AS consultation_count
  FROM consultations
  GROUP BY 1
) c ON c.m = months.month
LEFT JOIN (
  SELECT
    DATE_TRUNC('month', date) AS m,
    SUM(amount)               AS expenses_total
  FROM expenses
  GROUP BY 1
) e ON e.m = months.month
ORDER BY month DESC;

-- ─────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at on patients
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (enable after setting up Supabase Auth)
-- Uncomment once you have authentication set up
-- ─────────────────────────────────────────────────────────────
-- ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultations  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses       ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "auth_only" ON patients      FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "auth_only" ON consultations FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "auth_only" ON expenses      FOR ALL USING (auth.role() = 'authenticated');
