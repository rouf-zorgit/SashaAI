-- ==========================================
-- SEED DATA FOR PATTERN RECOGNITION TESTING
-- ==========================================

-- 1. Insert Recurring "Netflix" Subscription (Monthly)
insert into transactions (user_id, amount, currency, category, description, merchant_name, created_at, type, base_amount)
select 
  id as user_id,
  1200 as amount,
  'BDT' as currency,
  'Entertainment' as category,
  'Netflix Subscription' as description,
  'Netflix' as merchant_name,
  (now() - (interval '1 month' * generate_series(1, 3))) as created_at,
  'expense' as type,
  1200 as base_amount
from profiles
limit 1;

-- 1b. Insert "Starbucks" Coffee Purchases (for smart categorization testing)
insert into transactions (user_id, amount, currency, category, description, merchant_name, created_at, type, base_amount)
select 
  id as user_id,
  350 as amount,
  'BDT' as currency,
  'Coffee' as category,
  'Starbucks Coffee' as description,
  'Starbucks' as merchant_name,
  (now() - (interval '1 day' * generate_series(1, 5))) as created_at,
  'expense' as type,
  350 as base_amount
from profiles
limit 1;


-- 2. Insert "Weekend Spike" Data (Heavy spending on last 4 Saturdays)
insert into transactions (user_id, amount, currency, category, description, merchant_name, created_at, type, base_amount)
select 
  id as user_id,
  5000 as amount,
  'BDT' as currency,
  'Dining' as category,
  'Weekend Dinner at Fancy Restaurant' as description,
  'Fancy Restaurant' as merchant_name,
  (now() - (interval '1 week' * generate_series(1, 4)) + interval '1 day') as created_at, -- Adjust to hit weekends
  'expense' as type,
  5000 as base_amount
from profiles
limit 1;

-- 3. Insert "Coffee Addiction" (Daily coffee)
insert into transactions (user_id, amount, currency, category, description, merchant_name, created_at, type, base_amount)
select 
  id as user_id,
  800 as amount, -- Increased to ensure it hits > 20% of total spend
  'BDT' as currency,
  'Coffee' as category,
  'Premium Morning Coffee' as description,
  'Starbucks' as merchant_name,
  (now() - (interval '1 day' * generate_series(1, 10))) as created_at,
  'expense' as type,
  800 as base_amount
from profiles
limit 1;
