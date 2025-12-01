-- Fix transaction UPDATE RLS policy to include WITH CHECK clause
-- This is required for UPDATE operations to work properly

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

CREATE POLICY "Users can update own transactions" 
ON transactions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
