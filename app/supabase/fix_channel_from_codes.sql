-- ─────────────────────────────────────────────────────────────
-- Run this ONLY if you already imported data with the old script
-- (which defaulted all historical records to PRESENCIAL).
-- This wipes consultations and re-imports cleanly via the script.
--
-- Alternatively, if you know all existing rows are wrong, just
-- delete them and re-run import_data.py:
-- ─────────────────────────────────────────────────────────────

-- Option A – delete all consultations and re-run import_data.py (recommended)
-- TRUNCATE consultations;

-- Option B – manual correction based on the original code mapping.
-- Code 100 rows were Online, Code 101 were Presencial.
-- Since the original code is not stored in the DB, the cleanest
-- path is Option A (truncate + re-import with the fixed script).

-- After truncating, run:
--   python scripts/import_data.py
-- The updated script correctly maps 100→ONLINE and 101→PRESENCIAL.
