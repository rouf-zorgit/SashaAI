-- ============================================================================
-- LONG-TERM MEMORY (LTM) SCHEMA
-- ============================================================================
-- This schema adds memory capabilities to Sasha AI
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MEMORY EVENTS TABLE
-- ============================================================================
-- Stores important information extracted from conversations

CREATE TABLE IF NOT EXISTS memory_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    kind TEXT CHECK (kind IN ('general', 'preference', 'goal', 'pattern', 'personal')) NOT NULL,
    data JSONB NOT NULL,
    salience INTEGER CHECK (salience BETWEEN 1 AND 5) DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own memory events" 
        ON memory_events FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can insert memory events" 
        ON memory_events FOR INSERT 
        WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can update memory events" 
        ON memory_events FOR UPDATE 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_memory_events_user ON memory_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_events_kind ON memory_events(kind);
CREATE INDEX IF NOT EXISTS idx_memory_events_salience ON memory_events(salience DESC);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
-- Stores user communication and financial preferences

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    communication_style TEXT CHECK (communication_style IN ('Direct', 'Friendly', 'Professional', 'Casual')) DEFAULT 'Direct',
    financial_goal TEXT CHECK (financial_goal IN ('Save Money', 'Pay Off Debt', 'Build Wealth', 'Budget Better', 'Invest')) DEFAULT 'Save Money',
    risk_tolerance TEXT CHECK (risk_tolerance IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    forbidden_words TEXT[] DEFAULT '{}',
    sarcasm_level TEXT CHECK (sarcasm_level IN ('None', 'Low', 'Medium', 'High')) DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own preferences" 
        ON user_preferences FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own preferences" 
        ON user_preferences FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own preferences" 
        ON user_preferences FOR UPDATE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can upsert preferences" 
        ON user_preferences FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER SPENDING PATTERNS TABLE
-- ============================================================================
-- Stores detected spending patterns and behaviors

CREATE TABLE IF NOT EXISTS user_spending_patterns (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    weekend_spike BOOLEAN DEFAULT FALSE,
    payday_pattern BOOLEAN DEFAULT FALSE,
    stress_shopping BOOLEAN DEFAULT FALSE,
    impulse_categories TEXT[] DEFAULT '{}',
    avg_daily_spend NUMERIC(12,2),
    top_category TEXT,
    spending_personality TEXT CHECK (spending_personality IN ('Saver', 'Spender', 'Balanced')) DEFAULT 'Balanced',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_spending_patterns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own spending patterns" 
        ON user_spending_patterns FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own spending patterns" 
        ON user_spending_patterns FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own spending patterns" 
        ON user_spending_patterns FOR UPDATE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can upsert spending patterns" 
        ON user_spending_patterns FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_spending_patterns_updated_at ON user_spending_patterns;
CREATE TRIGGER update_user_spending_patterns_updated_at
    BEFORE UPDATE ON user_spending_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ALTER PROFILES TABLE
-- ============================================================================
-- Add missing columns for LTM functionality

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS income_monthly NUMERIC(12,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'O0';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_onboarding_prompt TIMESTAMPTZ;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================
-- Function to clean up expired memory events

CREATE OR REPLACE FUNCTION cleanup_expired_memory_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM memory_events WHERE expires_at < NOW();
END;
$$;

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
    ('memory_events'),
    ('user_preferences'),
    ('user_spending_patterns')
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
    ('onboarding_step', 'text'),
    ('last_onboarding_prompt', 'timestamp with time zone')
) AS t(column_name, data_type)
ORDER BY column_name;

-- ============================================================================
-- LTM SCHEMA COMPLETE
-- ============================================================================
