-- ============================================================================
-- SYNC DATABASE FUNCTIONS TO STAGING
-- ============================================================================
-- This migration adds all missing database functions from local to staging
-- Run this to sync local (7 functions) with staging (3 functions)
-- ============================================================================

-- Function 1: update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: cleanup_expired_context
CREATE OR REPLACE FUNCTION cleanup_expired_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM conversation_context WHERE expires_at < NOW();
END;
$$;

-- Function 3: cleanup_expired_summaries
CREATE OR REPLACE FUNCTION cleanup_expired_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM conversation_summaries WHERE expires_at < NOW();
END;
$$;

-- Function 4: cleanup_expired_memory_events
CREATE OR REPLACE FUNCTION cleanup_expired_memory_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM memory_events WHERE expires_at < NOW();
END;
$$;

-- Function 5: get_events_by_time_range
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

-- Function 6: search_events
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

-- Function 7: get_important_events
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

-- Function 8: cleanup_old_episodes
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
-- VERIFICATION
-- ============================================================================
SELECT 
    routine_name as function_name,
    '✅ CREATED' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'update_updated_at_column',
        'cleanup_expired_context',
        'cleanup_expired_summaries',
        'cleanup_expired_memory_events',
        'get_events_by_time_range',
        'search_events',
        'get_important_events',
        'cleanup_old_episodes'
    )
ORDER BY routine_name;
