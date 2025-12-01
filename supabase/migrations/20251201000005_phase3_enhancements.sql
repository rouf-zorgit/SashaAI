-- ============================================================================
-- PHASE 3 ENHANCEMENT #1: Add Receipt Upload Rate Limiting
-- ============================================================================
-- Date: 2025-12-01
-- Priority: MEDIUM
-- Issue: No rate limiting on receipt uploads
-- Fix: Add trigger to enforce 10 uploads per hour limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_receipt_upload_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*) 
        FROM receipt_uploads 
        WHERE user_id = NEW.user_id 
        AND uploaded_at > NOW() - INTERVAL '1 hour'
    ) >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Maximum 10 receipt uploads per hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_receipt_rate_limit
    BEFORE INSERT ON receipt_uploads
    FOR EACH ROW
    EXECUTE FUNCTION check_receipt_upload_rate();

-- ============================================================================
-- PHASE 3 ENHANCEMENT #2: Add Wallet Adjustment Audit Trail
-- ============================================================================
-- Issue: Wallet adjustments lack audit trail
-- Fix: Add adjusted_by column and validation trigger
-- ============================================================================

-- Add audit column
ALTER TABLE wallet_adjustments 
ADD COLUMN IF NOT EXISTS adjusted_by UUID REFERENCES auth.users(id);

-- Create validation function
CREATE OR REPLACE FUNCTION validate_wallet_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason IS NULL OR NEW.reason = '' THEN
        RAISE EXCEPTION 'Wallet adjustment requires a reason';
    END IF;
    NEW.adjusted_by := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_adjustment_before_insert
    BEFORE INSERT ON wallet_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION validate_wallet_adjustment();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 3 Enhancements Applied';
    RAISE NOTICE 'Enhancement #1: Receipt upload rate limiting (10/hour)';
    RAISE NOTICE 'Enhancement #2: Wallet adjustment audit trail';
END $$;
