-- ============================================================================
-- CLEANUP OLD CRON JOBS - SAFE VERSION
-- ============================================================================
-- Removes cron jobs by ID instead of name to avoid errors
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's see what jobs exist
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
ORDER BY jobname;

-- Remove jobs by ID (safer than by name)
-- This will show which jobs were removed
DO $$
DECLARE
    job_record RECORD;
BEGIN
    FOR job_record IN 
        SELECT jobid, jobname 
        FROM cron.job 
        WHERE jobname IN (
            'check-badges-daily',
            'predict-cashflow-daily', 
            'generate-notifications-hourly',
            'update-streaks-daily'
        )
    LOOP
        PERFORM cron.unschedule(job_record.jobid);
        RAISE NOTICE 'Removed job: % (ID: %)', job_record.jobname, job_record.jobid;
    END LOOP;
END $$;

-- Verify only detect-patterns-daily remains
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN jobname = 'detect-patterns-daily' THEN '✅ KEEP'
        ELSE '⚠️ UNEXPECTED'
    END as status
FROM cron.job
ORDER BY jobname;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
