# Supabase Backend - README

## Directory Structure

```
supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrations (archived)
├── utilities/          # Diagnostic and utility SQL scripts
├── schema.sql          # Main database schema
├── sasha_schema.sql    # Sasha AI tables
├── ltm_schema.sql      # Long-term memory tables
├── episodic_schema.sql # Episodic memory system
├── pattern_schema.sql  # Pattern recognition tables
├── seed_patterns.sql   # Seed data for testing
└── cron_jobs.sql       # Scheduled jobs configuration
```

## Core Schema Files

### schema.sql
Main database schema containing:
- `profiles` - User profiles
- `transactions` - Financial transactions
- `messages` - Chat messages
- `recurring_rules` - Recurring transaction rules

### sasha_schema.sql
Sasha AI-specific tables:
- `user_emotional_state` - Emotion tracking
- `memory_events` - Memory storage
- `user_preferences` - User preferences

### ltm_schema.sql
Long-term memory system:
- `conversation_context` - Session context
- `memory_events` - Long-term memories

### episodic_schema.sql
Episodic memory tracking:
- `episodic_events` - Event logging

### pattern_schema.sql
Pattern recognition:
- `spending_patterns` - Detected spending patterns
- `recurring_payments` - Recurring bill tracking

## Setup Instructions

### 1. Run Schema Files (in order)
```sql
-- Run in Supabase SQL Editor
\i schema.sql
\i sasha_schema.sql
\i ltm_schema.sql
\i episodic_schema.sql
\i pattern_schema.sql
```

### 2. Run Migrations
```sql
\i migrations/add_merchant_column.sql
```

### 3. Seed Test Data (optional)
```sql
\i seed_patterns.sql
```

### 4. Setup Cron Jobs
```sql
\i cron_jobs.sql
```

## Edge Functions

See `functions/README.md` for details on each function.

## Utilities

Diagnostic scripts in `utilities/` folder:
- `diagnostic_check.sql` - Check 8 core systems status
- `quick_diagnostic.sql` - Quick health check

## Maintenance

- Schema changes should be added as new migration files
- Test data should be added to `seed_patterns.sql`
- Temporary debug files should not be committed
