-- Phase 2 Database Migrations
-- Run this in Supabase SQL Editor

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('insight', 'reminder', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Undo actions table
CREATE TABLE IF NOT EXISTS undo_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('delete', 'edit', 'create')),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    previous_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_undo_actions_user_id ON undo_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_undo_actions_expires_at ON undo_actions(expires_at);

-- Enable RLS
ALTER TABLE undo_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for undo_actions
CREATE POLICY "Users can view own undo actions"
    ON undo_actions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own undo actions"
    ON undo_actions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own undo actions"
    ON undo_actions FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Update profiles table for subscription
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- 4. Create function to clean up expired undo actions (optional cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_undo_actions()
RETURNS void AS $$
BEGIN
    DELETE FROM undo_actions
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verify migrations
DO $$
BEGIN
    RAISE NOTICE 'Phase 2 migrations completed successfully!';
    RAISE NOTICE 'Tables created: notifications, undo_actions';
    RAISE NOTICE 'Profiles table updated with subscription fields';
END $$;
