-- =====================================================
-- FIN AI: Messages Table Migration (PRODUCTION READY)
-- Version: 1.0
-- Date: 2025-11-26
-- =====================================================

-- Clean slate: Drop everything related to messages table
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with complete schema
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    intent text, -- AI-detected intent
    confidence numeric(3,2), -- 0.00 to 1.00
    metadata jsonb DEFAULT '{}'::jsonb, -- Flexible data (transaction_ids, flags, etc.)
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- PERFORMANCE-OPTIMIZED INDEXES
-- =====================================================

-- PRIMARY QUERY: "Get last N messages in session X ordered by time"
CREATE INDEX idx_messages_session_time 
    ON messages (session_id, created_at DESC);

-- SECONDARY QUERY: "Get user's recent activity"
CREATE INDEX idx_messages_user_time 
    ON messages (user_id, created_at DESC);

-- ANALYTICS QUERY: "What are users asking about?"
CREATE INDEX idx_messages_intent 
    ON messages (intent) 
    WHERE intent IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own messages
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own messages (role = 'user' only)
CREATE POLICY "Users can insert their own messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND role = 'user'
    );

-- Policy 3: Service role can insert AI responses (role = 'assistant' or 'system')
CREATE POLICY "Service role can insert AI messages"
    ON messages FOR INSERT
    WITH CHECK (
        role IN ('assistant', 'system')
    );

-- Policy 4: Service role can view all messages (for Deep Mode)
CREATE POLICY "Service role can view all messages"
    ON messages FOR SELECT
    USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT ON messages TO authenticated;
GRANT ALL ON messages TO service_role;
GRANT ALL ON messages TO postgres;
