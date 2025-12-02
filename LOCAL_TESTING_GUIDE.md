# 🧪 Local Testing Guide for Notification System

## Quick Start (3 Steps)

### Step 1: Navigate to Test Page
Open your browser and go to:
```
http://localhost:3000/test-notifications
```

### Step 2: Click "Run All Checks"
This will trigger all 4 notification checks:
- 🔴 Budget Exceeded/Warnings
- 🟢 Goal Progress Monitoring
- 🟡 Upcoming Bill Predictions
- 🔵 Unusual Spending Detection

### Step 3: View Results
After the checks complete, you'll be redirected to:
```
http://localhost:3000/history
```

Click the **Notifications** tab to see the generated notifications!

---

## What to Test

### 1. Budget Exceeded Notifications

**Setup:**
Create some transactions that exceed the default budgets:

```typescript
// Default budgets:
dining: ৳5,000
shopping: ৳8,000
entertainment: ৳3,000
transport: ৳4,000
groceries: ৳10,000
```

**How to test:**
1. Add transactions in the "dining" category totaling >৳5,000 this month
2. Run the notification check
3. Expected: "Dining Budget Exceeded" notification

**Example transactions to create:**
- Dining: ৳2,000 (Restaurant)
- Dining: ৳2,500 (Food delivery)
- Dining: ৳1,500 (Coffee shop)
- **Total: ৳6,000** → Should trigger alert!

### 2. Goal Progress Notifications

**Setup:**
Create a goal with a deadline

**How to test:**
1. Go to `/goals`
2. Create a goal: "Emergency Fund" - Target: ৳50,000 - Deadline: 30 days from now
3. Add only ৳10,000 progress (20% complete)
4. Run notification check
5. Expected: "Goal At Risk" notification (deadline approaching with <50% progress)

**To test goal achievement:**
1. Update goal progress to 100%
2. Run notification check
3. Expected: "🎉 Goal Achieved" notification

### 3. Upcoming Bill Predictions

**Setup:**
Create recurring transactions (same merchant, 3+ times)

**How to test:**
1. Create 3 transactions with same description over 3 months:
   - Jan 1: "Netflix Subscription" - ৳800
   - Feb 1: "Netflix Subscription" - ৳800
   - Mar 1: "Netflix Subscription" - ৳800
2. Wait until ~3 days before expected next payment (Apr 1)
3. Run notification check
4. Expected: "Upcoming Bill: Netflix Subscription" notification

**Note:** For testing, you can manually adjust transaction dates in the database.

### 4. Unusual Spending Detection

**Setup:**
Create a mix of normal and unusually high transactions

**How to test:**
1. Create 10 normal transactions: ৳500-৳1,500 each
2. Create 1 large transaction: ৳8,000 (>2 standard deviations above average)
3. Run notification check
4. Expected: "Unusual Spending Detected" notification

### 5. Weekly Summary

**How to test:**
1. Create various transactions over the past week
2. Click "Generate Weekly Summary" button on test page
3. Expected: Detailed weekly report with:
   - Total income
   - Total expenses
   - Net cash flow
   - Top spending category
   - Professional assessment

---

## Manual API Testing

### Using Browser Console

```javascript
// Run all checks
fetch('/api/run-notification-checks', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

// Or import and run directly
const { runNotificationChecks } = await import('/app/actions/notifications')
const { createClient } = await import('/lib/supabase/client')
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
await runNotificationChecks(user.id)
```

### Using curl

```bash
# Run all checks (requires authentication)
curl -X POST http://localhost:3000/api/run-notification-checks \
  -H "Content-Type: application/json"
```

---

## Expected Notification Types

After running checks, you should see notifications with these types:

### 🔴 Critical (Red)
- `budget_exceeded` - "You've exceeded your [category] budget by X%"
- `goal_at_risk` - "Your goal deadline is approaching but progress is low"

### 🟡 Warning (Yellow)
- `budget_warning` - "You're approaching your [category] budget limit"
- `upcoming_bill` - "Your [merchant] bill is due in X days"
- `unusual_spending` - "Transaction significantly higher than usual"

### 🟢 Success (Green)
- `goal_reached` - "🎉 Goal Achieved: [goal name]"

### 🔵 Info (Blue)
- `weekly_summary` - Comprehensive weekly financial report

---

## Troubleshooting

### No notifications appearing?

**Check 1: Do you have transactions?**
```sql
-- Run in Supabase SQL editor
SELECT COUNT(*) FROM transactions WHERE user_id = 'your-user-id';
```

**Check 2: Are thresholds being met?**
- Budget checks need >80% of budget spent
- Goal risks need deadline <30 days and progress <50%
- Unusual spending needs >5 transactions for baseline

**Check 3: Check browser console**
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed API calls

### Notifications not color-coded?

- Verify `notification.type` matches one of the configured types
- Check `NotificationCard.tsx` for type mapping

### Weekly summary shows "No transactions"?

- Create transactions dated within the last 7 days
- Check transaction `created_at` timestamps

---

## Database Inspection

### View all notifications
```sql
SELECT * FROM notifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

### View recent transactions
```sql
SELECT * FROM transactions 
WHERE user_id = 'your-user-id' 
AND deleted_at IS NULL
ORDER BY created_at DESC 
LIMIT 20;
```

### Check budget spending
```sql
SELECT 
  category,
  SUM(amount) as total_spent,
  COUNT(*) as transaction_count
FROM transactions
WHERE user_id = 'your-user-id'
  AND type = 'expense'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND deleted_at IS NULL
GROUP BY category
ORDER BY total_spent DESC;
```

---

## Next Steps

Once local testing is complete:

1. ✅ Verify all notification types appear correctly
2. ✅ Check color coding and icons
3. ✅ Test "Mark as read" functionality
4. ✅ Verify notifications are actionable and professional

Then you're ready to:
- Deploy to staging/production
- Set up automated cron jobs (see `CRON_SETUP_GUIDE.md`)
- Monitor real user notifications

---

## Quick Test Checklist

- [ ] Budget exceeded notification appears
- [ ] Budget warning notification appears
- [ ] Goal achieved notification appears
- [ ] Goal at risk notification appears
- [ ] Upcoming bill notification appears
- [ ] Unusual spending notification appears
- [ ] Weekly summary generates correctly
- [ ] All notifications are color-coded correctly
- [ ] Icons display properly
- [ ] "Mark as read" works
- [ ] Notifications have professional CA tone
- [ ] Timestamps are accurate

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify environment variables are set
4. Ensure database schema is up to date

Happy testing! 🎉
