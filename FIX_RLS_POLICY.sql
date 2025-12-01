-- CRITICAL FIX: Add WITH CHECK to transaction UPDATE policy
-- This must be run in Supabase SQL Editor

-- Step 1: Drop existing policy
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

-- Step 2: Create policy with both USING and WITH CHECK
CREATE POLICY "Users can update own transactions" 
ON transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 3: Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update own transactions';
