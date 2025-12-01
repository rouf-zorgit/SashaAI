# 🚀 PHASE 5: PERFORMANCE VERIFICATION GUIDE

**Created**: 2025-12-01
**Status**: ✅ **READY FOR TESTING**

---

## 📋 TASK 5.1: LIGHTHOUSE AUDITS

### Pages to Audit

1. **Login Page** (`/login`)
2. **Chat Page** (`/chat`)
3. **Profile Page** (`/profile`)
4. **Transaction History** (`/history`)
5. **Receipts Gallery** (`/profile/receipts`)
6. **Reports Page** (`/profile/reports`)

### How to Run Lighthouse

1. Open page in **Incognito mode** (Ctrl+Shift+N)
2. Open Chrome DevTools (F12)
3. Go to **Lighthouse** tab
4. Select all categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
5. Select **Desktop** or **Mobile**
6. Click **Analyze page load**
7. Wait for results
8. Document scores below

### Target Scores (Minimum)

```
Performance:     90+
Accessibility:   95+
Best Practices:  95+
SEO:            90+
```

### Lighthouse Results Template

```markdown
## Login Page (/login)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]

## Chat Page (/chat)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]

## Profile Page (/profile)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]

## Transaction History (/history)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]

## Receipts Gallery (/profile/receipts)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]

## Reports Page (/profile/reports)
- Performance: __/100
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
- Issues: [List any issues]
```

### Common Issues & Fixes

#### Performance Issues
- **Largest Contentful Paint (LCP) > 2.5s**
  - Fix: Optimize images, lazy load below fold
  - Fix: Preload critical resources
  - Fix: Use Next.js Image component

- **Cumulative Layout Shift (CLS) > 0.1**
  - Fix: Set explicit width/height on images
  - Fix: Reserve space for dynamic content
  - Fix: Use CSS aspect-ratio

- **First Input Delay (FID) > 100ms**
  - Fix: Code split large bundles
  - Fix: Defer non-critical JavaScript
  - Fix: Use React.memo for expensive components

#### Accessibility Issues
- **Missing alt text on images**
  - Fix: Add descriptive alt attributes
  
- **Low contrast text**
  - Fix: Ensure 4.5:1 contrast ratio minimum

- **Missing ARIA labels**
  - Fix: Add aria-label to interactive elements

#### Best Practices Issues
- **Mixed content (HTTP/HTTPS)**
  - Fix: Ensure all resources use HTTPS

- **Console errors**
  - Fix: Resolve all console errors

#### SEO Issues
- **Missing meta descriptions**
  - Fix: Add meta description to each page

- **Missing title tags**
  - Fix: Add unique title to each page

---

## 📊 TASK 5.2: DATABASE QUERY PERFORMANCE

### Critical Queries to Test

#### Query 1: Get User Context
```sql
-- Run in Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM get_user_context('USER_ID_HERE');
```

**Expected**:
- Execution time: <100ms
- Uses indexes: Yes
- Returns all data: Yes

**If slow**:
- Check if RPC function is optimized
- Verify indexes exist on all joined tables
- Consider materialized views for complex aggregations

---

#### Query 2: Get Transactions for Wallet
```sql
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE wallet_id = 'WALLET_ID_HERE'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 100;
```

**Expected**:
- Execution time: <50ms
- Uses index: `idx_transactions_wallet_date`
- Handles 1000+ transactions efficiently

**Create Index** (if missing):
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date 
ON transactions(wallet_id, created_at DESC) 
WHERE deleted_at IS NULL;
```

---

#### Query 3: Get Monthly Spending by Category
```sql
EXPLAIN ANALYZE
SELECT 
  category,
  SUM(amount) as total
FROM transactions
WHERE user_id = 'USER_ID_HERE'
  AND type = 'expense'
  AND deleted_at IS NULL
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY category;
```

**Expected**:
- Execution time: <100ms
- Uses index: `idx_transactions_user_date`
- Accurate results

**Create Index** (if missing):
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, created_at DESC) 
WHERE deleted_at IS NULL;
```

---

