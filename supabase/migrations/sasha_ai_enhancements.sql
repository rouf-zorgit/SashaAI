-- ============================================================================
-- SASHA AI SYSTEMS - DATABASE ENHANCEMENTS
-- ============================================================================
-- This migration adds all necessary columns and tables for the 8 AI systems
-- Safe to run multiple times - includes existence checks
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SYSTEM 1: LONG-TERM MEMORY (LTM) ENHANCEMENTS
-- ============================================================================

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS income_monthly NUMERIC(12,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_day INTEGER CHECK (salary_day BETWEEN 1 AND 31);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fixed_costs JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'O0';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_onboarding_prompt TIMESTAMPTZ;

-- Create index for faster salary_day lookups
CREATE INDEX IF NOT EXISTS idx_profiles_salary_day ON profiles(salary_day);

-- ============================================================================
-- SYSTEM 6: TRANSACTION BRAIN ENHANCEMENTS
-- ============================================================================

-- Add missing columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('chat', 'ocr', 'manual', 'import')) DEFAULT 'manual';

-- Create indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(user_id, merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);

-- Undo Stack Table
CREATE TABLE IF NOT EXISTS transaction_undo_stack (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    transaction_id UUID NOT NULL,
    transaction_data JSONB NOT NULL,
    action TEXT CHECK (action IN ('create', 'update', 'delete')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transaction_undo_stack ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own undo stack" 
        ON transaction_undo_stack FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can manage undo stack" 
        ON transaction_undo_stack FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_undo_stack_user ON transaction_undo_stack(user_id, created_at DESC);

-- Function to cleanup old undo stack (keep last 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_undo_stack()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM transaction_undo_stack
    WHERE id IN (
        SELECT id FROM transaction_undo_stack
        WHERE user_id IN (
            SELECT DISTINCT user_id FROM transaction_undo_stack
        )
        ORDER BY created_at DESC
        OFFSET 10
    );
END;
$$;

-- ============================================================================
-- SYSTEM 7: SPAM/REPETITION CONTROLLER
-- ============================================================================

-- Spam Tracker Table
CREATE TABLE IF NOT EXISTS spam_tracker (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID NOT NULL,
    message_hash TEXT NOT NULL,
    repetition_count INTEGER DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spam_tracker ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own spam tracker" 
        ON spam_tracker FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can manage spam tracker" 
        ON spam_tracker FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_spam_tracker_session ON spam_tracker(session_id, message_hash);
CREATE INDEX IF NOT EXISTS idx_spam_tracker_user ON spam_tracker(user_id, last_seen DESC);

-- Function to cleanup old spam tracker (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_spam_tracker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM spam_tracker WHERE last_seen < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================================================
-- SYSTEM 5: PATTERN RECOGNITION ENHANCEMENTS
-- ============================================================================

-- Sudden Spike Patterns Table
CREATE TABLE IF NOT EXISTS sudden_spike_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    spike_percentage NUMERIC(5,2) NOT NULL,
    average_amount NUMERIC(12,2) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE
);

ALTER TABLE sudden_spike_patterns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own spike patterns" 
        ON sudden_spike_patterns FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can manage spike patterns" 
        ON sudden_spike_patterns FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_spike_patterns_user ON sudden_spike_patterns(user_id, detected_at DESC);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name)
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('transaction_undo_stack'),
    ('spam_tracker'),
    ('sudden_spike_patterns')
) AS t(table_name)
ORDER BY table_name;

-- Verify profiles columns
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('name', 'text'),
    ('income_monthly', 'numeric'),
    ('salary_day', 'integer'),
    ('fixed_costs', 'jsonb'),
    ('onboarding_step', 'text'),
    ('last_onboarding_prompt', 'timestamp with time zone')
) AS t(column_name, data_type)
ORDER BY column_name;

-- Verify transactions columns
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('merchant_name', 'text'),
    ('occurred_at', 'timestamp with time zone'),
    ('source', 'text')
) AS t(column_name, data_type)
ORDER BY column_name;

-- ============================================================================
-- SCHEMA ENHANCEMENTS COMPLETE
-- ============================================================================
