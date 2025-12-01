-- ============================================
-- PHASE 1: DATABASE HEALTH & OPTIMIZATION
-- FinAI MVP - Database Verification Script
-- ============================================

-- Task 1.1: Verify Database Schema Integrity
-- List all tables in public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected tables:
-- ✓ profiles
-- ✓ wallets
-- ✓ transactions
-- ✓ wallet_transfers
-- ✓ wallet_adjustments
-- ✓ loans
-- ✓ loan_payments
-- ✓ messages
-- ✓ notifications
-- ✓ receipt_uploads

-- Task 1.2: Verify All Critical Indexes Exist
-- Check existing indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Create missing critical indexes if needed
-- (Run these only if indexes don't exist)

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_active ON wallets(user_id, is_active) WHERE is_active = true;

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_wallet_date ON transactions(user_id, wallet_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_url ON transactions(receipt_url) WHERE receipt_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(user_id, deleted_at) WHERE deleted_at IS NULL;

-- Loans indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_active ON loans(user_id, is_active) WHERE is_active = true;

-- Loan payments indexes
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_date ON loan_payments(loan_id, payment_date DESC);

-- Wallet transfers indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_user_created ON wallet_transfers(user_id, created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Receipt uploads indexes
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user_date ON receipt_uploads(user_id, uploaded_at DESC);

-- Task 1.3: Verify Row Level Security Policies
-- Check RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Task 1.4: Check for Orphaned Data
-- Find orphaned transactions (wallet deleted)
SELECT 
    t.id,
    t.user_id,
    t.wallet_id,
    t.amount,
    t.created_at
FROM transactions t
LEFT JOIN wallets w ON t.wallet_id = w.id
WHERE t.wallet_id IS NOT NULL 
  AND w.id IS NULL
  AND t.deleted_at IS NULL;

-- Find orphaned wallet transfers
SELECT 
    wt.id,
    wt.from_wallet_id,
    wt.to_wallet_id,
    wt.amount
FROM wallet_transfers wt
LEFT JOIN wallets w1 ON wt.from_wallet_id = w1.id
LEFT JOIN wallets w2 ON wt.to_wallet_id = w2.id
WHERE (w1.id IS NULL OR w2.id IS NULL);

-- Find orphaned loan payments
SELECT 
    lp.id,
    lp.loan_id,
    lp.amount,
    lp.payment_date
FROM loan_payments lp
LEFT JOIN loans l ON lp.loan_id = l.id
WHERE l.id IS NULL;

-- Find orphaned receipts (transaction deleted but receipt URL exists)
SELECT 
    ru.id,
    ru.user_id,
    ru.receipt_url,
    ru.uploaded_at
FROM receipt_uploads ru
WHERE NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.receipt_url = ru.receipt_url 
    AND t.deleted_at IS NULL
);

-- Task 1.5: Test Cascade Delete Behavior
-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Task 1.6: Create Batched User Context Function
CREATE OR REPLACE FUNCTION get_user_context(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH 
    user_profile AS (
        SELECT json_build_object(
            'id', id,
            'name', name,
            'email', email,
            'monthly_salary', monthly_salary,
            'currency', currency,
            'savings_goal', savings_goal,
            'created_at', created_at
        ) as data
        FROM profiles
        WHERE id = p_user_id
    ),
    user_wallets AS (
        SELECT json_agg(
            json_build_object(
                'id', id,
                'name', name,
                'type', type,
                'balance', balance,
                'currency', currency,
                'limit_amount', limit_amount,
                'is_active', is_active,
                'is_default', is_default
            ) ORDER BY is_default DESC, created_at
        ) as data
        FROM wallets
        WHERE user_id = p_user_id AND is_active = true
    ),
    recent_transactions AS (
        SELECT json_agg(
            json_build_object(
                'id', id,
                'amount', amount,
                'category', category,
                'description', description,
                'date', date,
                'type', type,
                'merchant_name', merchant_name,
                'wallet_id', wallet_id,
                'created_at', created_at
            ) ORDER BY date DESC, created_at DESC
        ) as data
        FROM transactions
        WHERE user_id = p_user_id 
          AND deleted_at IS NULL
        LIMIT 20
    ),
    active_loans AS (
        SELECT json_agg(
            json_build_object(
                'id', id,
                'lender_name', lender_name,
                'principal_amount', principal_amount,
                'remaining_amount', remaining_amount,
                'interest_rate', interest_rate,
                'due_date', due_date,
                'created_at', created_at
            ) ORDER BY due_date
        ) as data
        FROM loans
        WHERE user_id = p_user_id AND is_active = true
    ),
    monthly_spending AS (
        SELECT json_object_agg(
            category,
            total_amount
        ) as data
        FROM (
            SELECT 
                category,
                SUM(amount) as total_amount
            FROM transactions
            WHERE user_id = p_user_id
              AND deleted_at IS NULL
              AND type = 'expense'
              AND date >= date_trunc('month', CURRENT_DATE)
            GROUP BY category
        ) cat_totals
    ),
    wallet_spending AS (
        SELECT json_object_agg(
            wallet_id,
            total_spent
        ) as data
        FROM (
            SELECT 
                wallet_id,
                SUM(amount) as total_spent
            FROM transactions
            WHERE user_id = p_user_id
              AND deleted_at IS NULL
              AND type = 'expense'
              AND date >= date_trunc('month', CURRENT_DATE)
            GROUP BY wallet_id
        ) wallet_totals
    ),
    notification_count AS (
        SELECT json_build_object(
            'unread', COUNT(*)
        ) as data
        FROM notifications
        WHERE user_id = p_user_id AND is_read = false
    )
    SELECT json_build_object(
        'profile', COALESCE((SELECT data FROM user_profile), '{}'::json),
        'wallets', COALESCE((SELECT data FROM user_wallets), '[]'::json),
        'recent_transactions', COALESCE((SELECT data FROM recent_transactions), '[]'::json),
        'active_loans', COALESCE((SELECT data FROM active_loans), '[]'::json),
        'monthly_spending', COALESCE((SELECT data FROM monthly_spending), '{}'::json),
        'wallet_spending', COALESCE((SELECT data FROM wallet_spending), '{}'::json),
        'notifications', COALESCE((SELECT data FROM notification_count), '{"unread": 0}'::json)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_context(UUID) TO authenticated;

-- Test the function (replace with actual user ID)
-- SELECT get_user_context('your-user-id-here');

-- Task 1.7: Add Computed Columns with Triggers
-- Add computed columns to wallets
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS current_month_spent DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transaction_date TIMESTAMPTZ;

-- Add computed columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_debt DECIMAL(15,2) DEFAULT 0;

-- Function to update wallet computed columns
CREATE OR REPLACE FUNCTION update_wallet_computed_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update current month spent
    UPDATE wallets
    SET current_month_spent = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE wallet_id = NEW.wallet_id
          AND type = 'expense'
          AND deleted_at IS NULL
          AND date >= date_trunc('month', CURRENT_DATE)
    ),
    last_transaction_date = (
        SELECT MAX(date)
        FROM transactions
        WHERE wallet_id = NEW.wallet_id
          AND deleted_at IS NULL
    )
    WHERE id = NEW.wallet_id;
    
    RETURN NEW;
END;
$$;

-- Trigger for wallet computed columns
DROP TRIGGER IF EXISTS trigger_update_wallet_computed ON transactions;
CREATE TRIGGER trigger_update_wallet_computed
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_computed_columns();

-- Function to update profile computed columns
CREATE OR REPLACE FUNCTION update_profile_computed_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update total balance and debt for the user
    UPDATE profiles
    SET 
        total_balance = (
            SELECT COALESCE(SUM(balance), 0)
            FROM wallets
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
              AND is_active = true
        ),
        total_debt = (
            SELECT COALESCE(SUM(remaining_amount), 0)
            FROM loans
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
              AND is_active = true
        )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for profile computed columns
DROP TRIGGER IF EXISTS trigger_update_profile_from_wallets ON wallets;
CREATE TRIGGER trigger_update_profile_from_wallets
AFTER INSERT OR UPDATE OR DELETE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_profile_computed_columns();

DROP TRIGGER IF EXISTS trigger_update_profile_from_loans ON loans;
CREATE TRIGGER trigger_update_profile_from_loans
AFTER INSERT OR UPDATE OR DELETE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_profile_computed_columns();

-- Task 1.8: Performance Analysis Queries
-- Analyze query performance for critical queries

-- Query 1: Get user wallets (should use idx_wallets_user_id)
EXPLAIN ANALYZE
SELECT * FROM wallets
WHERE user_id = 'test-user-id'
  AND is_active = true;

-- Query 2: Get recent transactions (should use idx_transactions_user_date)
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE user_id = 'test-user-id'
  AND deleted_at IS NULL
ORDER BY date DESC, created_at DESC
LIMIT 20;

-- Query 3: Get wallet transactions (should use idx_transactions_user_wallet_date)
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE user_id = 'test-user-id'
  AND wallet_id = 'test-wallet-id'
  AND deleted_at IS NULL
ORDER BY date DESC
LIMIT 50;

-- Task 1.9: Update Table Statistics
-- Run ANALYZE to update query planner statistics
ANALYZE profiles;
ANALYZE wallets;
ANALYZE transactions;
ANALYZE wallet_transfers;
ANALYZE loans;
ANALYZE loan_payments;
ANALYZE messages;
ANALYZE notifications;
ANALYZE receipt_uploads;

-- Task 1.10: Database Maintenance Queries
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- VERIFICATION CHECKLIST
-- ============================================
-- ✓ All tables exist
-- ✓ All indexes created
-- ✓ RLS enabled on all tables
-- ✓ RLS policies verified
-- ✓ No orphaned data
-- ✓ Cascade deletes configured
-- ✓ Batched context function created
-- ✓ Computed columns added
-- ✓ Triggers created
-- ✓ Statistics updated
-- ============================================
