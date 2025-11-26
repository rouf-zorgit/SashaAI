# CLAUDE.md - AI Assistant Guide for SashaAI

**Project**: SashaAI (FinAI MVP)
**Type**: Full-Stack AI-Powered Financial Management Application
**Last Updated**: 2025-11-26

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Directory Structure](#directory-structure)
4. [Development Workflow](#development-workflow)
5. [Key Conventions](#key-conventions)
6. [Database Schema](#database-schema)
7. [AI System Architecture](#ai-system-architecture)
8. [Common Tasks & Workflows](#common-tasks--workflows)
9. [Deployment Process](#deployment-process)
10. [Testing & Quality Assurance](#testing--quality-assurance)
11. [Important Files & Patterns](#important-files--patterns)
12. [Troubleshooting](#troubleshooting)
13. [Security Considerations](#security-considerations)

---

## Project Overview

**SashaAI** is an AI-powered financial assistant that helps users manage their finances through natural conversation. The AI assistant, named "Sasha," provides:

- Natural language transaction processing
- Automatic categorization with confidence scoring
- Spending pattern detection and insights
- Budget tracking and goal management
- Receipt OCR processing
- Personalized financial coaching
- Multi-currency support with real-time exchange rates
- Episodic memory system for contextual conversations
- Gamification (streaks, badges, achievements)

**Core Philosophy**: Natural, conversational finance management with adaptive personality and deep learning memory.

---

## Architecture & Technology Stack

### Frontend Stack

**Core Framework**:
- **React 19.2.0** - Latest React with modern hooks
- **TypeScript 5.9.3** - Type safety across the codebase
- **Vite 7.2.4** - Build tool and dev server (HMR enabled)

**Routing & State**:
- **React Router DOM 7.9.6** - Client-side routing
- **Zustand 5.0.8** - Lightweight global state (auth store)
- **React Context** - Transaction data with real-time subscriptions

**UI & Styling**:
- **Tailwind CSS 3.4.18** - Utility-first styling
- **Lucide React 0.554.0** - Icon library
- **clsx + tailwind-merge** - Conditional class management
- **Recharts 3.4.1** - Data visualization

**Data & Validation**:
- **Zod 4.1.12** - Schema validation
- **React Markdown 10.1.0** - AI response rendering

**Monitoring**:
- **Sentry 10.27.0** - Error tracking and performance
- **Vercel Analytics 1.5.0** - Usage analytics

### Backend Stack

**Database & Backend**:
- **Supabase 2.58.5** - PostgreSQL + Auth + Real-time + Edge Functions
- **PostgreSQL** - Database with Row Level Security (RLS)
- **Deno** - Edge Functions runtime (TypeScript)

**AI & Processing**:
- **OpenAI API** - GPT models for chat processing
- Custom pattern detection algorithms
- Emotion detection and intent classification
- Entity extraction (amount, category, merchant)

**Deployment**:
- **Vercel** - Frontend hosting (SPA)
- **Supabase Cloud** - Backend services
- **Docker + Docker Compose** - Local development

---

## Directory Structure

```
/home/user/SashaAI/
├── src/                        # Frontend source code
│   ├── components/             # Reusable UI components (17 total)
│   │   ├── Layout.tsx          # Main layout with navigation
│   │   ├── ProtectedRoute.tsx  # Authentication guard
│   │   ├── TransactionItem.tsx # Transaction display
│   │   ├── FilterPanel.tsx     # Advanced filtering
│   │   ├── CashFlowChart.tsx   # Visualizations
│   │   ├── PatternInsights.tsx # AI insights display
│   │   ├── WeeklySummary.tsx   # Weekly AI reports
│   │   ├── Paywall.tsx         # Premium gating
│   │   └── ...                 # 9 more components
│   │
│   ├── pages/                  # Route-level pages (14 total)
│   │   ├── Chat.tsx            # Main AI chat interface
│   │   ├── History.tsx         # Transaction history
│   │   ├── Reports.tsx         # Financial analytics
│   │   ├── Receipts.tsx        # Receipt OCR
│   │   ├── Budgets.tsx         # Budget tracking
│   │   ├── Goals.tsx           # Savings goals
│   │   ├── Reminders.tsx       # Bill reminders
│   │   ├── Profile.tsx         # User profile
│   │   ├── Settings.tsx        # App settings
│   │   ├── Subscription.tsx    # Premium management
│   │   ├── Notifications.tsx   # Smart notifications
│   │   ├── Login.tsx           # Authentication
│   │   ├── Signup.tsx          # Registration
│   │   └── ForgotPassword.tsx  # Password recovery
│   │
│   ├── lib/                    # Core utilities & logic
│   │   ├── db/                 # Database layer (8 modules)
│   │   │   ├── sasha.ts        # AI features (960+ lines)
│   │   │   ├── transactions.ts # Transaction CRUD
│   │   │   ├── profiles.ts     # User profiles
│   │   │   ├── messages.ts     # Chat persistence
│   │   │   ├── receipts.ts     # Receipt data
│   │   │   ├── budgets.ts      # Budgets/goals/reminders
│   │   │   ├── recurring.ts    # Recurring detection
│   │   │   └── subscription.ts # Subscription status
│   │   │
│   │   ├── validators/         # Zod schemas
│   │   │   ├── transaction.ts
│   │   │   └── profile.ts
│   │   │
│   │   ├── supabase.ts         # Database client
│   │   ├── ai.ts               # Edge Function interface
│   │   ├── config.ts           # App configuration
│   │   ├── notifications.ts    # Notification service
│   │   ├── undo.ts             # Undo functionality
│   │   ├── ocr.ts              # Receipt processing
│   │   ├── exchangeRates.ts    # Currency conversion
│   │   └── ...
│   │
│   ├── contexts/               # React Context providers
│   │   └── TransactionContext.tsx
│   │
│   ├── store/                  # Zustand stores
│   │   └── authStore.ts        # Authentication state
│   │
│   ├── types/                  # TypeScript definitions
│   ├── hooks/                  # Custom React hooks
│   ├── constants/              # App-wide constants
│   ├── assets/                 # Images, fonts
│   ├── App.tsx                 # Main app + routing
│   └── main.tsx                # Entry point (Sentry init)
│
├── supabase/                   # Backend services
│   ├── functions/              # Edge Functions
│   │   ├── processChat/        # Main AI chat handler
│   │   ├── processChatDeep/    # Deep memory system
│   │   ├── processReceipt/     # OCR processing
│   │   ├── analyzePatterns/    # Pattern detection (cron)
│   │   ├── generateWeeklySummary/
│   │   ├── testSentry/
│   │   └── _shared/            # Shared utilities
│   │       ├── logger.ts
│   │       ├── analytics.ts
│   │       ├── sentry.ts
│   │       └── patterns.ts
│   │
│   ├── migrations/             # Database migrations (8 files)
│   └── utilities/              # SQL utilities
│
├── scripts/                    # Deployment scripts
│   ├── dev.sh
│   ├── deploy-staging.sh
│   ├── deploy-staging.ps1
│   └── deploy-production.sh
│
├── public/                     # Static assets
├── Docker files                # Container configs
├── Config files                # TS, Vite, Tailwind, ESLint
└── Documentation (*.md)        # 18+ markdown docs
```

---

## Development Workflow

### Local Development

**Starting the Development Server**:

```bash
# Standard development
npm run dev                    # Vite dev server (port 5173)

# Alternative with custom script
npm run dev:local              # Uses scripts/dev.sh

# Preview production build
npm run build && npm run preview
```

**Environment Setup**:

1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Required environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_OPENAI_API_KEY=sk-proj-...  # Edge Functions only
   VITE_BASE_CURRENCY=BDT           # Default currency
   ```

3. Restart dev server after env changes

**Development Tools**:

```bash
npm run lint                   # Run ESLint
npm run build                  # Test production build
npm run build:staging          # Staging build
npm run build:production       # Production build
```

### Git Workflow

**Branch Strategy**:
- `main` - Production-ready code
- `claude/claude-md-*` - Feature branches for AI development
- Always create feature branches for new work

**Commit Message Conventions**:

Based on recent commits, follow this pattern:

```
<type>(<scope>): <description>

Types: feat, fix, chore, docs, refactor, test
Scopes: frontend, backend, db, ai, ui, subscription, etc.

Examples:
feat(ai): introduce deep chat processing with memory system
fix(build): resolve type errors and unused imports
feat(subscription): implement complete subscription system
feat(profile): fix Goals and Budgets critical bugs
```

**Important Git Rules**:
1. **NEVER** commit sensitive data (.env files, API keys)
2. Run `npm run build` before committing to catch type errors
3. Test locally before pushing
4. Keep commits atomic and well-described
5. Reference issue numbers when applicable

### Development Environment

**Three Environments**:

| Environment | Purpose | URL | Config |
|------------|---------|-----|--------|
| **Local** | Development | localhost:5173 | `.env.local` |
| **Staging** | Pre-production testing | Vercel staging | `.env.staging` |
| **Production** | Live application | Vercel prod | Vercel env vars |

**Environment Differences**:
- Local: Uses local/dev Supabase project
- Staging: Uses staging Supabase project
- Production: Uses production Supabase project

---

## Key Conventions

### 1. Code Organization

**Component Structure**:
- One component per file
- Co-locate related utilities with components
- Use TypeScript interfaces for props
- Export component as default

**File Naming**:
- Components: `PascalCase.tsx` (e.g., `TransactionItem.tsx`)
- Utilities: `camelCase.ts` (e.g., `exchangeRates.ts`)
- Types: `camelCase.ts` or `PascalCase.ts`
- Constants: `UPPER_SNAKE_CASE` or `camelCase.ts`

### 2. Database Access Pattern

**Always use the database layer modules**:

```typescript
// ✅ CORRECT: Use /lib/db/ modules
import { getUserTransactions } from '../lib/db/transactions';
const transactions = await getUserTransactions(userId);

// ❌ WRONG: Direct Supabase queries in components
const { data } = await supabase.from('transactions').select('*');
```

**Benefits**:
- Centralized error handling
- Consistent data transformation
- Type safety
- Easier testing and maintenance

### 3. Authentication Pattern

**Always check authentication**:

```typescript
// For pages: Use ProtectedRoute wrapper
<Route path="/chat" element={
  <ProtectedRoute>
    <Chat />
  </ProtectedRoute>
}>

// In components/services: Check auth state
import { useAuthStore } from '../store/authStore';

const { user } = useAuthStore();
if (!user) {
  // Handle unauthenticated state
}
```

### 4. Error Handling

**Consistent error handling with Sentry**:

```typescript
import * as Sentry from '@sentry/react';

try {
  // Operation
} catch (error) {
  console.error('Context-specific message:', error);
  Sentry.captureException(error, {
    tags: { feature: 'transactions' },
    extra: { userId, transactionId }
  });
  // User-friendly fallback
}
```

### 5. Validation Pattern

**Use Zod schemas for all user input**:

```typescript
import { transactionSchema } from '../lib/validators/transaction';

try {
  const validated = transactionSchema.parse(userInput);
  // Proceed with validated data
} catch (error) {
  // Handle validation errors
}
```

### 6. Real-time Subscriptions

**Use TransactionContext for real-time data**:

```typescript
import { TransactionContext } from '../contexts/TransactionContext';

const { transactions, loading, refresh } = useContext(TransactionContext);

// Transactions auto-update via Supabase real-time
```

### 7. AI Processing Pattern

**Use Edge Function interface**:

```typescript
import { processChat } from '../lib/ai';

const response = await processChat({
  userId,
  sessionId,
  message,
  profile
});
```

### 8. Styling Conventions

**Tailwind CSS utilities**:

```typescript
import { cn } from '../lib/utils'; // clsx + tailwind-merge

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // Allow prop overrides
)} />
```

### 9. Type Safety

**Always define types for**:
- Component props
- Function parameters
- API responses
- Database queries
- State management

```typescript
interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (id: string) => void;
  className?: string;
}
```

### 10. Performance

**Optimization patterns**:
- Use React.memo for expensive components
- Implement virtualization for long lists (>100 items)
- Lazy load routes with React.lazy
- Optimize images (WebP, lazy loading)
- Use Zustand for global state (avoid prop drilling)

---

## Database Schema

### Core Tables

**profiles**:
- User account data
- Fields: email, full_name, monthly_salary, currency, fixed_costs, primary_goal, communication_style, onboarding_completed, avatar_url
- RLS: Users can only access their own profile

**transactions**:
- Financial transactions
- Fields: user_id, amount, currency, base_amount, category, merchant_name, type (income/expense/adjustment), description, confidence, is_confirmed, deleted_at
- Soft delete enabled
- Indexed: user_id, created_at, category
- RLS: Users can only access their own transactions

**messages**:
- Chat conversation history
- Fields: user_id, session_id, role (user/assistant/system), content, intent, confidence, metadata
- Indexed: session_id + created_at
- RLS: Users can only access their own messages

**recurring_rules**:
- Detected recurring payment patterns
- Fields: keyword, amount, cycle (daily/weekly/monthly/yearly), last_triggered
- Used by pattern detection system

**subscription_status**:
- Premium subscription tracking
- Plans: free, monthly, three_month, six_month
- Features gated by tier

### AI Feature Tables

**user_profiles_extended**:
- Extended user preferences for AI personality
- Fields: spending_personality, primary_goal, risk_tolerance, trigger_categories, salary_day, sarcasm_preference, leaderboard_opt_in

**spending_patterns**:
- AI-detected spending patterns
- Types: weekend_spike, payday_splurge, stress_shopping, recurring_bill, impulse_category
- Fields: pattern_type, trigger_day, trigger_category, avg_amount, frequency, confidence

**smart_notifications**:
- AI-generated notifications
- Types: bill_reminder, budget_alert, pattern_warning, goal_update, weekly_summary, smart_reminder
- Fields: title, message, priority, is_read, action_url, scheduled_for

**conversation_context** (Short-term Memory):
- Session-based context storage
- Types: topic, decision, preference, question
- Auto-expires after TTL
- Used for maintaining conversation flow

**episodic_events** (Long-term Memory):
- Important user events and milestones
- Types: transaction, conversation, goal, decision, milestone, achievement, pattern_detected
- Fields: event_type, event_data, occurred_at, importance, tags, summary, related_to
- Used for "Do you remember when..." queries

**user_emotional_state**:
- Emotion tracking over time
- Emotions: happy, stressed, frustrated, excited, worried, neutral
- Fields: emotion, intensity (0.0-1.0), context
- Used for adaptive personality

**memory_events**:
- AI memory system events
- Tracks what Sasha has learned about the user

### Financial Planning Tables

**budgets**:
- User budget tracking
- Fields: category, amount, period (weekly/monthly), start_date, end_date

**savings_goals**:
- User savings goals
- Fields: name, target_amount, current_amount, deadline, priority

**bill_reminders**:
- Bill payment reminders
- Fields: name, amount, due_date, frequency, is_paid

**cash_flow_predictions**:
- AI-generated forecasts
- Warning levels: safe, caution, danger, crisis
- Based on spending patterns and income

**scenario_simulations**:
- "What-if" financial scenarios
- Types: savings, income_change, loan, investment, expense_cut

### Gamification Tables

**streaks**:
- Streak tracking
- Types: budget, savings, logging, no_impulse
- Fields: streak_type, current_count, best_count, last_updated

**badges** & **user_badges**:
- Achievement system
- Tiers: bronze, silver, gold, platinum

### Other Tables

**receipts**:
- Uploaded receipt data from OCR
- Links to transactions after processing

**recurring_payments**:
- Auto-detected recurring payments

**user_spending_patterns**:
- User-specific spending pattern history

**coaching_sessions**:
- Interactive financial coaching
- Topics: debt_payoff, investing_basics, emergency_fund, budgeting, salary_negotiation

**negotiation_history**:
- User-AI negotiation tracking
- Outcomes: accepted, rejected, pending

### Row Level Security (RLS)

**All tables have RLS enabled**:
- Users can only access their own data
- Policy: `auth.uid() = user_id` on all operations
- Service role has full access for Edge Functions
- Anonymous access denied

### Database Migrations

Location: `/home/user/SashaAI/supabase/migrations/`

**Recent migrations**:
1. `20251126030000_optimize_db.sql` - Performance optimization
2. `20251126040000_fix_signup_error.sql` - Signup flow fixes
3. `20251126050000_add_onboarding_fields.sql` - Onboarding fields
4. `20251126020000_fix_missing_profiles.sql` - Profile creation fixes
5. `20251126005700_category_override.sql` - Category override support

**Applying migrations**:

```bash
# Via Supabase CLI
supabase db push

# Via Supabase Dashboard
# Copy SQL file contents and run in SQL Editor
```

---

## AI System Architecture

### Overview

Sasha uses a **modular 10-system architecture** for AI processing:

1. **LTM (Long-term Memory)** - Never re-asks for saved information
2. **STM (Short-term Memory)** - Session-based context tracking
3. **Episodic Memory** - Event recall ("Last week you spent...")
4. **Personality System** - Emotion-adaptive responses
5. **Pattern Recognition** - Spending pattern detection
6. **Transaction Brain** - Perfect transaction processing with undo
7. **Spam Controller** - Escalating responses to repeated messages
8. **Memory Extractor** - Auto-extract information from conversations
9. **Memory Injector** - Inject context into AI prompts
10. **Intent Classifier** - Determine user intent

### Edge Functions

**processChat** (`supabase/functions/processChat/`):
- Main AI chat handler (828+ lines)
- Intent classification
- Entity extraction (amount, category, merchant)
- Transaction CRUD operations
- Memory retrieval and context injection
- Emotion detection
- Confidence scoring
- Smart categorization with fallback

**processChatDeep** (`supabase/functions/processChatDeep/`):
- Triggered by database webhook on new assistant messages
- Emotional analysis and saving
- Deep LTM extraction
- STM tracking
- Episodic event logging
- Pattern detection
- Spam control
- Personality injection

**processReceipt** (`supabase/functions/processReceipt/`):
- OCR receipt processing
- Image to text extraction
- Transaction parsing
- Auto-categorization

**analyzePatterns** (`supabase/functions/analyzePatterns/`):
- Cron job (nightly execution)
- Recurring payment detection
- Weekend spending spikes
- Payday splurges
- Category addiction detection

**generateWeeklySummary** (`supabase/functions/generateWeeklySummary/`):
- Weekly financial report generation
- AI-powered insights
- Spending analysis

### AI Processing Flow

```
User Message
    ↓
processChat (Main Handler)
    ↓
┌─────────────────────────────┐
│ 1. Spam Check               │
│ 2. Load STM Context         │
│ 3. Load LTM Facts           │
│ 4. Load Recent Episodes     │
│ 5. Intent Classification    │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 6. Entity Extraction        │
│    - Amount                 │
│    - Category               │
│    - Merchant               │
│    - Date                   │
│    - Type (income/expense)  │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 7. Transaction Processing   │
│    - Create/Edit/Delete     │
│    - Validation             │
│    - Confirmation           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 8. Pattern Detection        │
│    - Check for patterns     │
│    - Generate nudges        │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 9. Personality Injection    │
│    - Adapt to emotion       │
│    - Apply sarcasm pref     │
│    - Maintain tone          │
└─────────────────────────────┘
    ↓
Assistant Response
    ↓
processChatDeep (Webhook)
    ↓
┌─────────────────────────────┐
│ 10. Memory Extraction       │
│     - LTM facts             │
│     - Episodic events       │
│     - Emotional state       │
└─────────────────────────────┘
    ↓
Database Update
```

### Memory System

**Three-tier memory architecture**:

1. **LTM (Long-term Memory)**:
   - Stored in `user_profiles_extended` and `memory_events`
   - Never expires
   - Examples: salary, name, goals, preferences
   - Purpose: Never re-ask for important information

2. **STM (Short-term Memory)**:
   - Stored in `conversation_context`
   - Expires after TTL (default: 1 hour)
   - Examples: current topic, recent decisions
   - Purpose: Maintain conversation flow within session

3. **Episodic Memory**:
   - Stored in `episodic_events`
   - Never expires, but ranked by importance
   - Examples: large purchases, life events, achievements
   - Purpose: Enable "Do you remember..." queries

### Intent Classification

Supported intents:
- `create_transaction` - Add new transaction
- `edit_transaction` - Modify existing transaction
- `delete_transaction` - Remove transaction
- `query_transactions` - Search/filter transactions
- `undo` - Undo last action
- `query_budget` - Budget information
- `query_goal` - Goal information
- `general_chat` - Conversational
- `help` - User needs assistance

### Entity Extraction

Entities extracted from user messages:
- **Amount**: Numeric values (50, 500tk, $50)
- **Category**: Transaction category (food, transport, salary)
- **Merchant**: Store/vendor name (Starbucks, Walmart)
- **Date**: Transaction date (today, yesterday, last week)
- **Type**: Income vs expense (earned, spent, paid)

### Confidence Scoring

All AI operations include confidence scores:
- **0.0 - 0.4**: Low confidence (ask for confirmation)
- **0.5 - 0.7**: Medium confidence (suggest confirmation)
- **0.8 - 1.0**: High confidence (auto-confirm)

---

## Common Tasks & Workflows

### Task 1: Adding a New Page

1. Create page component in `src/pages/`:
   ```typescript
   // src/pages/NewFeature.tsx
   import { Layout } from '../components/Layout';

   export default function NewFeature() {
     return (
       <div>
         {/* Your page content */}
       </div>
     );
   }
   ```

2. Add route in `App.tsx`:
   ```typescript
   import NewFeature from './pages/NewFeature';

   <Route path="/new-feature" element={
     <ProtectedRoute>
       <NewFeature />
     </ProtectedRoute>
   } />
   ```

3. Add navigation link in `Layout.tsx` if needed

### Task 2: Adding a Database Table

1. Create migration file:
   ```bash
   # Name: supabase/migrations/YYYYMMDDHHMMSS_description.sql
   ```

2. Write SQL schema:
   ```sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     -- Your fields
   );

   -- Enable RLS
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

   -- Create policy
   CREATE POLICY "Users can access their own data"
     ON new_table FOR ALL
     USING (auth.uid() = user_id);

   -- Create indexes
   CREATE INDEX idx_new_table_user_id ON new_table(user_id);
   ```

3. Apply migration:
   ```bash
   supabase db push
   ```

4. Create database module in `src/lib/db/newTable.ts`:
   ```typescript
   import { supabase } from '../supabase';

   export async function getNewTableData(userId: string) {
     const { data, error } = await supabase
       .from('new_table')
       .select('*')
       .eq('user_id', userId);

     if (error) throw error;
     return data;
   }
   ```

### Task 3: Modifying Edge Function

1. Edit function in `supabase/functions/functionName/index.ts`

2. Test locally (if CLI installed):
   ```bash
   supabase functions serve processChat
   ```

3. Deploy to Supabase:
   ```bash
   supabase functions deploy processChat
   ```

4. Verify in Supabase Dashboard:
   - Check function logs
   - Test with sample payload

### Task 4: Adding a New AI Intent

1. Update intent classification in `processChat/index.ts`:
   ```typescript
   const intents = [
     // ... existing intents
     {
       name: 'new_intent',
       description: 'When user wants to do X',
       examples: ['example 1', 'example 2']
     }
   ];
   ```

2. Add handler logic:
   ```typescript
   if (intent === 'new_intent') {
     // Handle the intent
   }
   ```

3. Update memory extraction in `processChatDeep` if needed

### Task 5: Adding a Premium Feature

1. Update subscription module (`src/lib/db/subscription.ts`):
   ```typescript
   export const FEATURES = {
     // ... existing features
     NEW_FEATURE: 'new_feature'
   };

   export const TIER_LIMITS = {
     free: {
       // ... existing limits
       new_feature_limit: 5
     },
     // ... other tiers
   };
   ```

2. Add feature gate in component:
   ```typescript
   import { useFeatureAccess } from '../hooks/useFeatureAccess';

   const { hasAccess, showPaywall } = useFeatureAccess('new_feature');

   if (!hasAccess) {
     return <Paywall feature="New Feature" />;
   }
   ```

3. Update Subscription page with new feature listing

### Task 6: Fixing Type Errors

1. Run TypeScript compiler:
   ```bash
   npm run build
   ```

2. Fix errors one by one:
   - Add missing type definitions
   - Fix incorrect types
   - Add proper imports

3. Verify build passes:
   ```bash
   npm run build
   # Should complete with no errors
   ```

### Task 7: Adding a Real-time Feature

1. Set up Supabase subscription:
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel('table-changes')
       .on('postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'your_table',
           filter: `user_id=eq.${userId}`
         },
         (payload) => {
           // Handle change
         }
       )
       .subscribe();

     return () => {
       channel.unsubscribe();
     };
   }, [userId]);
   ```

2. Update state on changes

### Task 8: Optimizing Database Queries

1. Add indexes in migration:
   ```sql
   CREATE INDEX idx_table_field ON table_name(field_name);
   CREATE INDEX idx_table_composite ON table_name(field1, field2);
   ```

2. Use `.select()` to limit columns:
   ```typescript
   // ✅ Good: Select only needed columns
   .select('id, name, created_at')

   // ❌ Bad: Select everything
   .select('*')
   ```

3. Use `.limit()` for large datasets:
   ```typescript
   .select('*').limit(100)
   ```

4. Implement pagination for lists

---

## Deployment Process

### Frontend Deployment (Vercel)

**Staging Deployment**:

```bash
# Option 1: PowerShell (Windows)
npm run deploy:staging

# Option 2: Bash (Linux/Mac)
bash scripts/deploy-staging.sh
```

**Production Deployment**:

```bash
npm run deploy:production
# OR
bash scripts/deploy-production.sh
```

**Vercel Configuration**:
- Config file: `vercel.json` (SPA routing configuration)
- Environment variables: Set in Vercel dashboard
- Auto-deploy: Can be configured via Git integration

**Required Environment Variables** (Vercel Dashboard):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BASE_CURRENCY=BDT
```

### Backend Deployment (Supabase)

**Database Migrations**:

```bash
# Apply all pending migrations
supabase db push

# Reset database (DESTRUCTIVE - dev only)
supabase db reset
```

**Edge Functions**:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy processChat
supabase functions deploy processChatDeep
supabase functions deploy processReceipt
```

**Edge Function Environment Variables** (Supabase Dashboard):
```
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Critical Deployment Notes

1. **Frontend vs Backend**:
   - Vercel hosts the frontend (React app)
   - Supabase hosts the backend (database + Edge Functions)
   - **They are separate deployments!**

2. **Always deploy in this order**:
   - Database migrations first
   - Edge Functions second
   - Frontend last

3. **Test before production**:
   - Deploy to staging first
   - Test all features
   - Check Sentry for errors
   - Then deploy to production

4. **Database migrations are irreversible**:
   - Test migrations in staging
   - Backup production database before migrating
   - Have rollback plan ready

### Deployment Checklist

Before deploying:
- [ ] Run `npm run build` locally (no errors)
- [ ] Run `npm run lint` (no errors)
- [ ] Test all affected features locally
- [ ] Review changes with `git diff`
- [ ] Update environment variables if needed
- [ ] Notify users of planned downtime (if any)

After deploying:
- [ ] Check Vercel deployment status
- [ ] Check Supabase function logs
- [ ] Test critical user flows
- [ ] Monitor Sentry for new errors
- [ ] Verify database migrations applied correctly

---

## Testing & Quality Assurance

### Current Testing Status

⚠️ **Tests are not yet implemented** in this project.

```json
// package.json
"test": "echo \"Tests not yet implemented\" && exit 0"
```

### Testing Infrastructure Needed

To implement comprehensive testing:

1. **Unit Testing**:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Component Testing**:
   ```bash
   npm install -D @testing-library/user-event
   ```

3. **E2E Testing**:
   ```bash
   npm install -D playwright
   # OR
   npm install -D cypress
   ```

4. **API Testing**:
   - Test Edge Functions with Deno test
   - Test database functions with SQL test framework

### Manual Testing Requirements

Until automated tests are implemented, follow these manual testing procedures:

**Critical User Flows**:
1. User registration and login
2. Transaction creation via chat
3. Transaction editing and deletion
4. Budget tracking
5. Goal management
6. Receipt upload and processing
7. Real-time updates
8. Memory system (LTM, STM, episodic)
9. Pattern detection
10. Undo functionality

**Test Data**:
- Use test user accounts (not production)
- Create diverse transaction scenarios
- Test edge cases (negative amounts, invalid dates, etc.)

### Quality Assurance Tools

**Currently Active**:
1. **TypeScript** - Type safety (compile-time checks)
2. **ESLint** - Code quality and consistency
3. **Sentry** - Runtime error monitoring
4. **Vercel Analytics** - Usage tracking

**Build Verification**:
```bash
npm run build
# Must complete with zero errors before deploying
```

### Error Monitoring

**Sentry Configuration** (`src/main.tsx`):
```typescript
Sentry.init({
  dsn: 'your_sentry_dsn',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0  // 100% of errors
});
```

**Check Sentry after deployment**:
- Monitor error rates
- Review stack traces
- Check performance metrics
- Review user replays for errors

---

## Important Files & Patterns

### Critical Configuration Files

**TypeScript**:
- `tsconfig.json` - Root TypeScript configuration
- `tsconfig.app.json` - App-specific settings
- `tsconfig.node.json` - Node environment settings

**Vite**:
- `vite.config.ts` - Build configuration, plugins, aliases

**Tailwind**:
- `tailwind.config.js` - Theme, plugins, content paths
- `postcss.config.js` - PostCSS plugins

**ESLint**:
- `eslint.config.js` - Linting rules

**Vercel**:
- `vercel.json` - SPA routing configuration

**Docker**:
- `Dockerfile` - Production container
- `Dockerfile.dev` - Development container
- `docker-compose.yml` - Multi-container orchestration
- `nginx.conf` - Reverse proxy configuration

### Core Application Files

**Entry Point**:
- `src/main.tsx` - Application entry point, Sentry initialization

**Routing**:
- `src/App.tsx` - Main app component, route definitions

**Database Client**:
- `src/lib/supabase.ts` - Centralized Supabase client

**Authentication**:
- `src/store/authStore.ts` - Auth state management
- `src/components/ProtectedRoute.tsx` - Route guard

**AI Interface**:
- `src/lib/ai.ts` - Edge Function interface
- `supabase/functions/processChat/index.ts` - Main AI handler
- `supabase/functions/processChatDeep/index.ts` - Deep memory system

**Database Layer**:
- `src/lib/db/sasha.ts` - AI features (960+ lines, most critical)
- `src/lib/db/transactions.ts` - Transaction CRUD
- `src/lib/db/profiles.ts` - User profiles
- `src/lib/db/messages.ts` - Chat persistence

### Common Code Patterns

**1. Database Query Pattern**:
```typescript
import { supabase } from '../lib/supabase';

export async function getResource(userId: string) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch resource:', error);
    throw error;
  }

  return data;
}
```

**2. Protected Route Pattern**:
```typescript
<Route path="/feature" element={
  <ProtectedRoute>
    <FeaturePage />
  </ProtectedRoute>
} />
```

**3. Real-time Subscription Pattern**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('changes')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  return () => channel.unsubscribe();
}, [dependencies]);
```

**4. Auth Check Pattern**:
```typescript
const { user } = useAuthStore();

if (!user) {
  return <Navigate to="/login" replace />;
}
```

**5. Error Boundary Pattern**:
```typescript
import * as Sentry from '@sentry/react';

try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  Sentry.captureException(error);
  // Fallback
}
```

**6. Validation Pattern**:
```typescript
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1)
});

const result = schema.safeParse(input);
if (!result.success) {
  // Handle validation errors
}
```

**7. AI Processing Pattern**:
```typescript
const response = await supabase.functions.invoke('processChat', {
  body: {
    userId,
    sessionId,
    message,
    profile
  }
});
```

---

## Troubleshooting

### Common Issues

**Issue 1: "Port 5173 is already in use"**

Solution: Vite will automatically try next available port, or manually kill the process:
```bash
# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Issue 2: Environment variables not loading**

Solutions:
1. Ensure `.env.local` exists in root directory
2. Restart dev server after changes
3. Check variables are prefixed with `VITE_` for frontend
4. Verify no typos in variable names

**Issue 3: Supabase connection errors**

Solutions:
1. Verify Supabase URL and anon key
2. Check Supabase project is active
3. Verify RLS policies are correct
4. Check network connectivity
5. Review Supabase dashboard for API limits

**Issue 4: Edge Function not updating**

Solutions:
1. Verify you deployed to Supabase (not just Vercel)
2. Check function logs in Supabase dashboard
3. Redeploy function: `supabase functions deploy processChat`
4. Clear browser cache
5. Verify environment variables are set

**Issue 5: TypeScript errors during build**

Solutions:
1. Run `npm run build` to see all errors
2. Check for missing type definitions
3. Verify imports are correct
4. Check `tsconfig.json` paths
5. Run `npm install` to ensure dependencies are updated

**Issue 6: Real-time subscriptions not working**

Solutions:
1. Verify Supabase real-time is enabled for table
2. Check RLS policies allow subscriptions
3. Verify channel subscription code is correct
4. Check browser console for errors
5. Verify user is authenticated

**Issue 7: AI responses are incorrect/outdated**

Solutions:
1. Check OpenAI API key is valid
2. Verify Edge Function was deployed to Supabase
3. Check function logs for errors
4. Verify database has latest schema
5. Clear user's LTM/STM if testing

**Issue 8: Database migration failed**

Solutions:
1. Check SQL syntax in migration file
2. Verify table/column names don't conflict
3. Check for foreign key constraint issues
4. Review Supabase logs for specific error
5. Rollback if needed: `supabase db reset` (dev only)

### Debug Tools

**Frontend Debugging**:
```typescript
// Enable verbose logging
console.log('Debug:', variable);

// Sentry breadcrumbs
Sentry.addBreadcrumb({
  message: 'Debug checkpoint',
  data: { key: value }
});

// React DevTools - Inspect component state
```

**Backend Debugging**:
```bash
# View Edge Function logs
supabase functions logs processChat

# View database logs
# Check Supabase Dashboard → Logs

# Test Edge Function locally
supabase functions serve processChat
```

**Network Debugging**:
- Browser DevTools → Network tab
- Check request/response payloads
- Verify correct endpoints
- Check for CORS errors

---

## Security Considerations

### Authentication & Authorization

**Authentication Flow**:
1. User signs up/logs in via Supabase Auth
2. JWT token stored in localStorage
3. Token sent with all API requests
4. Row Level Security enforces access control

**Authorization Rules**:
- Users can only access their own data
- Service role (Edge Functions) has full access
- Anonymous users denied access to all tables

### Row Level Security (RLS)

**All tables must have RLS enabled**:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

**Never bypass RLS from frontend**:
- Always use anon key in frontend
- Never expose service role key
- Use Edge Functions for admin operations

### Environment Variables

**Sensitive Data**:
- Never commit `.env`, `.env.local`, or `.env.staging` to Git
- Use `.env.example` as template only
- Rotate keys if accidentally exposed
- Use different keys for each environment

**Frontend vs Backend**:
- Frontend: `VITE_` prefix, exposed to client
- Backend: No prefix, kept secret in Edge Functions
- OpenAI key: **ONLY** in Edge Functions, never frontend

### Input Validation

**Always validate user input**:
```typescript
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive(),
  category: z.enum([...]),
  merchant: z.string().max(100)
});

// Validate before processing
const validated = schema.parse(userInput);
```

**SQL Injection Prevention**:
- Supabase client handles parameterization
- Never build raw SQL queries from user input
- Use `.eq()`, `.in()`, etc. instead of string concatenation

**XSS Prevention**:
- React escapes JSX by default
- Use `react-markdown` for safe markdown rendering
- Never use `dangerouslySetInnerHTML` without sanitization

### API Security

**Rate Limiting**:
- Supabase has built-in rate limiting
- Monitor for abuse in Supabase dashboard
- Consider implementing additional rate limiting for Edge Functions

**CORS**:
- Configured in Supabase Edge Functions
- Only allow trusted origins in production

### Data Privacy

**Sensitive Data**:
- Financial transactions
- Personal information
- Chat history

**Best Practices**:
1. Encrypt sensitive data at rest (handled by Supabase)
2. Use HTTPS for all communications (enforced)
3. Implement data retention policies
4. Allow users to export/delete their data
5. Comply with GDPR/privacy regulations

### Error Handling

**Never expose sensitive info in errors**:
```typescript
// ❌ BAD
throw new Error(`API key ${apiKey} is invalid`);

// ✅ GOOD
throw new Error('Authentication failed');
```

**Use Sentry for error tracking**:
- Errors captured with context
- Sensitive data filtered out
- Stack traces for debugging

### Dependency Security

**Regular Updates**:
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

**Lock Files**:
- Commit `package-lock.json` to ensure consistent builds
- Review dependency changes in pull requests

---

## Additional Resources

### Documentation

**Internal Documentation** (in repo):
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `LOCAL_DEV_SETUP.md` - Local development setup
- `SUPABASE_DEPLOYMENT.md` - Backend deployment notes
- `VERCEL_DEPLOYMENT.md` - Frontend deployment
- `PERFORMANCE_OPTIMIZATION.md` - Performance tips
- 13+ other specialized guides

**External Documentation**:
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Sentry Docs](https://docs.sentry.io/)

### Project Statistics

- **Total Lines of Code**: ~6,749 (src directory)
- **Components**: 17
- **Pages**: 14
- **Database Tables**: 21+
- **Edge Functions**: 6
- **Database Modules**: 8
- **Migrations**: 8

### Architecture Principles

1. **Separation of Concerns**: Frontend, backend, and AI logic are clearly separated
2. **Type Safety**: TypeScript everywhere for compile-time error detection
3. **Security First**: RLS on all tables, input validation, secure auth
4. **Real-time by Default**: Supabase real-time for live updates
5. **AI-Powered**: Natural language processing for financial tasks
6. **User-Centric**: Adaptive personality, memory system, conversational UI
7. **Performance**: Optimized queries, lazy loading, code splitting
8. **Observability**: Sentry monitoring, structured logging, analytics

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run linter

# Deployment
npm run deploy:staging         # Deploy to staging
npm run deploy:production      # Deploy to production

# Supabase
supabase db push              # Apply migrations
supabase functions deploy     # Deploy all functions
supabase functions logs       # View function logs

# Git
git status                     # Check status
git add .                      # Stage changes
git commit -m "message"        # Commit
git push origin branch-name    # Push to remote
```

### File Locations

- Components: `src/components/`
- Pages: `src/pages/`
- Database: `src/lib/db/`
- Edge Functions: `supabase/functions/`
- Migrations: `supabase/migrations/`
- Types: `src/types/`
- Styles: `src/index.css` (Tailwind)

### Key URLs

- **Local Dev**: http://localhost:5173
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com
- **Sentry Dashboard**: https://sentry.io

---

## Contributing Guidelines for AI Assistants

When working on this codebase as an AI assistant:

1. **Always read before modifying**: Never propose changes to code you haven't read
2. **Follow existing patterns**: Maintain consistency with current code style
3. **Use the database layer**: Never bypass `/lib/db/` modules
4. **Test locally first**: Build and test before suggesting deployment
5. **Validate all input**: Use Zod schemas for user input
6. **Consider security**: Validate auth, check RLS, sanitize data
7. **Update types**: Keep TypeScript definitions current
8. **Document changes**: Add comments for complex logic
9. **Check dependencies**: Don't introduce unnecessary packages
10. **Monitor errors**: Check Sentry after changes
11. **Respect user data**: Follow privacy best practices
12. **Be concise**: Keep solutions simple, avoid over-engineering

**Remember**: This is a production application handling user financial data. Prioritize security, data integrity, and user privacy in all changes.

---

**Last Updated**: 2025-11-26
**Maintainer**: Development Team
**For Questions**: Refer to internal documentation or create an issue

---

**End of CLAUDE.md**