#### Query 4: Get Wallet Balances
```sql
EXPLAIN ANALYZE
SELECT id, name, balance, currency
FROM wallets
WHERE user_id = 'USER_ID_HERE'
  AND is_active = true
ORDER BY is_default DESC, created_at ASC;
```

**Expected**:
- Execution time: <20ms
- Uses index: `idx_wallets_user`

**Create Index** (if missing):
```sql
CREATE INDEX IF NOT EXISTS idx_wallets_user 
ON wallets(user_id, is_default DESC, created_at ASC);
```

---

### Recommended Indexes

Run these in Supabase SQL Editor:

```sql
-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date 
ON transactions(wallet_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(user_id, type, created_at DESC) 
WHERE deleted_at IS NULL;

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user 
ON wallets(user_id, is_default DESC, created_at ASC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_session 
ON messages(user_id, session_id, created_at ASC);

-- Receipts indexes
CREATE INDEX IF NOT EXISTS idx_receipts_user_date 
ON receipts(user_id, created_at DESC);
```

---

## 📦 TASK 5.3: FRONTEND BUNDLE SIZE

### Run Production Build

```bash
npm run build
```

### Expected Output

```
Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
├ ○ /chat                                XXX kB        XXX kB
├ ○ /history                             XXX kB        XXX kB
├ ○ /login                               XXX kB        XXX kB
├ ○ /profile                             XXX kB        XXX kB
├ ○ /profile/receipts                    XXX kB        XXX kB
└ ○ /profile/reports                     XXX kB        XXX kB

○  (Static)  prerendered as static content
```

### Target Sizes

```
Initial JS bundle:    <200KB compressed
Each page chunk:      <100KB
Total first load:     <500KB
```

### Analyze Bundle

Install bundle analyzer:
```bash
npm install --save-dev @next/bundle-analyzer
```

Update `next.config.js`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing config
})
```

Run analysis:
```bash
ANALYZE=true npm run build
```

### Common Large Dependencies

Check for these and optimize:

1. **Icon Libraries**
   - ❌ Import entire library: `import * as Icons from 'lucide-react'`
   - ✅ Import specific icons: `import { Home, User } from 'lucide-react'`

2. **Chart Libraries**
   - Consider: recharts (lighter) vs Chart.js (heavier)
   - Use dynamic imports for charts

3. **Date Libraries**
   - ❌ Moment.js (large, mutable)
   - ✅ date-fns (tree-shakeable, smaller)

4. **Utility Libraries**
   - ❌ Lodash full: `import _ from 'lodash'`
   - ✅ Individual imports: `import debounce from 'lodash/debounce'`

---

## ⚡ TASK 5.4: API RESPONSE TIMES

### How to Measure

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Perform action (send chat message, create transaction, etc.)
4. Find request in Network tab
5. Check **Time** column
6. Document response time

### Target Response Times

```
AI Chat Message:        <2s (ideally <1s)
Create Transaction:     <500ms
Get Transactions:       <200ms
Upload Receipt:         <5s
Get User Context:       <100ms
```

### Response Time Testing Template

```markdown
## API Response Times

### Chat API (/api/chat)
- Average: __ms
- P95: __ms
- P99: __ms
- Status: [✅ Pass / ❌ Fail]

### Create Transaction
- Average: __ms
- P95: __ms
- P99: __ms
- Status: [✅ Pass / ❌ Fail]

### Get Transactions
- Average: __ms
- P95: __ms
- P99: __ms
- Status: [✅ Pass / ❌ Fail]

### Upload Receipt
- Average: __ms
- P95: __ms
- P99: __ms
- Status: [✅ Pass / ❌ Fail]

