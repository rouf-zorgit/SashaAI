-- Add session_id to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Add intent, confidence, and metadata columns if they don't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(5, 4),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_user_session 
ON messages(user_id, session_id, created_at);
