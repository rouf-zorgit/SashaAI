# Console Statement Cleanup Guide

## Strategy:
1. **REMOVE** all `console.log()` - these are debug statements
2. **REMOVE** all `console.warn()` - not needed in production
3. **REMOVE** all `console.debug()` - debug only
4. **KEEP** `console.error()` in catch blocks - intentional error logging

## Files to Clean (in order):

### Server Actions (Priority 1)
- [ ] src/app/actions/transactions.ts
- [ ] src/app/actions/wallet.ts
- [ ] src/app/actions/receipts.ts
- [ ] src/app/auth/actions.ts

### Components (Priority 2)
- [ ] src/components/history/HistoryClient.tsx
- [ ] src/components/receipts/ReceiptReviewDialog.tsx
- [ ] src/components/receipts/ReceiptUploadDialog.tsx
- [ ] src/components/profile/AddLoanDialog.tsx
- [ ] src/components/onboarding/OnboardingWizard.tsx
- [ ] src/components/reports/ReportsClient.tsx

### Lib/Queries (Priority 3)
- [ ] src/lib/queries/history.ts
- [ ] src/lib/queries/transactions.ts
- [ ] src/lib/queries/reports.ts
- [ ] src/lib/db/user-context.ts
- [ ] src/lib/ai/parse-transaction.ts

### Pages (Priority 4)
- [ ] src/app/chat/page.tsx
- [ ] src/app/history/page.tsx
- [ ] src/app/profile/**/page.tsx

## Automated Cleanup Commands:

```bash
# Find all console.log statements
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"

# Find all console.warn statements  
grep -r "console\.warn" src/ --include="*.ts" --include="*.tsx"

# Find all console.error statements (review these manually)
grep -r "console\.error" src/ --include="*.ts" --include="*.tsx"
```

## Manual Review Required:
Some console.error statements should stay if they're in catch blocks for error tracking.
