# 🚀 Deployment Guide for FinAI MVP

This guide outlines the steps to deploy your optimized Next.js application to Vercel (recommended) or any other hosting provider.

## 1. Pre-Deployment Checklist

- [x] **Environment Variables**: Ensure you have all production environment variables ready.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for server-side admin tasks)
  - `ANTHROPIC_API_KEY` (for Chat)
- [x] **Build Check**: Run `npm run build` locally to ensure there are no build errors.
- [x] **Lint Check**: Run `npm run lint` to catch any code issues.

## 2. Deploying to Vercel

Vercel is the creators of Next.js and offers the best integration.

### Step 1: Push to GitHub
Ensure your latest code is pushed to your GitHub repository.
```bash
git add .
git commit -m "Final production optimization"
git push origin main
```

### Step 2: Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `finAI-MVP` repository.

### Step 3: Configure Project
1. **Framework Preset**: Next.js (should be auto-detected).
2. **Root Directory**: `./` (default).
3. **Environment Variables**:
   - Copy all variables from your local `.env.local` file.
   - Paste them into the Environment Variables section.

### Step 4: Deploy
1. Click **"Deploy"**.
2. Wait for the build to complete.
3. Once done, you will get a production URL (e.g., `finai-mvp.vercel.app`).

## 3. Post-Deployment Verification

1. **Visit the URL**: Open your production app.
2. **Login**: Test authentication with Supabase.
3. **Chat**: Test the AI chat. It should be blazing fast! ⚡
4. **Transactions**: Create a test transaction.
5. **Receipts**: Upload a receipt (check if images load correctly).

## 4. Troubleshooting

- **Build Fails**: Check the Vercel logs. Common issues are missing env vars or type errors.
- **Chat Not Working**: Verify `ANTHROPIC_API_KEY` is set in Vercel.
- **Images Not Loading**: Verify Supabase Storage permissions and URL configuration.

## 5. Performance Monitoring

- Check **Vercel Analytics** (if enabled) to see real-world performance.
- Check **Speed Insights** for Core Web Vitals.

---

**Congratulations! Your app is now live!** 🚀
