#!/bin/bash
# Staging Deployment Script (Vercel)
# Deploys to staging environment for alpha testing

set -e

echo "🔍 Deploying to STAGING (Vercel)..."
echo "===================================="

# 1. Check if .env.staging exists
if [ ! -f .env.staging ]; then
    echo "❌ .env.staging not found!"
    exit 1
fi

# 2. Run tests
echo "Running tests..."
npm run test || true

# 3. Build for staging
echo "Building for staging..."
cp .env.staging .env
npm run build

# 4. Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod

# 5. Deploy Supabase Functions (if staging project exists)
read -p "Deploy Supabase functions to staging? (y/n): " deploy_functions
if [ "$deploy_functions" = "y" ]; then
    echo "Deploying Edge Functions..."
    npx supabase functions deploy --project-ref [STAGING_REF]
fi

echo "✅ Staging deployment complete!"
echo "🌐 URL: Check Vercel dashboard for deployment URL"
