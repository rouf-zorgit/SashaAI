-- ==========================================
-- SASHA AI - 8 CORE SYSTEMS DIAGNOSTIC
-- ==========================================

-- 1. Check if merchant_name column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'merchant_name';

-- 2. Check if Starbucks transactions exist with merchant_name
SELECT id, amount, category, merchant_name, created_at 
FROM transactions 
WHERE merchant_name ILIKE '%starbucks%' 
LIMIT 5;

-- 3. Verify all required tables exist
SELECT table_name, 
       CASE 
           WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name)
           THEN '✅ EXISTS'
           ELSE '❌ MISSING'
       END as status
FROM (VALUES 
    ('profiles'),
    ('transactions'),
    ('messages'),
    ('recurring_payments'),
    ('spending_patterns'),
    ('user_emotional_state'),
    ('conversation_context'),
    ('episodic_events'),
    ('user_preferences'),
    ('memory_events')
) AS t(table_name)
ORDER BY table_name;

-- 4. Check recent transactions (to see what's actually being saved)
SELECT id, amount, category, merchant_name, description, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if recurring_payments has data
SELECT COUNT(*) as recurring_bills_count FROM recurring_payments;

-- 6. Check if spending_patterns has data
SELECT COUNT(*) as patterns_count, 
       STRING_AGG(DISTINCT pattern_type, ', ') as pattern_types
FROM spending_patterns;

-- 7. Check emotional state tracking
SELECT COUNT(*) as emotion_records FROM user_emotional_state;

-- 8. Check episodic memory
SELECT COUNT(*) as episodic_events FROM episodic_events;
