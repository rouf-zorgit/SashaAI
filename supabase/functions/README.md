# Supabase Edge Functions

## Active Functions

### 1. processChat
**Path**: `functions/processChat/index.ts`
**Purpose**: Main AI chat handler for Sasha
**Status**: ✅ ACTIVE
**Features**:
- Intent classification
- Entity extraction
- Memory retrieval (STM/LTM)
- Emotion detection
- Smart categorization
- Pattern-based nudges
- Transaction processing

**Called by**: Frontend chat interface
**Cron**: No

### 2. analyzePatterns
**Path**: `functions/analyzePatterns/index.ts`
**Purpose**: Detect spending patterns and recurring payments
**Status**: ✅ ACTIVE
**Features**:
- Recurring payment detection
- Weekend spending spikes
- Payday splurges
- Category addiction detection

**Called by**: Cron job (nightly at midnight)
**Cron**: Yes (`cron_jobs.sql`)

### 3. processReceipt
**Path**: `functions/processReceipt/index.ts`
**Purpose**: OCR receipt processing
**Status**: ⚠️ VERIFY USAGE
**Features**:
- Image upload handling
- OCR text extraction
- Transaction parsing

**Called by**: Frontend (receipt upload)
**Cron**: No

## Functions to Review

### 4. checkBadges
**Path**: `functions/checkBadges/index.ts`
**Purpose**: Badge/achievement system
**Status**: ❓ VERIFY IF USED
**Action**: Check if frontend calls this function

### 5. detectPatterns
**Path**: `functions/detectPatterns/index.ts`
**Purpose**: Pattern detection (possibly duplicate of analyzePatterns)
**Status**: ❓ VERIFY IF DUPLICATE
**Action**: Compare with analyzePatterns, consolidate if duplicate

### 6. generateNotifications
**Path**: `functions/generateNotifications/index.ts`
**Purpose**: Generate smart notifications
**Status**: ❓ VERIFY IF USED
**Action**: Check if notification system is implemented

### 7. predictCashFlow
**Path**: `functions/predictCashFlow/index.ts`
**Purpose**: Cash flow prediction
**Status**: ❓ VERIFY IF USED
**Action**: Check if prediction feature is implemented

### 8. updateStreaks
**Path**: `functions/updateStreaks/index.ts`
**Purpose**: Update user streaks
**Status**: ❓ VERIFY IF USED
**Action**: Check if streak system is implemented

## Test Files (processChat)

- `test-skeleton.ts` - Test skeleton
- `test-simple.ts` - Simple test

**Action**: Move to `tests/` folder or delete if unused

## Deployment

Deploy all functions:
```bash
npx supabase functions deploy
```

Deploy specific function:
```bash
npx supabase functions deploy processChat
```

## Environment Variables

Required for all functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for processChat:
- `ANTHROPIC_API_KEY`

## Next Steps

1. Verify which functions are actually called by frontend
2. Remove unused functions
3. Consolidate duplicate functions (detectPatterns vs analyzePatterns)
4. Move test files to proper location
5. Add error monitoring
