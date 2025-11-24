-- Add merchant_name column to transactions table
alter table transactions add column if not exists merchant_name text;

-- Update existing rows to have a default value (optional, using description as fallback)
update transactions 
set merchant_name = description 
where merchant_name is null;

-- Index for faster lookup during categorization
create index if not exists idx_transactions_merchant on transactions(merchant_name);
