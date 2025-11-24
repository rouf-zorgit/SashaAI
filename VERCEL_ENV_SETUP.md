# Setting Up Environment Variables in Vercel

Your app is deployed but showing 404 because it needs environment variables!

## Quick Fix Steps:

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/abdur-roufs-projects-e29a8419/sasha-staging/settings/environment-variables

Or:
1. Go to https://vercel.com/dashboard
2. Click on your "sasha-staging" project
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar

### 2. Add These Environment Variables

Click "Add New" for each variable:

**Variable 1:**
- Key: `VITE_ENVIRONMENT`
- Value: `staging`
- Environment: Production ✓

**Variable 2:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://eocxtwjcwpgipfeayvhy.supabase.co`
- Environment: Production ✓

**Variable 3:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvY3h0d2pjd3BnaXBmZWF5dmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjczODcsImV4cCI6MjA3OTUwMzM4N30.CONmCS1j4u6U2GjSxRMxj4bVqYXRA-uZw7ti8oCUWHA`
- Environment: Production ✓

**Variable 4:**
- Key: `VITE_OPENAI_API_KEY`
- Value: `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`
- Environment: Production ✓

**Variable 5:**
- Key: `VITE_API_URL`
- Value: `https://sasha-staging-96qk0kn1l-abdur-roufs-projects-e29a8419.vercel.app`
- Environment: Production ✓

### 3. Redeploy

After adding all variables, click "Redeploy" in Vercel or run:

```bash
npx vercel --prod
```

The app should work after the redeploy! ✅
