# Sasha AI Systems - Deployment Guide

## 🎯 Quick Start

You now have all 8 Sasha AI systems implemented! Here's how to deploy them:

---

## Step 1: Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/sasha_ai_enhancements.sql`
5. Paste and click **Run**
6. Verify tables were created (check the verification query at the bottom)

### Option B: Supabase CLI (if installed)

```bash
cd "c:\Users\abdur\.gemini\finAI - MVP"
supabase db push
```

---

## Step 2: Deploy Edge Function

### Replace Current processChat

The new integrated version is in: `supabase/functions/processChat/index-integrated.ts`

**To deploy:**

1. **Backup current version:**
   ```bash
   mv supabase/functions/processChat/index.ts supabase/functions/processChat/index-old.ts
   ```

2. **Use new version:**
   ```bash
   mv supabase/functions/processChat/index-integrated.ts supabase/functions/processChat/index.ts
   ```

3. **Deploy to Supabase:**
   ```bash
   # If using Supabase CLI
   supabase functions deploy processChat

   # OR via Vercel (your current setup)
   git add .
   git commit -m "feat: integrate all 8 Sasha AI systems"
   git push origin main
   ```

---

## Step 3: Test Locally

### Test Individual Systems

#### Test 1: Spam Controller
```bash
# Send same message 3 times via your chat interface
# Expected: 1st = normal, 2nd = annoyed, 3rd = stop
```

#### Test 2: LTM (Never Re-Ask)
```bash
# Message: "My salary is 50000"
# Expected: Saved to database
# Next session: Sasha should NEVER ask for salary again
```

#### Test 3: Transaction Brain with Undo
```bash
# Message: "I spent 500 at Starbucks"
# Expected: Transaction saved
# Message: "undo that"
# Expected: Transaction removed
```

#### Test 4: Episodic Memory
```bash
# After adding transactions for a week
# Message: "How much did I spend last week?"
# Expected: "Last week you spent X BDT on Y"
```

#### Test 5: Pattern Recognition
```bash
# Add multiple weekend transactions
# Expected: Sasha warns about weekend spike pattern
```

#### Test 6: Personality Adaptation
```bash
# Message: "I'm so stressed about money"
# Expected: Supportive tone, NO sarcasm
```

---

## Step 4: Deploy to Staging

### Update Environment Variables

Make sure these are set in your Vercel/Supabase environment:

```env
OPENAI_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Deploy

```bash
# Your current workflow
npm run deploy:staging
```

---

## 📊 What's Different?

### Before (Old processChat)
- 828 lines of monolithic code
- Basic memory retrieval
- No spam control
- No undo functionality
- Inconsistent personality
- No pattern detection

### After (New Integrated Version)
- Modular architecture (10 separate modules)
- **System 1 (LTM)**: Never re-asks for salary, name, fixed costs
- **System 2 (STM)**: Tracks topics, corrections, clarifications
- **System 3 (Episodic)**: "Last week you spent..." recall
- **System 4 (Personality)**: Emotion-adaptive, consistent tone
- **System 5 (Patterns)**: Detects 5 pattern types
- **System 6 (Transaction)**: Perfect undo, validation, retry logic
- **System 7 (Spam)**: Escalating responses, stops after 3 repeats
- **System 8 (Memory)**: Auto-extraction and injection

---

## 🔍 Verification Checklist

After deployment, verify each system:

- [ ] **Database Migration**: All tables exist (run verification query)
- [ ] **Spam Control**: Sending "hello" 3 times triggers escalation
- [ ] **LTM**: Providing salary once = never asked again
- [ ] **STM**: Topic tracking works within session
- [ ] **Episodic**: Can recall "last week" spending
- [ ] **Personality**: Adapts to stressed/happy emotions
- [ ] **Patterns**: Detects weekend spike after multiple weekend txs
- [ ] **Transaction**: Undo works perfectly
- [ ] **Memory**: Salary auto-extracted from "My salary is 50000"

---

## 🐛 Troubleshooting

### Issue: "Table does not exist" errors

**Solution**: Run the database migration (Step 1)

### Issue: Import errors in Edge Function

**Solution**: Ensure all module files are in `supabase/functions/processChat/`:
- `spam-controller.ts`
- `memory-extractor.ts`
- `memory-injector.ts`
- `personality.ts`
- `ltm.ts`
- `stm.ts`
- `episodic.ts`
- `patterns.ts`
- `transaction-brain.ts`

### Issue: Spam controller not working

**Solution**: Check that `spam_tracker` table exists in database

### Issue: Undo not working

**Solution**: Check that `transaction_undo_stack` table exists

---

## 📝 Next Steps

1. **Run database migration** (Step 1)
2. **Replace processChat function** (Step 2)
3. **Test locally** (Step 3)
4. **Deploy to staging** (Step 4)
5. **Verify all systems** (Verification Checklist)
6. **Deploy to production** (when ready)

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Sasha NEVER re-asks for salary after you tell her once  
✅ Sasha says "Last week you spent 15,000 on food"  
✅ Sasha detects "You always overspend on weekends"  
✅ "undo that" removes the last transaction  
✅ Sending "hello" 3 times makes Sasha stop responding  
✅ Sasha is supportive when you're stressed  
✅ All transactions save 100% reliably  

---

**Ready to deploy? Start with Step 1!** 🚀
