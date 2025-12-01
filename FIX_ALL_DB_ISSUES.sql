-- 1. Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'deleted_at') THEN
        ALTER TABLE transactions ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 2. Fix UPDATE Policy (Crucial for Edit AND Soft Delete)
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON transactions;
DROP POLICY IF EXISTS "update_own_transactions" ON transactions;

CREATE POLICY "Users can update own transactions" 
ON transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Fix DELETE Policy (Just in case)
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can delete own transactions" 
ON transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. Verify
SELECT 
    tablename, 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'transactions' 
AND cmd IN ('UPDATE', 'DELETE');
