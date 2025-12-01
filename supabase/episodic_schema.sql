-- ============================================================================
-- EPISODIC MEMORY SCHEMA
-- ============================================================================
-- This schema adds episodic memory capabilities to Sasha AI
-- Stores specific events and experiences for temporal recall
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EVENT TYPE ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        'transaction',
        'conversation',
        'goal',
        'decision',
        'milestone',
        'achievement',
        'pattern_detected'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- EPISODIC EVENTS TABLE
-- ============================================================================
-- Stores specific events and experiences with rich metadata

CREATE TABLE IF NOT EXISTS episodic_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    event_type event_type NOT NULL,
    event_data JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    importance INTEGER CHECK (importance BETWEEN 1 AND 10) DEFAULT 5,
    tags TEXT[] DEFAULT '{}',
    summary TEXT NOT NULL,
    related_to UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE episodic_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

DO $$ BEGIN
    CREATE POLICY "Users can view own events" 
        ON episodic_events FOR SELECT 
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can insert events" 
        ON episodic_events FOR INSERT 
        WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can update events" 
        ON episodic_events FOR UPDATE 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "System can delete events" 
        ON episodic_events FOR DELETE 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_episodic_user_time ON episodic_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_episodic_type ON episodic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_episodic_importance ON episodic_events(importance DESC);
CREATE INDEX IF NOT EXISTS idx_episodic_tags ON episodic_events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_episodic_data ON episodic_events USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_episodic_user_type ON episodic_events(user_id, event_type);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get events by time range
CREATE OR REPLACE FUNCTION get_events_by_time_range(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    event_type event_type,
    event_data JSONB,
    occurred_at TIMESTAMPTZ,
    importance INTEGER,
    tags TEXT[],
    summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.event_data,
        e.occurred_at,
        e.importance,
        e.tags,
        e.summary
    FROM episodic_events e
    WHERE e.user_id = p_user_id
        AND e.occurred_at >= p_start_date
        AND e.occurred_at <= p_end_date
    ORDER BY e.occurred_at DESC;
END;
$$;

-- Function to search events by text
CREATE OR REPLACE FUNCTION search_events(
    p_user_id UUID,
    p_search_term TEXT
)
RETURNS TABLE (
    id UUID,
    event_type event_type,
    event_data JSONB,
    occurred_at TIMESTAMPTZ,
    importance INTEGER,
    tags TEXT[],
    summary TEXT,
    relevance REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.event_data,
        e.occurred_at,
        e.importance,
        e.tags,
        e.summary,
        CASE 
            WHEN e.summary ILIKE '%' || p_search_term || '%' THEN 1.0
            WHEN p_search_term = ANY(e.tags) THEN 0.8
            ELSE 0.5
        END as relevance
    FROM episodic_events e
    WHERE e.user_id = p_user_id
        AND (
            e.summary ILIKE '%' || p_search_term || '%'
            OR p_search_term = ANY(e.tags)
            OR e.event_data::text ILIKE '%' || p_search_term || '%'
        )
    ORDER BY relevance DESC, e.importance DESC, e.occurred_at DESC
    LIMIT 10;
END;
$$;

-- Function to get most important events
CREATE OR REPLACE FUNCTION get_important_events(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    event_type event_type,
    event_data JSONB,
    occurred_at TIMESTAMPTZ,
    importance INTEGER,
    tags TEXT[],
    summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.event_data,
        e.occurred_at,
        e.importance,
        e.tags,
        e.summary
    FROM episodic_events e
    WHERE e.user_id = p_user_id
    ORDER BY e.importance DESC, e.occurred_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to cleanup old low-importance events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_episodes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM episodic_events 
    WHERE importance < 5 
        AND occurred_at < NOW() - INTERVAL '90 days';
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
    ('episodic_events')
) AS t(table_name);

-- Verify event_type enum
SELECT 
    'event_type' as enum_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'event_type')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ============================================================================
-- EPISODIC MEMORY SCHEMA COMPLETE
-- ============================================================================
