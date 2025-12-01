-- Ensure date column exists in transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW();

-- Create index for date if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- Force schema cache reload (Supabase specific)
NOTIFY pgrst, 'reload schema';
