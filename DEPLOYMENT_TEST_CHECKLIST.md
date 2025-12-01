# 🧪 Claude API Migration - Test Checklist

## ✅ Pre-Deployment
- [x] Supabase `ANTHROPIC_API_KEY` configured
- [x] Vercel environment variables set
- [x] GitHub integrations enabled (Vercel + Supabase)
- [x] PR created and ready to merge

---

## 🚀 Deployment Steps
- [ ] Merge PR to master
- [ ] Verify Vercel deployment succeeds
- [ ] Verify Supabase functions deployed
- [ ] Check deployment logs for errors

---

## 🧪 Post-Deployment Testing

### Test 1: Chat Message Processing
**Goal:** Verify main chat with Claude API works

**Steps:**
1. Open app: https://[your-vercel-url].vercel.app
2. Login to your account
3. Go to Chat page
4. Send message: "I spent 500 on groceries"

**Expected Result:**
- ✅ Claude responds naturally
- ✅ Transaction is saved
- ✅ Response mentions groceries category
- ✅ No errors in browser console

**Logs to check:**
```bash
# In Supabase Dashboard → Edge Functions → processChat → Logs
# Should see: "Claude API" requests, NOT "OpenAI"
```

---

### Test 2: Multi-Transaction Parsing
**Goal:** Test Claude's improved parsing

**Steps:**
1. Send: "I spent 20 on pen and 60 on transport"

**Expected Result:**
- ✅ Creates 2 separate transactions
- ✅ 20 BDT → Stationery/Shopping
- ✅ 60 BDT → Transport
- ✅ Natural confirmation response

---

### Test 3: Receipt OCR (Vision API)
**Goal:** Verify Claude Vision works for receipts

**Steps:**
1. Go to Receipts page
2. Upload a receipt image (or take photo)
3. Wait for processing

**Expected Result:**
- ✅ Receipt is processed
- ✅ Amount extracted correctly
- ✅ Merchant name detected
- ✅ Category auto-assigned
- ✅ Items list shown (if on receipt)

**Logs to check:**
```bash
# Supabase → processReceipt → Logs
# Should see: "Claude Vision response status: 200"
```

---

### Test 4: Conversational Context
**Goal:** Test Claude's better context understanding

**Steps:**
1. Send: "What did I spend on food today?"
2. Then: "Add 200 more to that"
3. Then: "Actually, make it 250"

**Expected Result:**
- ✅ Claude understands "that" refers to food
- ✅ Correctly adds transaction
- ✅ Understands correction request
- ✅ Updates amount properly

---

### Test 5: Deep Learning (Background)
**Goal:** Verify processChatDeep triggers

**Steps:**
1. Send any message in chat
2. Wait 5-10 seconds
3. Check Supabase logs

**Expected Result:**
- ✅ `processChatDeep` function triggers after assistant reply
- ✅ Logs show: "Deep Learning Mode"
- ✅ LTM extraction completes
- ✅ STM updates run
- ✅ No errors

**Logs to check:**
```bash
# Supabase → processChatDeep → Logs
# Should see: "🧠 DEEP LTM EXTRACTION..."
# Should see: "✅ LTM extraction complete"
```

---

### Test 6: Weekly Summary (Optional)
**Goal:** Test summary generation

**Steps:**
1. Add several transactions over past week (if not already there)
2. Trigger weekly summary (if you have a UI for this)
3. OR manually invoke: Supabase → generateWeeklySummary → Invoke

**Expected Result:**
- ✅ Summary generated in <3 sentences
- ✅ Mentions top spending category
- ✅ Provides actionable insight
- ✅ Encouraging tone

---

## 🔍 Error Checking

### Check Supabase Logs
```bash
# For each function, look for:
✅ "Claude API" or "Anthropic" in logs
✅ 200 status codes
✅ No "OpenAI" references
❌ Any 401/403 errors (means API key issue)
❌ JSON parsing errors
```

### Check Browser Console
```bash
# In browser DevTools → Console
✅ No 500 errors
✅ Supabase functions return successfully
❌ "ANTHROPIC_API_KEY not configured" errors
```

---

## 🐛 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not configured"
**Solution:**
1. Go to Supabase Dashboard
2. Settings → Edge Functions → Secrets
3. Verify `ANTHROPIC_API_KEY` is set
4. Redeploy functions if needed

### Issue: Chat not responding
**Solution:**
1. Check Supabase function logs for errors
2. Verify Claude API key is valid
3. Check browser network tab for failed requests

### Issue: Receipt OCR fails
**Solution:**
1. Check image is <5MB
2. Verify it's JPEG/PNG format
3. Check Supabase logs for Vision API errors

### Issue: JSON parsing errors
**Solution:**
- This is rare with Claude
- Check function logs to see actual response
- May need to adjust prompt if Claude adds explanation text

---

## ✅ Success Criteria

**All tests pass if:**
- [x] Chat processes transactions correctly
- [x] Claude API appears in logs (not OpenAI)
- [x] Receipt OCR extracts data accurately
- [x] No console errors
- [x] Deep learning triggers automatically
- [x] Responses are natural and contextual

---

## 📊 Performance Comparison (Optional)

Track these metrics before/after:
- **Response time:** Claude may be slightly faster
- **JSON reliability:** Should be more consistent
- **Context understanding:** Better multi-turn conversations
- **Vision accuracy:** Better receipt extraction

---

## 🎉 Migration Complete!

Once all tests pass:
1. ✅ Claude API fully integrated
2. ✅ OpenAI completely replaced
3. ✅ Auto-deployment pipeline working
4. ✅ Ready for production use

**Next Steps:**
- Monitor error rates in Sentry
- Track API costs in Anthropic dashboard
- Gather user feedback on chat quality
