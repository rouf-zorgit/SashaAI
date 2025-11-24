# LTM Feature Deployment Guide

## Step 1: Deploy Database Schema

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/ltm_schema.sql`
5. Click **Run** to execute the SQL
6. Verify all tables were created successfully by checking the verification query output

Expected output:
```
✅ memory_events EXISTS
✅ user_preferences EXISTS
✅ user_spending_patterns EXISTS
```

## Step 2: Deploy Edge Function

```bash
# Navigate to your project directory
cd "c:\Users\abdur\.gemini\finAI - MVP"

# Deploy the processChat function
supabase functions deploy processChat
```

Expected output:
```
Deploying function processChat...
Function deployed successfully!
```

## Step 3: Test the LTM Feature

### Test 1: Name Memory
1. Open the app and go to Chat page
2. Send: "My name is John"
3. **Expected**: Sasha acknowledges your name
4. Refresh the page
5. Send: "What's my name?"
6. **Expected**: Sasha responds with "John"

### Test 2: Income Memory
1. Send: "My salary is 50000 BDT"
2. **Expected**: Sasha acknowledges and saves it
3. Check Supabase Dashboard > Table Editor > `profiles`
4. **Expected**: `income_monthly` = 50000

### Test 3: Preference Memory
1. Send: "I want to save money"
2. **Expected**: Sasha acknowledges your goal
3. Check Supabase Dashboard > Table Editor > `user_preferences`
4. **Expected**: `financial_goal` = "Save Money"

### Test 4: Onboarding Flow
1. Create a new test user account
2. Go to Chat page
3. Follow the onboarding prompts
4. **Expected**: Smooth progression through O0 → O1 → O2 → O3 → O4 → O_done

## Troubleshooting

### Issue: "Table does not exist" error
**Solution**: Make sure you ran the `ltm_schema.sql` in Supabase Dashboard

### Issue: Edge Function deployment fails
**Solution**: 
1. Check that you have Supabase CLI installed: `supabase --version`
2. Make sure you're logged in: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

### Issue: Sasha doesn't remember information
**Solution**:
1. Check browser console for errors
2. Verify the Edge Function is deployed: Check Supabase Dashboard > Edge Functions
3. Check the function logs: `supabase functions logs processChat`

## Verification Checklist

- [ ] Database schema deployed successfully
- [ ] Edge Function deployed successfully
- [ ] Name memory test passed
- [ ] Income memory test passed
- [ ] Preference memory test passed
- [ ] Onboarding flow works correctly
