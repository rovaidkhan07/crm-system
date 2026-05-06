-- ============================================================
-- CRM Lead System – Supabase Database Setup Script
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  extra_questions  TEXT,
  company_size     TEXT,
  company_revenue  TEXT,
  appointment_date DATE,
  appointment_time TEXT,
  pipeline_stage   TEXT NOT NULL DEFAULT 'Lead'
                   CHECK (pipeline_stage IN ('Lead', 'Appointment', 'Qualified', 'Not Interested', 'Sold')),
  amount_paid      NUMERIC(12, 2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create the blocked_dates table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage  ON public.leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_email           ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_phone           ON public.leads (phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date    ON public.blocked_dates (date);

-- 4. Enable Row Level Security (open access – no auth required)
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies – allow all operations from the anon key (no auth roles)
-- Leads table
CREATE POLICY "Allow anon read leads"
  ON public.leads FOR SELECT USING (true);

CREATE POLICY "Allow anon insert leads"
  ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update leads"
  ON public.leads FOR UPDATE USING (true) WITH CHECK (true);

-- Blocked dates table
CREATE POLICY "Allow anon read blocked_dates"
  ON public.blocked_dates FOR SELECT USING (true);

CREATE POLICY "Allow anon insert blocked_dates"
  ON public.blocked_dates FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon delete blocked_dates"
  ON public.blocked_dates FOR DELETE USING (true);

-- ============================================================
-- Done! Your tables and policies are ready.
-- ============================================================
