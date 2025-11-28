# Supabase Setup Guide

## ❌ Current Issue
Your Supabase URL `https://iqzfqxdkxwqxjvjgxdvz.supabase.co` is not resolving.

## ✅ How to Fix

### Step 1: Verify Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Check if you have an active project
4. If the project is **paused**, click "Resume Project"

### Step 2: Get the Correct Credentials

1. Click on your project
2. Go to **Settings** → **API**
3. Copy these values:

   **Project URL:**
   ```
   https://[your-project-ref].supabase.co
   ```

   **anon/public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Update `.env.local`

Replace the values in `c:\Users\abdur\.gemini\finAI - MVP\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[paste-your-project-url-here]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste-your-anon-key-here]
ANTHROPIC_API_KEY=sk-ant-api03-[your-key]
```

**Important:**
- No quotes around values
- No spaces
- Copy the FULL URL including `https://`
- Copy the FULL anon key (it's very long)

### Step 4: Run Database Migrations

After updating `.env.local`, run these migrations in your Supabase SQL Editor:

1. `supabase/migrations/003_messages_and_transactions.sql`
2. `supabase/migrations/004_goals_notifications_reminders.sql`

### Step 5: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 6: Test

Try signing up again at http://localhost:3000

---

## Alternative: Create a New Supabase Project

If your project is deleted or you can't access it:

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose a name and region
4. Wait for it to provision (~2 minutes)
5. Follow Steps 2-6 above
