# Restructure Plan: Clean Next.js Project

## Current Problem
- Two apps in one repo: Old Vite/React app (root) + New Next.js app (next-app/)
- Confusing structure
- Need to make Next.js the primary app

## Solution: Move Next.js to Root

### Step 1: Backup & Preparation
1. Commit current state (safety)
2. Create backup of important files

### Step 2: Remove Old Vite App
Delete these files/folders:
- `src/` (old React app)
- `public/` (old public folder)
- `index.html` (Vite entry)
- `vite.config.ts`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `eslint.config.js` (old config)
- Old package.json scripts

### Step 3: Move Next.js to Root
Move from `next-app/` to root:
- `next-app/src/` → `src/`
- `next-app/public/` → `public/`
- `next-app/package.json` → merge with root
- `next-app/tsconfig.json` → `tsconfig.json`
- `next-app/next.config.ts` → `next.config.ts`
- `next-app/tailwind.config.ts` → `tailwind.config.ts`
- All Next.js config files

### Step 4: Update Configuration
- Merge package.json dependencies
- Update .gitignore
- Update scripts
- Keep Supabase folder at root

### Step 5: Verify
- Run `npm install`
- Run `npm run dev`
- Test all pages
- Verify build works

### Step 6: Clean Up
- Delete empty `next-app/` folder
- Update README
- Commit clean structure

## Final Structure
```
finAI-MVP/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── store/
│   └── types/
├── public/
├── supabase/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── .env.local
```

## Commands to Execute
```bash
# 1. Commit current state
git add .
git commit -m "Pre-restructure checkpoint"

# 2. Remove old Vite app files
rm -rf src/ public/ index.html vite.config.ts tsconfig.app.json tsconfig.node.json eslint.config.js

# 3. Move Next.js files to root
mv next-app/src ./
mv next-app/public ./
mv next-app/next.config.ts ./
mv next-app/tsconfig.json ./
mv next-app/tailwind.config.ts ./
mv next-app/postcss.config.mjs ./
mv next-app/components.json ./

# 4. Merge package.json (manual)
# 5. Delete next-app folder
rm -rf next-app/

# 6. Install and test
npm install
npm run dev
```
