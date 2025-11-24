#!/bin/bash
# Production Deployment Script (AWS)
# Deploys to production environment with safety checks

set -e

echo "🚨 PRODUCTION DEPLOYMENT (AWS)"
echo "=============================="

# 1. Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

# 2. Verify AI Chat is stable
echo "⚠️  IMPORTANT: Verify AI Chat is stable before proceeding"
read -p "Is AI Chat stable and tested? (yes/no): " chat_stable
if [ "$chat_stable" != "yes" ]; then
    echo "❌ Deployment cancelled - AI Chat not stable"
    exit 1
fi

# 3. Run full test suite
echo "Running full test suite..."
npm run test
# npm run test:e2e  # Uncomment when E2E tests are ready

# 4. Build for production
echo "Building production bundle..."
cp .env.production .env
npm run build

# 5. Final confirmation
echo ""
echo "⚠️  FINAL CONFIRMATION"
echo "====================="
echo "You are about to deploy to PRODUCTION (AWS)"
echo "This will affect live users!"
echo ""
read -p "Deploy to AWS PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# 6. Deploy to AWS S3
echo "Deploying to AWS S3..."
aws s3 sync dist/ s3://finai-production --delete

# 7. Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*"

# 8. Deploy Supabase Functions
echo "Deploying Edge Functions to production..."
npx supabase functions deploy --project-ref [PROD_REF]

# 9. Run smoke tests
echo "Running smoke tests..."
sleep 10  # Wait for deployment to propagate
curl -f https://finai.app || echo "⚠️  Smoke test failed!"

echo ""
echo "✅ PRODUCTION DEPLOYMENT COMPLETE!"
echo "🌐 URL: https://finai.app"
echo "📊 CloudFront: Check AWS Console"
echo ""
echo "Next steps:"
echo "1. Monitor CloudWatch for errors"
echo "2. Test critical user flows"
echo "3. Monitor user feedback"
