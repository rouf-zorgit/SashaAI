-- Phase 2.5: Performance Optimization
-- Create a function to get all user context in a single query

CREATE OR REPLACE FUNCTION get_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile JSON;
    v_wallets JSON;
    v_recent_transactions JSON;
    v_loans JSON;
    v_result JSON;
BEGIN
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
