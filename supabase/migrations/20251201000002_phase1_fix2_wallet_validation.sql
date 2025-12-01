-- ============================================================================
-- PHASE 1 CRITICAL SECURITY FIX #2: Add Wallet Transfer Validation
-- ============================================================================
-- Date: 2025-12-01
-- Priority: CRITICAL
-- Issue: Wallet transfers don't validate wallet ownership
-- Fix: Add EXISTS checks to ensure both wallets belong to the user
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own transfers" ON wallet_transfers;

-- Create new policy with wallet ownership validation
CREATE POLICY "Users can insert own transfers" 
ON wallet_transfers FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    -- ✅ SECURITY FIX: Validate from_wallet belongs to user
    EXISTS (
        SELECT 1 FROM wallets 
        WHERE id = from_wallet_id 
        AND user_id = auth.uid()
    ) AND
    -- ✅ SECURITY FIX: Validate to_wallet belongs to user
    EXISTS (
        SELECT 1 FROM wallets 
        WHERE id = to_wallet_id 
        AND user_id = auth.uid()
    )
);

-- Add UPDATE policy (was missing)
CREATE POLICY "Users can update own transfers" 
ON wallet_transfers FOR UPDATE 
USING (auth.uid() = user_id);

-- Add DELETE policy (was missing)
CREATE POLICY "Users can delete own transfers" 
ON wallet_transfers FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 1 CRITICAL SECURITY FIX #3: Add Loan Payment Wallet Validation
-- ============================================================================
-- Issue: Loan payments don't validate wallet and loan ownership
-- Fix: Add EXISTS checks for both wallet_id and loan_id
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own loan payments" ON loan_payments;

-- Create new policy with validation
CREATE POLICY "Users can insert own loan payments" 
ON loan_payments FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    -- ✅ SECURITY FIX: Validate wallet belongs to user (if provided)
    (wallet_id IS NULL OR EXISTS (
        SELECT 1 FROM wallets 
        WHERE id = wallet_id 
        AND user_id = auth.uid()
    )) AND
    -- ✅ SECURITY FIX: Validate loan belongs to user
    EXISTS (
        SELECT 1 FROM loans 
        WHERE id = loan_id 
        AND user_id = auth.uid()
    )
);

-- Add UPDATE policy (was missing)
CREATE POLICY "Users can update own loan payments" 
ON loan_payments FOR UPDATE 
USING (auth.uid() = user_id);

-- Add DELETE policy (was missing)
CREATE POLICY "Users can delete own loan payments" 
ON loan_payments FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 1 Fix #2 Applied: Wallet transfer validation added';
    RAISE NOTICE '✅ Phase 1 Fix #3 Applied: Loan payment validation added';
    RAISE NOTICE 'Policies updated: wallet_transfers (INSERT/UPDATE/DELETE), loan_payments (INSERT/UPDATE/DELETE)';
END $$;
