import type { Database } from '../lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type RecurringRule = Database['public']['Tables']['recurring_rules']['Row'];
export type SubscriptionStatus = Database['public']['Tables']['subscription_status']['Row'];

export type TransactionType = Database['public']['Enums']['transaction_type'];
export type RecurringCycle = Database['public']['Enums']['recurring_cycle'];
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];
