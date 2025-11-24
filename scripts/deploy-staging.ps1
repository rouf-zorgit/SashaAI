# Staging Deployment Script (PowerShell)
# Deploys to staging environment for alpha testing

$ErrorActionPreference = "Stop"

Write-Host "Deploying to STAGING (Vercel)..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Check if .env.staging exists
if (-not (Test-Path .env.staging)) {
    Write-Error ".env.staging not found!"
    exit 1
}

# 2. Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
try {
    npm run test
}
catch {
    Write-Warning "Tests failed or not implemented, continuing..."
}

# 3. Build for staging
Write-Host "Building for staging..." -ForegroundColor Yellow
Copy-Item .env.staging .env -Force
npm run build

# 4. Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
npx vercel --prod

# 5. Deploy Supabase Functions (Optional)
$deployFunctions = Read-Host "Deploy Supabase functions to staging? (y/n)"
if ($deployFunctions -eq 'y') {
    Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow
    $stagingRef = "eocxtwjcwpgipfeayvhy" 
    npx supabase functions deploy --project-ref $stagingRef
}

Write-Host "Staging deployment complete!" -ForegroundColor Green
Write-Host "URL: Check Vercel dashboard for deployment URL" -ForegroundColor Green
