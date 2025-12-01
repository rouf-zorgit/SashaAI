-- ============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- Task 5.2: Database Query Performance
-- ============================================

-- ============================================
-- CREATE MISSING TABLES (If they don't exist)
-- ============================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    receipt_url TEXT NOT NULL,
    merchant_name TEXT,
    amount DECIMAL(12,2),
    date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    from_wallet_id UUID REFERENCES wallets(id) NOT NULL,
    to_wallet_id UUID REFERENCES wallets(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    wallet_id UUID REFERENCES wallets(id) NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts') THEN
        CREATE POLICY "Users can manage their own receipts" ON receipts USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transfers') THEN
        CREATE POLICY "Users can manage their own transfers" ON wallet_transfers USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans') THEN
        CREATE POLICY "Users can manage their own loans" ON loans USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================

-- Index for user-based queries with date sorting
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for wallet-based queries with date sorting
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date 
ON transactions(wallet_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for type-based queries (income/expense filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(user_id, type, created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for category-based aggregations
CREATE INDEX IF NOT EXISTS idx_transactions_category 
ON transactions(user_id, category, type, created_at DESC) 
WHERE deleted_at IS NULL;

-- Composite index for monthly reports
CREATE INDEX IF NOT EXISTS idx_transactions_monthly 
ON transactions(user_id, date, type) 
WHERE deleted_at IS NULL;

-- ============================================
-- WALLETS TABLE INDEXES
-- ============================================

-- Index for user wallet queries with default sorting
CREATE INDEX IF NOT EXISTS idx_wallets_user 
ON wallets(user_id, is_default DESC, created_at ASC)
WHERE is_locked = false;

-- Index for wallet lookups by ID and user
CREATE INDEX IF NOT EXISTS idx_wallets_user_id 
ON wallets(user_id, id);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

-- Index for chat session queries
CREATE INDEX IF NOT EXISTS idx_messages_user_session 
ON messages(user_id, session_id, created_at ASC);

-- Index for user message history
CREATE INDEX IF NOT EXISTS idx_messages_user_date 
ON messages(user_id, created_at DESC);

-- ============================================
-- RECEIPTS TABLE INDEXES (Table may not exist yet)
-- ============================================

-- Index for user receipt queries with date sorting
CREATE INDEX IF NOT EXISTS idx_receipts_user_date 
ON receipts(user_id, created_at DESC);

-- Index for transaction-linked receipts
CREATE INDEX IF NOT EXISTS idx_receipts_transaction 
ON receipts(transaction_id);

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Index for profile lookups (should already exist as primary key)
-- CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ============================================
-- WALLET_TRANSFERS TABLE INDEXES (Table may not exist yet)
-- ============================================

-- Index for user transfer history
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_user 
ON wallet_transfers(user_id, created_at DESC);

-- Index for wallet-specific transfers
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_from 
ON wallet_transfers(from_wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transfers_to 
ON wallet_transfers(to_wallet_id, created_at DESC);

-- ============================================
-- LOANS TABLE INDEXES (Table may not exist yet)
-- ============================================

-- Index for user loans
CREATE INDEX IF NOT EXISTS idx_loans_user 
ON loans(user_id, is_active, created_at DESC);

-- Index for wallet-specific loans
CREATE INDEX IF NOT EXISTS idx_loans_wallet 
ON loans(wallet_id, is_active);

-- ============================================
-- VERIFY INDEXES
-- ============================================

-- Run this query to see all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE transactions;
ANALYZE wallets;
ANALYZE messages;
ANALYZE receipts;
ANALYZE profiles;
ANALYZE wallet_transfers;

-- ============================================
-- PERFORMANCE TESTING QUERIES (Examples)
-- ============================================

-- Run these manually with real IDs to test performance

-- Test Query 1: Get user context (should be <100ms)
-- EXPLAIN ANALYZE
-- SELECT 
--     p.*,
--     (SELECT json_agg(w.*) FROM wallets w WHERE w.user_id = p.id AND w.is_locked = false) as wallets,
--     (SELECT COUNT(*) FROM transactions t WHERE t.user_id = p.id AND t.deleted_at IS NULL) as transaction_count
-- FROM profiles p
-- WHERE p.id = 'YOUR_USER_ID_HERE';

-- Test Query 2: Get transactions for wallet (should be <50ms)
-- EXPLAIN ANALYZE
-- SELECT * FROM transactions
-- WHERE wallet_id = 'YOUR_WALLET_ID_HERE'
--   AND deleted_at IS NULL
-- ORDER BY created_at DESC
-- LIMIT 100;

-- Test Query 3: Get monthly spending by category (should be <100ms)
-- EXPLAIN ANALYZE
-- SELECT 
--     category,
--     SUM(amount) as total,
--     COUNT(*) as count
-- FROM transactions
-- WHERE user_id = 'YOUR_USER_ID_HERE'
--   AND type = 'expense'
--   AND deleted_at IS NULL
--   AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
--   AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
-- GROUP BY category
-- ORDER BY total DESC;

-- Test Query 4: Get wallet balances (should be <20ms)
-- EXPLAIN ANALYZE
-- SELECT id, name, balance, currency, type
-- FROM wallets
-- WHERE user_id = 'YOUR_USER_ID_HERE'
--   AND is_locked = false
-- ORDER BY is_default DESC, created_at ASC;

-- ============================================
-- NOTES
-- ============================================

/*
1. All indexes use "IF NOT EXISTS" to prevent errors on re-run
2. Partial indexes (WHERE clauses) reduce index size and improve performance
3. DESC indexes optimize ORDER BY DESC queries
4. Composite indexes match common query patterns
5. Run ANALYZE after creating indexes to update statistics
6. Monitor index usage with pg_stat_user_indexes
7. Drop unused indexes to save space and write performance
*/

-- Check index usage statistics
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- COMPLETION
-- ============================================

-- After running this script:
-- 1. Verify all indexes were created successfully
-- 2. Run EXPLAIN ANALYZE on critical queries
-- 3. Check that indexes are being used
-- 4. Document query execution times
-- 5. Compare before/after performance

SELECT 'Database indexes created successfully!' as status;
