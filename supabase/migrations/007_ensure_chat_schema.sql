-- Ensure session_id exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Ensure other columns exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(5, 4),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_messages_user_session 
ON messages(user_id, session_id, created_at);

-- Re-apply RLS policies to be absolutely sure
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
