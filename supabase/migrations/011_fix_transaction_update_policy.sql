-- Fix transaction UPDATE policy to include WITH CHECK clause
-- This ensures users can update their own transactions

-- Drop and recreate the policy with both USING and WITH CHECK
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

CREATE POLICY "Users can update own transactions" 
ON transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
