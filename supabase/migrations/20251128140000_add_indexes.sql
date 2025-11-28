-- Add indexes for frequently queried columns

-- Transactions: Filter by user and sort by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- Messages: Filter by session
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

-- Goals: Filter by user
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Notifications: Filter by user and sort by date
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Reminders: Filter by user
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