### Get User Context
- Average: __ms
- P95: __ms
- P99: __ms
- Status: [✅ Pass / ❌ Fail]
```

### Optimization Strategies

#### Slow Database Queries
- Run `EXPLAIN ANALYZE` on query
- Add missing indexes
- Optimize JOIN operations
- Use batched queries (already implemented)

#### Slow External APIs
- Claude API: Use streaming (already implemented)
- Supabase Storage: Use CDN URLs
- Add timeout limits

#### Add Caching
- User context: 30s TTL (already implemented)
- Static data: Longer TTL
- Use Redis for production (optional)

---

## 📱 TASK 5.5: MOBILE PERFORMANCE TESTING

### Network Throttling in DevTools

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Click **No throttling** dropdown
4. Select **Slow 3G**
5. Test critical flows

### Critical User Flows to Test

1. **Login Flow**
   - Time to login page load
   - Time to complete login
   - Time to redirect to chat

2. **Send Chat Message**
   - Time to send message
   - Time to receive AI response
   - Time to display response

3. **Create Transaction**
   - Time to open form
   - Time to save transaction
   - Time to update UI

4. **Upload Receipt**
   - Time to select image
   - Time to compress image
   - Time to upload to storage
   - Time to process with AI

### Mobile Testing Template

```markdown
## Mobile Performance (Slow 3G)

### Login Flow
- Page load: __s
- Login complete: __s
- Total: __s
- Status: [✅ Pass / ❌ Fail]

### Chat Message
- Send message: __ms
- Receive response: __s
- Display: __ms
- Total: __s
- Status: [✅ Pass / ❌ Fail]

### Create Transaction
- Open form: __ms
- Save: __ms
- Update UI: __ms
- Total: __ms
- Status: [✅ Pass / ❌ Fail]

### Upload Receipt
- Select image: __ms
- Compress: __ms
- Upload: __s
- Process: __s
- Total: __s
- Status: [✅ Pass / ❌ Fail]
```

### Target Times (Slow 3G)

```
Page Load:              <5s
Chat Response:          <10s
Transaction Create:     <2s
Receipt Upload:         <15s
```

### Optimization for Mobile

#### Reduce Image Sizes
- Use WebP format
- Compress images (already implemented)
- Use responsive images
- Lazy load images

#### Aggressive Caching
- Service Worker for offline support
- Cache API responses
- Cache static assets

#### Progress Indicators
- Show loading states (already implemented)
- Show upload progress
- Show processing status

#### Offline Support (Optional)
- Queue actions when offline
- Sync when online
- Show offline indicator

---

## ✅ PERFORMANCE CHECKLIST

### Pre-Testing
- [ ] Run production build
- [ ] Deploy to staging environment
- [ ] Clear browser cache
- [ ] Test in incognito mode

### Lighthouse Audits
- [ ] Login page tested
- [ ] Chat page tested
- [ ] Profile page tested
- [ ] History page tested
- [ ] Receipts page tested
- [ ] Reports page tested
- [ ] All scores documented
- [ ] Critical issues fixed

### Database Performance
- [ ] User context query tested
- [ ] Transactions query tested
- [ ] Monthly spending query tested
- [ ] Wallet balances query tested
- [ ] All indexes created
- [ ] All queries <100ms

### Bundle Size
- [ ] Production build completed
- [ ] Bundle sizes documented
- [ ] Bundle analyzer run
- [ ] Large dependencies identified
- [ ] Optimizations applied
- [ ] All bundles <200KB

### API Response Times
- [ ] Chat API tested
- [ ] Create transaction tested
- [ ] Get transactions tested
- [ ] Upload receipt tested
- [ ] Get user context tested
- [ ] All endpoints meet targets

### Mobile Performance
- [ ] Slow 3G throttling tested
- [ ] Login flow tested
- [ ] Chat message tested
- [ ] Transaction create tested
- [ ] Receipt upload tested
- [ ] All flows meet targets

---

## 📊 FINAL PERFORMANCE REPORT

After completing all tests, create a summary:

```markdown
# Performance Verification Report

**Date**: YYYY-MM-DD
**Tester**: [Your Name]
**Environment**: [Staging/Production]

## Summary
- Lighthouse Average: __/100
- Database Queries: [✅ All Pass / ❌ Some Fail]
- Bundle Size: [✅ Pass / ❌ Fail]
- API Response Times: [✅ All Pass / ❌ Some Fail]
- Mobile Performance: [✅ Pass / ❌ Fail]

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Status
[✅ Ready for Production / ⚠️ Needs Optimization / ❌ Not Ready]
```

---

**STATUS**: ✅ **READY FOR PERFORMANCE TESTING**
