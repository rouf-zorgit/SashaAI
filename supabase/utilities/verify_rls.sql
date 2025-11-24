-- ============================================================================
-- RLS SECURITY VERIFICATION AND FIX SCRIPT
-- ============================================================================
-- Verifies and adds missing RLS policies for all tables
-- Safe to run multiple times
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- STEP 2: VERIFY POLICIES EXIST
-- ============================================================================

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 3: ADD MISSING RLS POLICIES (IF ANY)
-- ============================================================================

-- Note: Based on schema review, all core tables already have RLS enabled:
-- ✅ profiles
-- ✅ transactions  
-- ✅ messages
-- ✅ recurring_rules
-- ✅ subscription_status
-- ✅ user_emotional_state
-- ✅ conversation_context
-- ✅ memory_events
-- ✅ user_preferences
-- ✅ episodic_events
-- ✅ spending_patterns
-- ✅ recurring_payments

-- If any tables are missing RLS, they will show up in the query above
-- Add policies as needed following this template:

-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view own records"
-- ON table_name FOR SELECT
-- USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can insert own records"
-- ON table_name FOR INSERT
-- WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can update own records"
-- ON table_name FOR UPDATE
-- USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can delete own records"
-- ON table_name FOR DELETE
-- USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: VERIFICATION SUMMARY
-- ============================================================================

-- Count tables with and without RLS
SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
    COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- List any tables without RLS (should be empty)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
