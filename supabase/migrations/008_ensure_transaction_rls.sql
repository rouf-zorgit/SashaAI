-- Ensure transactions table has correct RLS policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Create insert policy
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure select policy exists
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
