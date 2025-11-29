-- Ensure transactions table has UPDATE policy
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

-- Create update policy for authenticated users
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
