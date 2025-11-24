# 🚀 Sasha AI Deployment - Step-by-Step

## Step 1: Database Migration ⏱️ 5 minutes

### Option A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

3. **Run Migration**
   - Open file: `supabase/migrations/sasha_ai_enhancements.sql`
   - Copy ALL contents (395 lines)
   - Paste into SQL Editor
   - Click **Run** (bottom right)

4. **Verify Success**
   - Should see: "Success. No rows returned"
   - Run verification query at bottom of migration file
   - Should see all new tables listed

### Option B: Supabase CLI (If installed)

```bash
cd "c:\Users\abdur\.gemini\finAI - MVP"
supabase db push
```

---

## Step 2: Replace Edge Function ⏱️ 2 minutes

### Backup Current Version

```bash
cd "c:\Users\abdur\.gemini\finAI - MVP\supabase\functions\processChat"

# Backup old version
cp index.ts index-old-backup.ts
```

### Replace with New Version

```bash
# Replace with integrated version
cp index-integrated.ts index.ts
```

**What this does:**
- Old version: 828 lines, monolithic
- New version: 414 lines, modular, all 8 systems integrated

---

## Step 3: Deploy to Vercel ⏱️ 5 minutes

### Commit Changes

```bash
cd "c:\Users\abdur\.gemini\finAI - MVP"

git add .
git commit -m "feat: integrate all 8 Sasha AI systems

- Add database migration for LTM, STM, Episodic, Patterns, Transaction Brain, Spam Controller
- Replace processChat with modular integrated version
- Connect all 8 AI systems to database
- Add memory extraction and injection
- Add personality adaptation
- Add spam control with escalation
- Add transaction undo functionality
- Add pattern recognition and warnings"

git push origin main
```

### Monitor Deployment

1. Go to: https://vercel.com/dashboard
2. Watch deployment progress
3. Wait for "Deployment Complete" ✅

---

## Step 4: Quick Smoke Test ⏱️ 3 minutes

### Test 1: Basic Chat
- Open your app
- Send: "Hello"
- Expected: Sasha responds normally

### Test 2: LTM Extraction
- Send: "My salary is 50000"
- Expected: Sasha acknowledges and saves

### Test 3: Transaction
- Send: "I spent 500 at Starbucks"
- Expected: Transaction saved

### Test 4: Undo
- Send: "undo that"
- Expected: Transaction removed

---

## Step 5: Full Testing ⏱️ 15 minutes

### Test Suite

#### ✅ Test 1: Spam Controller
```
Send: "hello"
Send: "hello"
Send: "hello"

Expected:
1st: Normal response
2nd: "You just said that. What's going on?"
3rd: "Okay, you're repeating yourself. I'm not responding to this anymore."
```

#### ✅ Test 2: LTM (Never Re-Ask)
```
Send: "My name is John and my salary is 50000"
Wait 5 seconds
Send: "What's my name?"

Expected: "Your name is John" (NOT "What's your name?")
```

#### ✅ Test 3: Transaction Brain
```
Send: "I spent 500 at Starbucks"
Expected: Transaction saved

Send: "Actually make it 600"
Expected: Transaction updated

Send: "undo that"
Expected: Transaction removed
```

#### ✅ Test 4: Episodic Memory
```
Add 3-4 transactions over the week
Send: "How much did I spend last week?"

Expected: "Last week you spent X BDT on [categories]"
```

#### ✅ Test 5: Pattern Recognition
```
Add multiple weekend transactions (Sat/Sun)
Wait for pattern analysis (or trigger manually)

Expected: Sasha warns about weekend spending spike
```

#### ✅ Test 6: Personality Adaptation
```
Send: "I'm so stressed about money"

Expected: Supportive tone, NO sarcasm
Example: "I hear you. That sounds tough. Let's look at this together."
```

---

## 🎯 Success Criteria

You'll know it's working when:

- ✅ Sasha NEVER re-asks for salary after you tell her once
- ✅ Sasha says "Last week you spent X on Y"
- ✅ Sasha detects "You always overspend on weekends"
- ✅ "undo that" removes the last transaction
- ✅ Sending "hello" 3 times makes Sasha stop responding
- ✅ Sasha is supportive when you're stressed
- ✅ All transactions save 100% reliably

---

## 🐛 Troubleshooting

### Issue: "Table does not exist" errors

**Cause:** Migration not run  
**Fix:** Go back to Step 1

### Issue: Old behavior still happening

**Cause:** Edge Function not deployed  
**Fix:** Check Vercel deployment status

### Issue: Import errors

**Cause:** Module files missing  
**Fix:** Ensure all module files are committed:
```bash
git status
git add supabase/functions/processChat/*.ts
git commit -m "Add missing module files"
git push
```

---

## 📝 Current Status

- [/] Step 1: Database Migration
- [/] Step 2: Replace Edge Function
- [ ] Step 3: Deploy to Vercel
- [ ] Step 4: Quick Smoke Test
- [ ] Step 5: Full Testing

---

**Ready? Let's start with Step 1!** 🚀
