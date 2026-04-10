-- Migration: add channel to consultations
-- Run this in Supabase SQL Editor if you already ran schema.sql

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'PRESENCIAL'
  CHECK (channel IN ('ONLINE', 'PRESENCIAL'));
