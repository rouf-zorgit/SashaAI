-- ==========================================
-- PATTERN RECOGNITION & RECURRING PAYMENTS
-- ==========================================

-- 1. Spending Patterns Table (If not exists)
create table if not exists spending_patterns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  pattern_type text check (pattern_type in ('weekend_spike', 'payday_splurge', 'stress_shopping', 'recurring_bill', 'impulse_category')),
  trigger_day text, -- 'Friday', 'Payday', etc.
  trigger_category text,
  avg_amount numeric(12,2),
  frequency text,
  confidence numeric(3,2),
  first_detected timestamptz default now(),
  last_occurred timestamptz,
  occurrence_count integer default 1,
  created_at timestamptz default now()
);

alter table spending_patterns enable row level security;

drop policy if exists "Users can view own patterns" on spending_patterns;
create policy "Users can view own patterns"
  on spending_patterns for select
  using (auth.uid() = user_id);

create index if not exists idx_patterns_user on spending_patterns(user_id);
create index if not exists idx_patterns_type on spending_patterns(pattern_type);

-- 2. Recurring Payments Table
-- Tracks specific recurring bills (e.g., Netflix, Rent, Internet)
create table if not exists recurring_payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  merchant_name text not null,
  amount numeric(12,2) not null,
  frequency text check (frequency in ('weekly', 'bi-weekly', 'monthly', 'yearly', 'irregular')),
  next_due_date date,
  last_paid_date date,
  confidence numeric(3,2) default 0.0, -- 0.0 to 1.0
  is_active boolean default true,
  detected_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table recurring_payments enable row level security;

drop policy if exists "Users can view own recurring payments" on recurring_payments;
create policy "Users can view own recurring payments"
  on recurring_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own recurring payments" on recurring_payments;
create policy "Users can update own recurring payments"
  on recurring_payments for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own recurring payments" on recurring_payments;
create policy "Users can insert own recurring payments"
  on recurring_payments for insert
  with check (auth.uid() = user_id);

create index if not exists idx_recurring_user on recurring_payments(user_id);
create index if not exists idx_recurring_due_date on recurring_payments(next_due_date);

-- 3. Update User Spending Patterns
-- Ensure the existing table has all necessary columns for advanced detection
alter table spending_patterns add column if not exists last_detected_at timestamptz default now();
alter table spending_patterns add column if not exists detection_metadata jsonb; -- Store details like "weekend_avg: 5000, weekday_avg: 2000"

-- 4. Function to update updated_at
create or replace function update_recurring_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_recurring_payments_updated_at on recurring_payments;
create trigger update_recurring_payments_updated_at
  before update on recurring_payments
  for each row
  execute function update_recurring_updated_at();
