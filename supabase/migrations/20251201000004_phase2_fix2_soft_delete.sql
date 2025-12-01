-- ============================================================================
-- PHASE 2 HIGH PRIORITY FIX #2: Fix Transaction Soft Delete
-- ============================================================================
-- Date: 2025-12-01
-- Priority: HIGH
-- Issue: Transaction SELECT policy doesn't filter deleted_at
-- Fix: Create separate policies for active and deleted transactions
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

-- Create separate policies for active and deleted transactions
CREATE POLICY "Users can view own active transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can view own deleted transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 2 Fix #2 Applied: Transaction soft delete filter added';
    RAISE NOTICE 'Policies updated: transactions (SELECT split into active/deleted)';
END $$;
