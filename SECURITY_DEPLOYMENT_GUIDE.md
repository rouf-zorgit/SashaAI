# Security Fixes Deployment Guide

## Phase 1: Critical Fixes (IMMEDIATE - Week 1)

### Priority: 🔴 CRITICAL
**Deadline**: December 8, 2025

### Fixes Included

1. **SECURITY DEFINER Function Authorization** ✅
   - File: `20251201000001_phase1_fix1_security_definer_auth.sql`
   - Functions: `get_user_context`, `get_events_by_time_range`, `search_events`, `get_important_events`
   - Impact: Prevents cross-user data access via function calls

2. **Wallet Transfer Validation** ✅
   - File: `20251201000002_phase1_fix2_wallet_validation.sql`
   - Tables: `wallet_transfers`, `loan_payments`
   - Impact: Prevents unauthorized wallet transfers and loan payments

---

## Deployment Steps - Phase 1

### Step 1: Deploy to Staging

```bash
# Navigate to project directory
cd "c:\Users\abdur\.gemini\finAI - MVP"

# Deploy migrations to staging
supabase db push --db-url $STAGING_DATABASE_URL

# Verify migrations applied
supabase db diff --db-url $STAGING_DATABASE_URL
```

### Step 2: Test in Staging

#### Test 1: SECURITY DEFINER Function Authorization
```sql
-- Should FAIL with "Unauthorized" error
SELECT get_user_context('some-other-user-uuid');

-- Should SUCCEED (your own data)
SELECT get_user_context(auth.uid());
```

#### Test 2: Wallet Transfer Validation
```sql
-- Should FAIL (wallet doesn't belong to you)
INSERT INTO wallet_transfers (user_id, from_wallet_id, to_wallet_id, amount)
VALUES (auth.uid(), 'someone-elses-wallet-uuid', 'your-wallet-uuid', 100);

-- Should SUCCEED (both wallets belong to you)
INSERT INTO wallet_transfers (user_id, from_wallet_id, to_wallet_id, amount)
VALUES (auth.uid(), 'your-wallet-1-uuid', 'your-wallet-2-uuid', 100);
```

### Step 3: Frontend Testing

- [ ] Test chat functionality (uses `get_user_context`)
- [ ] Test wallet transfers between own wallets
- [ ] Test loan payment creation
- [ ] Verify no errors in browser console
- [ ] Check Supabase logs for authorization errors

### Step 4: Deploy to Production

```bash
# Deploy Edge Functions (already done)
supabase functions deploy processChat
supabase functions deploy processReceipt
supabase functions deploy generateWeeklySummary

# Deploy database migrations
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Verify
supabase db diff --db-url $PRODUCTION_DATABASE_URL
```

### Step 5: Monitor Production

- [ ] Check error logs for 1 hour after deployment
- [ ] Monitor for authorization errors
- [ ] Verify user reports (if any)
- [ ] Check performance metrics

---

## Phase 2: High Priority Fixes (Week 2)

### Priority: 🟠 HIGH
**Deadline**: December 15, 2025

### Fixes Included

1. **Missing UPDATE/DELETE Policies**
   - File: `20251201000003_phase2_fix1_missing_policies.sql`
   - Tables: `wallet_adjustments`, `receipt_uploads`, `profiles`, `subscription_status`

2. **Transaction Soft Delete Filter**
   - File: `20251201000004_phase2_fix2_soft_delete.sql`
   - Table: `transactions`
   - Impact: Deleted transactions no longer appear in queries

### Deployment Steps - Phase 2

Same as Phase 1, but deploy migrations:
- `20251201000003_phase2_fix1_missing_policies.sql`
- `20251201000004_phase2_fix2_soft_delete.sql`

### Testing - Phase 2

#### Test 1: DELETE Policies
```sql
-- Should SUCCEED (delete own profile)
DELETE FROM profiles WHERE id = auth.uid();

-- Should SUCCEED (delete own receipt upload)
DELETE FROM receipt_uploads WHERE user_id = auth.uid() AND id = 'some-upload-id';
```

#### Test 2: Soft Delete Filter
```sql
-- Should NOT return deleted transactions
SELECT * FROM transactions WHERE user_id = auth.uid();

-- Should return deleted transactions
SELECT * FROM transactions WHERE user_id = auth.uid() AND deleted_at IS NOT NULL;
```

---

## Phase 3: Enhancements (Week 3)

### Priority: 🟡 MEDIUM
**Deadline**: December 22, 2025

### Enhancements Included

1. **Receipt Upload Rate Limiting**
   - File: `20251201000005_phase3_enhancements.sql`
   - Limit: 10 uploads per hour per user

2. **Wallet Adjustment Audit Trail**
   - Requires `reason` field
   - Tracks `adjusted_by` user

### Testing - Phase 3

#### Test 1: Rate Limiting
```bash
# Upload 11 receipts rapidly
# 11th upload should fail with "Rate limit exceeded"
```

#### Test 2: Audit Trail
```sql
-- Should FAIL (no reason provided)
INSERT INTO wallet_adjustments (user_id, wallet_id, old_balance, new_balance)
VALUES (auth.uid(), 'wallet-uuid', 1000, 1100);

-- Should SUCCEED (reason provided)
INSERT INTO wallet_adjustments (user_id, wallet_id, old_balance, new_balance, reason)
VALUES (auth.uid(), 'wallet-uuid', 1000, 1100, 'Manual correction');
```

---

## Rollback Plan

If issues occur after deployment:

### Rollback Phase 1
```bash
# Revert migrations
supabase db reset --db-url $PRODUCTION_DATABASE_URL

# Redeploy up to previous migration
supabase db push --db-url $PRODUCTION_DATABASE_URL --up-to 20251130110000
```

### Rollback Edge Functions
```bash
# Revert to previous version
git checkout HEAD~1 supabase/functions/processChat/index.ts
git checkout HEAD~1 supabase/functions/processReceipt/index.ts
git checkout HEAD~1 supabase/functions/generateWeeklySummary/index.ts

# Redeploy
supabase functions deploy processChat
supabase functions deploy processReceipt
supabase functions deploy generateWeeklySummary
```

---

## Success Criteria

### Phase 1 ✅
- [ ] All SECURITY DEFINER functions validate `auth.uid()`
- [ ] Wallet transfers validate wallet ownership
- [ ] Loan payments validate wallet and loan ownership
- [ ] No production errors for 24 hours
- [ ] No user complaints

### Phase 2 ✅
- [ ] All tables have complete CRUD policies
- [ ] Deleted transactions filtered from queries
- [ ] No production errors for 24 hours

### Phase 3 ✅
- [ ] Receipt upload rate limiting active
- [ ] Wallet adjustments require reason
- [ ] Audit trail captures `adjusted_by`

---

## Timeline Summary

| Phase | Deadline | Status |
|-------|----------|--------|
| Phase 1 (Critical) | Dec 8, 2025 | 🟡 Ready to Deploy |
| Phase 2 (High) | Dec 15, 2025 | 🟡 Ready to Deploy |
| Phase 3 (Medium) | Dec 22, 2025 | 🟡 Ready to Deploy |

---

## Contact

If issues arise during deployment:
- Check Supabase logs: Dashboard → Logs
- Check Edge Function logs: Dashboard → Edge Functions → Logs
- Review error messages in browser console
- Test with different user accounts
