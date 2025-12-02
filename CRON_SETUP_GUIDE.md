# Setting Up Automated Notification Cron Jobs

This guide explains how to set up automated notification checks for Sasha's intelligent notification system.

## 📋 Overview

We've created two automated jobs:
1. **Daily Notifications** - Runs every day at 9:00 AM
2. **Weekly Summary** - Runs every Monday at 9:00 AM

## 🚀 Option 1: Vercel Cron Jobs (Recommended for Production)

### Step 1: Add CRON_SECRET to Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a secure random string (e.g., use `openssl rand -base64 32`)
   - **Environment**: Production, Preview, Development

### Step 2: Deploy to Vercel

The `vercel.json` file is already configured with:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

Simply push to your repository and Vercel will automatically set up the cron jobs.

### Step 3: Verify Cron Jobs

1. Go to Vercel Dashboard → Your Project → **Cron Jobs**
2. You should see both jobs listed
3. Check the execution logs to verify they're running

### Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 9 * * *` - Every day at 9:00 AM
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 1 * *` - First day of every month at midnight

## 🔧 Option 2: Manual Testing (Development)

### Test Daily Notifications
```bash
# Using curl (replace with your local URL)
curl http://localhost:3000/api/cron/daily-notifications \
  -H "Authorization: Bearer your-cron-secret"

# Or visit in browser (for testing only)
http://localhost:3000/api/cron/daily-notifications
```

### Test Weekly Summary
```bash
curl http://localhost:3000/api/cron/weekly-summary \
  -H "Authorization: Bearer your-cron-secret"
```

### Test for Specific User
```typescript
// In your code or API route
import { runNotificationChecks } from '@/app/actions/notifications'

// Run all checks
await runNotificationChecks(userId)

// Or run specific checks
import { 
  checkBudgetExceeded,
  checkGoalProgress,
  checkUpcomingBills,
  generateWeeklySummary 
} from '@/app/actions/notifications'

await checkBudgetExceeded(userId)
await generateWeeklySummary(userId)
```

## 🌐 Option 3: External Cron Service (Alternative)

If not using Vercel, you can use external services like:

### A. Cron-job.org
1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL**: `https://your-domain.com/api/cron/daily-notifications`
   - **Schedule**: `0 9 * * *`
   - **HTTP Headers**: `Authorization: Bearer your-cron-secret`

### B. EasyCron
1. Sign up at https://www.easycron.com
2. Create cron job with same settings

### C. GitHub Actions (Free)
Create `.github/workflows/daily-notifications.yml`:

```yaml
name: Daily Notifications

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  run-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Notifications
        run: |
          curl -X GET https://your-domain.com/api/cron/daily-notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 📊 Monitoring Cron Jobs

### View Logs in Vercel
1. Go to **Deployments** → Select deployment → **Functions**
2. Find your cron function
3. View execution logs

### Add Custom Logging
The cron routes already include logging:
```typescript
console.log(`Running daily checks for ${users.length} users...`)
console.log(`Daily checks complete: ${successful} successful, ${failed} failed`)
```

### Set Up Alerts (Optional)
Add error monitoring to cron routes:

```typescript
// In your cron route
try {
  // ... existing code
} catch (error) {
  // Send to error tracking service
  await fetch('https://your-error-tracking-service.com/api/errors', {
    method: 'POST',
    body: JSON.stringify({ error, context: 'daily-notifications' })
  })
}
```

## 🎯 What Each Cron Job Does

### Daily Notifications (`/api/cron/daily-notifications`)
Runs 4 checks for all users:
1. **Budget Exceeded** - Alerts if monthly category budgets are exceeded
2. **Goal Progress** - Checks if goals are on track or at risk
3. **Upcoming Bills** - Predicts bills due in next 3 days
4. **Unusual Spending** - Flags transactions >2 std deviations above average

### Weekly Summary (`/api/cron/weekly-summary`)
Generates comprehensive weekly report:
- Total income vs expenses
- Net cash flow
- Top spending category
- Transaction count
- Professional assessment

## 🔐 Security Best Practices

1. **Always use CRON_SECRET** - Never expose cron endpoints publicly
2. **Rotate secrets regularly** - Change CRON_SECRET every few months
3. **Monitor execution logs** - Watch for unusual patterns
4. **Rate limit** - Vercel automatically rate limits, but add extra protection if needed

## 🐛 Troubleshooting

### Cron job not running?
1. Check Vercel dashboard → Cron Jobs tab
2. Verify `vercel.json` is in project root
3. Ensure environment variable `CRON_SECRET` is set
4. Check function logs for errors

### Getting 401 Unauthorized?
- Verify `Authorization` header matches `CRON_SECRET`
- Check environment variable is deployed

### No notifications created?
- Check user has transactions in database
- Verify notification thresholds are being met
- Check Supabase logs for query errors

## 📅 Recommended Schedule

For optimal user experience:

- **Daily Checks**: 9:00 AM local time (adjust timezone in cron schedule)
- **Weekly Summary**: Monday 9:00 AM (start of work week)
- **Monthly Report**: 1st of month at 9:00 AM (add new cron job if needed)

## 🎉 You're All Set!

Once deployed, Sasha will automatically:
- ✅ Monitor budgets daily
- ✅ Track goal progress
- ✅ Predict upcoming bills
- ✅ Detect unusual spending
- ✅ Generate weekly financial reports

Users will receive intelligent, actionable notifications without any manual intervention!
