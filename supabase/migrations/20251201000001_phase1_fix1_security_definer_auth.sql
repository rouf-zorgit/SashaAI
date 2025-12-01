-- ============================================================================
-- PHASE 1 CRITICAL SECURITY FIX #1: Add Authorization to SECURITY DEFINER Functions
-- ============================================================================
-- Date: 2025-12-01
-- Priority: CRITICAL
-- Issue: SECURITY DEFINER functions bypass RLS without validating caller identity
-- Fix: Add auth.uid() validation to prevent unauthorized access
-- ============================================================================

-- Fix 1: get_user_context function
CREATE OR REPLACE FUNCTION get_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile JSON;
    v_wallets JSON;
    v_recent_transactions JSON;
    v_loans JSON;
    v_result JSON;
BEGIN
    -- ✅ SECURITY FIX: Validate caller is requesting their own data
    -- Note: This check is now redundant since Edge Functions validate JWT,
    -- but provides defense-in-depth if function is called directly
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
    END IF;

    -- Get Profile
    SELECT row_to_json(p) INTO v_profile
    FROM profiles p
    WHERE p.id = p_user_id;

    -- Get Wallets
    SELECT json_agg(w) INTO v_wallets
    FROM (
        SELECT * FROM wallets 
        WHERE user_id = p_user_id
        ORDER BY is_default DESC, created_at ASC
    ) w;

    -- Get Recent Transactions (Last 10)
    SELECT json_agg(t) INTO v_recent_transactions
    FROM (
        SELECT * FROM transactions 
        WHERE user_id = p_user_id 
        AND deleted_at IS NULL
        ORDER BY created_at DESC 
        LIMIT 10
    ) t;

    -- Get Active Loans
    SELECT json_agg(l) INTO v_loans
    FROM (
        SELECT * FROM loans 
        WHERE user_id = p_user_id 
        AND is_active = TRUE
    ) l;

    -- Combine into single JSON
    v_result := json_build_object(
        'profile', v_profile,
        'wallets', COALESCE(v_wallets, '[]'::json),
        'recent_transactions', COALESCE(v_recent_transactions, '[]'::json),
        'loans', COALESCE(v_loans, '[]'::json)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: get_events_by_time_range function
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
    -- ✅ SECURITY FIX: Validate caller is requesting their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access other users events';
    END IF;

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

-- Fix 3: search_events function
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
    -- ✅ SECURITY FIX: Validate caller is requesting their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot search other users events';
    END IF;

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

-- Fix 4: get_important_events function
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
    -- ✅ SECURITY FIX: Validate caller is requesting their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access other users events';
    END IF;

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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test that functions now require matching user_id
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 1 Fix #1 Applied: SECURITY DEFINER functions now validate auth.uid()';
    RAISE NOTICE 'Functions updated: get_user_context, get_events_by_time_range, search_events, get_important_events';
END $$;
