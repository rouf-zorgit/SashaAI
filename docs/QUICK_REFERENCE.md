# 🚀 Quick Deployment Cheat Sheet

## The 7-Step Cycle

```
1. Code in Antigravity (AI-assisted)
   ↓
2. Save files (Ctrl+S)
   ↓
3. Open GitHub Desktop
   ↓
4. Commit (write clear message)
   ↓
5. Push to origin/master
   ↓
6. Wait 30-60 seconds
   ↓
7. Test on staging URL
   ↓
   Repeat if needed
```

---

## ⚡ Quick Commands

### Local Development
```bash
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Git (via GitHub Desktop or CLI)
```bash
git status               # Check what changed
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push origin master   # Push to GitHub
```

### Supabase Functions
```bash
supabase functions deploy                # Deploy all functions
supabase functions deploy processChat    # Deploy specific function
```

---

## 📝 Commit Message Template

```
[type]: Brief description

- Detail 1
- Detail 2
- Detail 3
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `perf`

---

## ✅ Pre-Push Checklist

- [ ] Code works locally (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Clear commit message written
- [ ] Reviewed changed files

---

## 🔍 Testing Checklist

After deployment to staging:

- [ ] Page loads
- [ ] No console errors
- [ ] Features work
- [ ] Supabase connected
- [ ] UI looks correct

---

## 🚨 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run build` locally, fix errors |
| Push rejected | Pull first: `git pull origin master` |
| Changes not visible | Hard refresh (Ctrl+Shift+R) |
| Vercel not deploying | Check Vercel dashboard for errors |

---

## 🔗 Important Links

- **GitHub Repo:** https://github.com/rouf-zorgit/SashaAI
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## 📊 Your Stack

```
Antigravity (Local Dev)
    ↓
GitHub (Version Control)
    ↓
Vercel (Auto-Deploy)
    ↓
Staging URL (Testing)
    ↓
Supabase (Database)
```

---

## 💡 Pro Tips

1. **Commit often** - Small, focused commits
2. **Test locally first** - Catch issues early
3. **Clear messages** - Future you will thank you
4. **Monitor deployments** - Check Vercel dashboard
5. **Use workflows** - Type `/deploy-to-staging` in Antigravity

---

**Need detailed guide?** See `DEVELOPMENT_WORKFLOW.md`
