-- ============================================================================
-- DATABASE OPTIMIZATION SCRIPT
-- ============================================================================
-- Adds recommended indexes for improved query performance
-- Safe to run multiple times - includes IF NOT EXISTS checks
-- ============================================================================

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Speed up recent transactions queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON transactions(user_id, created_at DESC);

-- Speed up category-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_category 
ON transactions(category);

-- Optimize smart categorization lookups
CREATE INDEX IF NOT EXISTS idx_transactions_smart_cat 
ON transactions(user_id, merchant_name, category);

-- Pattern detection optimization
CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date 
ON transactions(user_id, category, created_at);

-- ============================================================================
-- MESSAGES TABLE INDEXES
-- ============================================================================

-- Speed up recent messages queries
CREATE INDEX IF NOT EXISTS idx_messages_user_created 
ON messages(user_id, created_at DESC);

-- ============================================================================
-- EPISODIC EVENTS INDEXES
-- ============================================================================

-- Speed up recent events queries
CREATE INDEX IF NOT EXISTS idx_episodic_user_occurred 
ON episodic_events(user_id, occurred_at DESC);

-- Speed up importance-based queries
CREATE INDEX IF NOT EXISTS idx_episodic_user_importance 
ON episodic_events(user_id, importance DESC);

-- Speed up event type queries
CREATE INDEX IF NOT EXISTS idx_episodic_event_type 
ON episodic_events(user_id, event_type);

-- ============================================================================
-- MEMORY EVENTS INDEXES
-- ============================================================================

-- Speed up memory retrieval
CREATE INDEX IF NOT EXISTS idx_memory_user_salience 
ON memory_events(user_id, salience DESC);

-- ============================================================================
-- CONVERSATION CONTEXT INDEXES
-- ============================================================================

-- Speed up session context retrieval
CREATE INDEX IF NOT EXISTS idx_context_session 
ON conversation_context(session_id, created_at DESC);

-- Clean up expired contexts
CREATE INDEX IF NOT EXISTS idx_context_expires 
ON conversation_context(expires_at);

-- ============================================================================
-- SPENDING PATTERNS INDEXES
-- ============================================================================

-- Speed up pattern retrieval
CREATE INDEX IF NOT EXISTS idx_patterns_user_type 
ON spending_patterns(user_id, pattern_type);

-- ============================================================================
-- RECURRING PAYMENTS INDEXES
-- ============================================================================

-- Speed up active recurring payments queries
CREATE INDEX IF NOT EXISTS idx_recurring_user_active 
ON recurring_payments(user_id, is_active);

-- Speed up due date queries
CREATE INDEX IF NOT EXISTS idx_recurring_next_due 
ON recurring_payments(user_id, next_due_date);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
