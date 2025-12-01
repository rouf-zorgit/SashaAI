-- ============================================================================
-- CRON JOBS CONFIGURATION
-- ============================================================================
-- Automated tasks for FinAI MVP
-- Only includes active Edge Functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- ACTIVE CRON JOBS
-- ============================================================================

-- 1. Analyze Patterns (Daily at Midnight)
-- Detects spending patterns, recurring payments, and behavioral insights
SELECT
  cron.schedule(
    'detect-patterns-daily',
    '0 0 * * *', -- Every day at 00:00
    $$
    SELECT
      net.http_post(
        url:='https://xcwlvoqccyxnldyznxln.supabase.co/functions/v1/analyzePatterns',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjd2x2b3FjY3l4bmxkeXpueGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgxMjgyMSwiZXhwIjoyMDc5Mzg4ODIxfQ.QxmGIxPCtt5WhZ_pdXusJpvs-dhr7i64fuzNTmst9gg"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- ============================================================================
-- REMOVED CRON JOBS (Functions Deleted)
-- ============================================================================
-- The following cron jobs have been removed because their Edge Functions
-- were deleted during cleanup:
--
-- - generate-notifications-hourly (generateNotifications function deleted)
-- - update-streaks-daily (updateStreaks function deleted)
-- - check-badges-daily (checkBadges function deleted)
-- - predict-cashflow-daily (predictCashFlow function deleted)
-- ============================================================================

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check active cron jobs
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname LIKE '%daily%' OR jobname LIKE '%hourly%'
ORDER BY jobname;

-- ============================================================================
-- CRON JOBS CONFIGURATION COMPLETE
-- ============================================================================
