---
description: Deploy code changes to staging via GitHub and Vercel
---

# Deploy to Staging Workflow

This workflow guides you through deploying your code changes from Antigravity to the staging environment.

## Prerequisites

- Changes saved in Antigravity
- GitHub Desktop installed
- Vercel connected to GitHub repository

## Steps

### 1. Verify Local Changes

Check that your code works locally:

```bash
npm run dev
```

Test the changes in your browser at `http://localhost:5173`

### 2. Build Test (Optional but Recommended)

Verify the production build works:

// turbo
```bash
npm run build
```

If build succeeds, preview it:

```bash
npm run preview
```

### 3. Open GitHub Desktop

Launch GitHub Desktop and verify you're on the `master` branch.

### 4. Review Changed Files

In GitHub Desktop:
- Check the left panel for all modified files
- Review the diff for each file
- Ensure no unintended changes are included

### 5. Write Commit Message

Write a clear, descriptive commit message:

**Format:**
```
[type]: Brief description

- Detail 1
- Detail 2
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation
- `style:` UI/CSS changes
- `perf:` Performance improvement

**Example:**
```
fix: resolve chat auto-scroll issue

- Fixed scroll behavior in Chat.tsx
- Updated useEffect dependencies
- Added scroll-to-bottom on new messages
```

### 6. Commit Changes

Click **"Commit to master"** button in GitHub Desktop.

### 7. Push to GitHub

Click **"Push origin"** button in the top right of GitHub Desktop.

Wait for the push to complete successfully.

### 8. Monitor Vercel Deployment

**Option A: Vercel Dashboard**
1. Visit https://vercel.com/dashboard
2. Find your project
3. Watch the deployment progress
4. Typical time: 30-60 seconds

**Option B: Wait Method**
Simply wait 60 seconds for auto-deployment to complete.

### 9. Get Staging URL

Find your staging URL in one of these ways:

**From Vercel Dashboard:**
- Go to your project
- Click on the latest deployment
- Copy the deployment URL

**From Previous Deployments:**
- Use the same staging URL as before
- Format: `https://[project]-[hash].vercel.app`

### 10. Test on Staging

Visit your staging URL and verify:

- ✅ Page loads without errors
- ✅ No console errors (F12 → Console)
- ✅ Your changes are visible
- ✅ Features work as expected
- ✅ Supabase connection works
- ✅ No broken functionality

### 11. Verify Deployment Success

**If everything works:**
✅ Deployment complete! Your changes are live on staging.

**If issues found:**
1. Note the specific issue
2. Return to Antigravity
3. Fix the issue
4. Repeat this workflow from Step 1

## Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to see errors
3. Fix TypeScript/build errors
4. Commit and push again

### Changes Not Visible on Staging

1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if correct deployment is active in Vercel
4. Verify the commit was pushed to GitHub

### Push Rejected by GitHub

```bash
# Pull latest changes first
git pull origin master

# Resolve any conflicts
# Then push again
git push origin master
```

Or use GitHub Desktop's "Pull" button before pushing.

## Quick Reference

```bash
# Local testing
npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview production build

# Git commands (if using CLI instead of GitHub Desktop)
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit
git push origin master   # Push to GitHub
```

## Success Criteria

- ✅ Code committed with clear message
- ✅ Pushed to GitHub successfully
- ✅ Vercel deployment completed
- ✅ Staging URL loads without errors
- ✅ Changes verified on staging
- ✅ All features working correctly

## Next Steps

After successful staging deployment:

1. **Test thoroughly** on staging URL
2. **Share staging URL** with team/testers if needed
3. **Monitor** for any issues
4. **Iterate** if bugs are found
5. **Document** any significant changes

---

**Estimated Time:** 2-5 minutes per deployment cycle
