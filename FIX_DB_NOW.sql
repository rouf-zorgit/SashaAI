-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON transactions;
DROP POLICY IF EXISTS "update_own_transactions" ON transactions;

-- 2. Create the CORRECT policy with WITH CHECK clause
CREATE POLICY "Users can update own transactions" 
ON transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Verify it exists (optional)
SELECT * FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'UPDATE';
