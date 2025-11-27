# Manual Edge Function Deployment Guide

## 🚀 Deploy Claude API Functions to Supabase

Since the GitHub auto-deploy didn't work, follow these steps to manually deploy each function:

---

## Step 1: processChat (Main Chat Function)

1. **Go to:** https://app.supabase.com
2. **Select your project**
3. **Navigate to:** Edge Functions → processChat
4. **Click:** "Edit function" or create if doesn't exist
5. **Replace ALL code** with the content from: `supabase/functions/processChat/index.ts`
6. **Click:** "Deploy"

**What changed:** OpenAI → Claude API (`api.anthropic.com/v1/messages`)

---

## Step 2: processChatDeep (Background Learning)

1. **Navigate to:** Edge Functions → processChatDeep
2. **Replace code** with: `supabase/functions/processChatDeep/index.ts`
3. **Deploy**

---

## Step 3: generateWeeklySummary

1. **Navigate to:** Edge Functions → generateWeeklySummary
2. **Replace code** with: `supabase/functions/generateWeeklySummary/index.ts`
3. **Deploy**

---

## Step 4: processReceipt (OCR)

1. **Navigate to:** Edge Functions → processReceipt
2. **Replace code** with: `supabase/functions/processReceipt/index.ts`
3. **Deploy**

---

## ✅ Verify Deployment

After deploying all functions:

1. **Check Logs:**
   - Go to each function
   - Click "Logs" tab
   - Look for recent deployment messages

2. **Test Chat:**
   - Go to your app: https://sasha-staging.vercel.app
   - Send message: "I spent 500 on groceries"
   - Check processChat logs for "Claude API" or "anthropic.com"

---

## 🔑 Important: API Key

Make sure `ANTHROPIC_API_KEY` is set:

1. **Go to:** Settings → Edge Functions → Secrets
2. **Verify:** `ANTHROPIC_API_KEY` is set (you already configured this earlier)

---

## 🧪 Test Checklist

After deployment:

- [ ] processChat deployed successfully
- [ ] processChatDeep deployed successfully
- [ ] generateWeeklySummary deployed successfully
- [ ] processReceipt deployed successfully
- [ ] ANTHROPIC_API_KEY verified
- [ ] Chat message works
- [ ] Logs show "Claude API" (not "OpenAI")
