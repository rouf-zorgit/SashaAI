# Quick Vercel Staging Deployment Guide

## Prerequisites
1. Vercel account (sign up at vercel.com if needed)
2. Vercel CLI authenticated

## Step 1: Login to Vercel
```bash
npx vercel login
```
Follow the prompts to authenticate.

## Step 2: Build the App
```bash
# Copy staging environment
Copy-Item .env.staging .env -Force

# Build
npm run build
```

## Step 3: Deploy to Vercel
```bash
# Deploy to production (staging environment)
npx vercel --prod
```

When prompted:
- **Set up and deploy**: `yes`
- **Which scope**: Select your account
- **Link to existing project**: `no` (first time) or `yes` (subsequent)
- **Project name**: `finai-staging` or similar
- **Directory**: `./` (press Enter)
- **Override settings**: `no` (press Enter)

## Step 4: Configure Environment Variables in Vercel Dashboard
After deployment, go to your Vercel project settings and add:
- `VITE_ENVIRONMENT=staging`
- `VITE_SUPABASE_URL=https://eocxtwjcwpgipfeayvhy.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<your-staging-anon-key>`
- `VITE_OPENAI_API_KEY=<your-openai-key>`
- `VITE_API_URL=<your-vercel-url>`

## Step 5: Redeploy
```bash
npx vercel --prod
```

Your staging app will be live at the URL provided by Vercel!
