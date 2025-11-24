# ✅ CORRECT Upload Order for Supabase

## ⚠️ IMPORTANT: Upload ALL Files FIRST, Deploy LAST!

**The Error You Got:**
```
Module not found "spam-controller.ts"
```

**Why:** You deployed `index.ts` before uploading the other files it imports.

---

## 🎯 Correct Process

### Step 1: Upload ALL 12 Files (DON'T Deploy Yet!)

Upload these files **WITHOUT clicking Deploy**:

1. ✅ `types.ts` - Upload first (no dependencies)
2. ✅ `utils.ts` - Upload second (no dependencies)
3. ✅ `ltm.ts` - Upload
4. ✅ `stm.ts` - Upload
5. ✅ `episodic.ts` - Upload
6. ✅ `patterns.ts` - Upload
7. ✅ `personality.ts` - Upload
8. ✅ `spam-controller.ts` - Upload
9. ✅ `transaction-brain.ts` - Upload
10. ✅ `memory-extractor.ts` - Upload
11. ✅ `memory-injector.ts` - Upload
12. ✅ `index.ts` - Upload LAST

### Step 2: Verify All Files Present

Check that you see **12 files** in Supabase:
- types.ts
- utils.ts
- ltm.ts
- stm.ts
- episodic.ts
- patterns.ts
- personality.ts
- spam-controller.ts
- transaction-brain.ts
- memory-extractor.ts
- memory-injector.ts
- index.ts

### Step 3: NOW Deploy!

Click **Deploy** button only after all 12 files are uploaded.

---

## 📝 For Each File:

1. Click **+ Add File** (or edit existing)
2. Enter filename exactly (e.g., `types.ts`)
3. Open local file in VS Code
4. Copy all content (Ctrl+A, Ctrl+C)
5. Paste in Supabase (Ctrl+V)
6. Click **Save**
7. **DO NOT CLICK DEPLOY YET**
8. Repeat for next file

---

## ⚡ Quick Checklist

- [ ] Upload `types.ts`
- [ ] Upload `utils.ts`
- [ ] Upload `ltm.ts`
- [ ] Upload `stm.ts`
- [ ] Upload `episodic.ts`
- [ ] Upload `patterns.ts`
- [ ] Upload `personality.ts`
- [ ] Upload `spam-controller.ts`
- [ ] Upload `transaction-brain.ts`
- [ ] Upload `memory-extractor.ts`
- [ ] Upload `memory-injector.ts`
- [ ] Upload `index.ts`
- [ ] Verify all 12 files visible
- [ ] Click **Deploy**

---

**Start with `types.ts` and work your way down the list!**
