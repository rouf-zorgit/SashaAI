-- ============================================================================
-- FINAI MVP - MASTER DEPLOYMENT SCRIPT (Supabase SQL Editor Compatible)
-- ============================================================================
-- This script deploys the complete FinAI database schema in the correct order
-- Safe to run multiple times - all scripts include existence checks
-- Last updated: 2025-11-24
-- ============================================================================
-- NOTE: Run each section separately in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CORE SCHEMA
-- ============================================================================
-- Copy and paste the contents of schema.sql here, then run
-- Or run schema.sql separately in SQL Editor

-- ============================================================================
-- STEP 2: LONG-TERM MEMORY SCHEMA
-- ============================================================================
-- Copy and paste the contents of ltm_schema.sql here, then run
-- Or run ltm_schema.sql separately in SQL Editor

-- ============================================================================
-- STEP 3: EPISODIC MEMORY SCHEMA
-- ============================================================================
-- Copy and paste the contents of episodic_schema.sql here, then run
-- Or run episodic_schema.sql separately in SQL Editor

-- ============================================================================
-- STEP 4: PATTERN RECOGNITION SCHEMA
-- ============================================================================
-- Copy and paste the contents of pattern_schema.sql here, then run
-- Or run pattern_schema.sql separately in SQL Editor

-- ============================================================================
-- STEP 5: MERCHANT COLUMN MIGRATION
-- ============================================================================
-- Copy and paste the contents of migrations/add_merchant_column.sql here
-- Or run migrations/add_merchant_column.sql separately in SQL Editor

-- ============================================================================
-- STEP 6: PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Copy and paste the contents of utilities/optimize_indexes.sql here
-- Or run utilities/optimize_indexes.sql separately in SQL Editor

-- ============================================================================
-- STEP 7: SECURITY VERIFICATION
-- ============================================================================
-- Copy and paste the contents of utilities/verify_rls.sql here
-- Or run utilities/verify_rls.sql separately in SQL Editor

-- ============================================================================
-- STEP 8: CRON JOBS
-- ============================================================================
-- Copy and paste the contents of cron_jobs.sql here
-- Or run cron_jobs.sql separately in SQL Editor

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables (should be 13)
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes (should be 63)
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check cron jobs (should be 1)
SELECT jobname, schedule, active 
FROM cron.job;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Expected Results:
-- - 13 tables created
-- - 63 indexes created
-- - 1 active cron job (detect-patterns-daily)
-- - All RLS policies enabled
-- ============================================================================
