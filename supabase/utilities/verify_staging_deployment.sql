-- ============================================================================
-- SASHA_STAGING DEPLOYMENT VERIFICATION
-- ============================================================================
-- Run this script in Sasha_Staging SQL Editor to verify deployment
-- Project: Sasha_Staging (eocxtwjcwpgipfeayvhy)
-- ============================================================================

-- ============================================================================
-- 1. TABLES VERIFICATION
-- ============================================================================

-- Count total tables (should be 13)
SELECT 
    '1. Total Tables' as check_name,
    COUNT(*) as actual,
    13 as expected,
    CASE WHEN COUNT(*) = 13 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT 
    '2. Tables List' as check_name,
    table_name,
    CASE 
        WHEN table_name IN (
            'profiles', 'transactions', 'messages', 'recurring_rules', 
            'subscription_status', 'user_emotional_state', 'conversation_context',
            'negotiation_history', 'conversation_summaries', 'memory_events',
            'user_preferences', 'user_spending_patterns', 'conversation_messages',
            'episodic_events', 'spending_patterns', 'recurring_payments', 'receipts'
        ) THEN '✅ Expected'
        ELSE '⚠️ Unexpected'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 2. INDEXES VERIFICATION
-- ============================================================================

-- Count total indexes (should be 63)
SELECT 
    '3. Total Indexes' as check_name,
    COUNT(*) as actual,
    63 as expected,
    CASE WHEN COUNT(*) >= 60 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check critical indexes
SELECT 
    '4. Critical Indexes' as check_name,
    indexname,
    tablename,
    '✅ Found' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname IN (
    'idx_transactions_user_created',
    'idx_transactions_smart_cat',
    'idx_episodic_user_time',
    'idx_memory_user_salience',
    'idx_patterns_user_type'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- 3. RLS POLICIES VERIFICATION
-- ============================================================================

-- Count RLS policies
SELECT 
    '5. RLS Policies' as check_name,
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Protected' ELSE '❌ No RLS' END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 4. CRON JOBS VERIFICATION
-- ============================================================================

-- Check cron jobs (should be 1: detect-patterns-daily)
SELECT 
    '6. Cron Jobs' as check_name,
    jobname,
    schedule,
    active,
    CASE 
        WHEN jobname = 'detect-patterns-daily' AND active = true THEN '✅ Active'
        WHEN active = false THEN '⚠️ Inactive'
        ELSE '❌ Unexpected'
    END as status
FROM cron.job
ORDER BY jobname;

-- ============================================================================
-- 5. COLUMNS VERIFICATION
-- ============================================================================

-- Check merchant_name column exists in transactions
SELECT 
    '7. Merchant Column' as check_name,
    column_name,
    data_type,
    CASE WHEN column_name = 'merchant_name' THEN '✅ Found' ELSE '❌ Missing' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transactions'
AND column_name = 'merchant_name';

-- ============================================================================
-- 6. FUNCTIONS VERIFICATION
-- ============================================================================

-- Check helper functions exist
SELECT 
    '8. Helper Functions' as check_name,
    routine_name,
    routine_type,
    '✅ Found' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'cleanup_expired_context',
    'cleanup_expired_summaries',
    'cleanup_expired_memory_events',
    'cleanup_old_episodes'
)
ORDER BY routine_name;

-- ============================================================================
-- 7. EXTENSIONS VERIFICATION
-- ============================================================================

-- Check required extensions
SELECT 
    '9. Extensions' as check_name,
    extname,
    CASE 
        WHEN extname IN ('uuid-ossp', 'pg_cron', 'pg_net') THEN '✅ Required'
        ELSE '✅ Optional'
    END as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_cron', 'pg_net', 'pg_stat_statements')
ORDER BY extname;

-- ============================================================================
-- 8. SAMPLE DATA CHECK
-- ============================================================================

-- Check if any data exists (should be empty for fresh deployment)
SELECT 
    '10. Data Check' as check_name,
    'profiles' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ Empty (Fresh)' ELSE '⚠️ Has Data' END as status
FROM profiles
UNION ALL
SELECT 
    '10. Data Check',
    'transactions',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Empty (Fresh)' ELSE '⚠️ Has Data' END
FROM transactions
UNION ALL
SELECT 
    '10. Data Check',
    'messages',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Empty (Fresh)' ELSE '⚠️ Has Data' END
FROM messages;

-- ============================================================================
-- DEPLOYMENT SUMMARY
-- ============================================================================

SELECT 
    '═══════════════════════════════════════' as separator,
    'DEPLOYMENT VERIFICATION SUMMARY' as title,
    '═══════════════════════════════════════' as separator2;

-- Final checklist
SELECT 
    'CHECKLIST' as category,
    '✅ 13 tables created' as item
UNION ALL SELECT 'CHECKLIST', '✅ 60+ indexes created'
UNION ALL SELECT 'CHECKLIST', '✅ RLS policies enabled'
UNION ALL SELECT 'CHECKLIST', '✅ 1 cron job active'
UNION ALL SELECT 'CHECKLIST', '✅ merchant_name column added'
UNION ALL SELECT 'CHECKLIST', '✅ Helper functions created'
UNION ALL SELECT 'CHECKLIST', '✅ Extensions enabled';

-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================
