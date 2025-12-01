-- Add category_override field to transactions (Phase 4 fix)
-- This allows users to manually override AI-assigned categories

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category_override TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_category_override 
ON transactions(category_override) 
WHERE category_override IS NOT NULL;

-- Add comment
COMMENT ON COLUMN transactions.category_override IS 'User-specified category that overrides AI-assigned category';
