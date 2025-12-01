-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spending_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Create policies for conversation_context
DROP POLICY IF EXISTS "Users can view own context" ON conversation_context;
DROP POLICY IF EXISTS "Users can insert own context" ON conversation_context;
DROP POLICY IF EXISTS "Users can update own context" ON conversation_context;
DROP POLICY IF EXISTS "Users can delete own context" ON conversation_context;
CREATE POLICY "Users can view own context" ON conversation_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own context" ON conversation_context FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own context" ON conversation_context FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own context" ON conversation_context FOR DELETE USING (auth.uid() = user_id);

-- Create policies for memory_events
DROP POLICY IF EXISTS "Users can view own memory" ON memory_events;
DROP POLICY IF EXISTS "Users can insert own memory" ON memory_events;
DROP POLICY IF EXISTS "Users can update own memory" ON memory_events;
DROP POLICY IF EXISTS "Users can delete own memory" ON memory_events;
CREATE POLICY "Users can view own memory" ON memory_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory" ON memory_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory" ON memory_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memory" ON memory_events FOR DELETE USING (auth.uid() = user_id);

-- Create policies for episodic_events
DROP POLICY IF EXISTS "Users can view own episodes" ON episodic_events;
DROP POLICY IF EXISTS "Users can insert own episodes" ON episodic_events;
DROP POLICY IF EXISTS "Users can update own episodes" ON episodic_events;
DROP POLICY IF EXISTS "Users can delete own episodes" ON episodic_events;
CREATE POLICY "Users can view own episodes" ON episodic_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own episodes" ON episodic_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own episodes" ON episodic_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own episodes" ON episodic_events FOR DELETE USING (auth.uid() = user_id);

-- Create policies for spending_patterns
DROP POLICY IF EXISTS "Users can view own patterns" ON spending_patterns;
DROP POLICY IF EXISTS "Users can insert own patterns" ON spending_patterns;
DROP POLICY IF EXISTS "Users can update own patterns" ON spending_patterns;
DROP POLICY IF EXISTS "Users can delete own patterns" ON spending_patterns;
CREATE POLICY "Users can view own patterns" ON spending_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON spending_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON spending_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON spending_patterns FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Create policies for recurring_payments
DROP POLICY IF EXISTS "Users can view own recurring" ON recurring_payments;
DROP POLICY IF EXISTS "Users can insert own recurring" ON recurring_payments;
DROP POLICY IF EXISTS "Users can update own recurring" ON recurring_payments;
DROP POLICY IF EXISTS "Users can delete own recurring" ON recurring_payments;
CREATE POLICY "Users can view own recurring" ON recurring_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring" ON recurring_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON recurring_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON recurring_payments FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_spending_patterns
DROP POLICY IF EXISTS "Users can view own spending patterns" ON user_spending_patterns;
DROP POLICY IF EXISTS "Users can insert own spending patterns" ON user_spending_patterns;
DROP POLICY IF EXISTS "Users can update own spending patterns" ON user_spending_patterns;
DROP POLICY IF EXISTS "Users can delete own spending patterns" ON user_spending_patterns;
CREATE POLICY "Users can view own spending patterns" ON user_spending_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spending patterns" ON user_spending_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spending patterns" ON user_spending_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spending patterns" ON user_spending_patterns FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_memory_events_user_id ON memory_events(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_events_created_at ON memory_events(created_at);

CREATE INDEX IF NOT EXISTS idx_episodic_events_user_id ON episodic_events(user_id);
CREATE INDEX IF NOT EXISTS idx_episodic_events_occurred_at ON episodic_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_conversation_context_user_id ON conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_expires_at ON conversation_context(expires_at);

CREATE INDEX IF NOT EXISTS idx_spending_patterns_user_id ON spending_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_user_id ON recurring_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spending_patterns_user_id ON user_spending_patterns(user_id);
