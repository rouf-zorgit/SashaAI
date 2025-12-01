-- ============================================================================
-- PHASE 2 HIGH PRIORITY FIX #1: Add Missing UPDATE/DELETE Policies
-- ============================================================================
-- Date: 2025-12-01
-- Priority: HIGH
-- Issue: Several tables missing UPDATE/DELETE policies
-- Fix: Add missing CRUD policies for completeness
-- ============================================================================

-- Wallet Adjustments
CREATE POLICY "Users can update own adjustments" 
ON wallet_adjustments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adjustments" 
ON wallet_adjustments FOR DELETE 
USING (auth.uid() = user_id);

-- Receipt Uploads
CREATE POLICY "Users can delete own uploads" 
ON receipt_uploads FOR DELETE 
USING (auth.uid() = user_id);

-- Profiles
CREATE POLICY "Users can delete own profile" 
ON profiles FOR DELETE 
USING (auth.uid() = id);

-- Subscription Status
CREATE POLICY "Users can delete own subscription" 
ON subscription_status FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 2 Fix #1 Applied: Missing UPDATE/DELETE policies added';
    RAISE NOTICE 'Tables updated: wallet_adjustments, receipt_uploads, profiles, subscription_status';
END $$;
