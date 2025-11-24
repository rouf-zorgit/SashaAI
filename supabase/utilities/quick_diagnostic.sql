-- Quick diagnostic - Run each query ONE AT A TIME and send me the results

-- QUERY 1: Does merchant_name column exist?
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'merchant_name';

-- QUERY 2: Show me recent transactions with merchant data
-- SELECT id, amount, category, merchant_name, description, created_at 
-- FROM transactions 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- QUERY 3: Check for Starbucks in the database
-- SELECT COUNT(*) as starbucks_count
-- FROM transactions 
-- WHERE merchant_name ILIKE '%starbucks%' OR description ILIKE '%starbucks%';
