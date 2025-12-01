export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    monthly_salary: number | null
                    currency: string | null
                    country: string | null
                    fixed_costs: number | null
                    primary_goal: string | null
                    communication_style: string | null
                    onboarding_completed: boolean | null
                    savings_amount: number | null
                    total_loans: number | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    monthly_salary?: number | null
                    currency?: string | null
                    country?: string | null
                    fixed_costs?: number | null
                    primary_goal?: string | null
                    communication_style?: string | null
                    onboarding_completed?: boolean | null
                    savings_amount?: number | null
                    total_loans?: number | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    monthly_salary?: number | null
                    currency?: string | null
                    country?: string | null
                    fixed_costs?: number | null
                    primary_goal?: string | null
                    communication_style?: string | null
                    onboarding_completed?: boolean | null
                    savings_amount?: number | null
                    total_loans?: number | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            wallets: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    type: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'other'
                    balance: number
                    currency: string
                    is_default: boolean
                    is_locked: boolean
                    monthly_limit: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    type: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'other'
                    balance?: number
                    currency?: string
                    is_default?: boolean
                    is_locked?: boolean
                    monthly_limit?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    type?: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'other'
                    balance?: number
                    currency?: string
                    is_default?: boolean
                    is_locked?: boolean
                    monthly_limit?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            wallet_adjustments: {
                Row: {
                    id: string
                    user_id: string
                    wallet_id: string
                    old_balance: number
                    new_balance: number
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    wallet_id: string
                    old_balance: number
                    new_balance: number
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    wallet_id?: string
                    old_balance?: number
                    new_balance?: number
                    reason?: string | null
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    currency: string
                    base_amount: number
                    category: string
                    merchant_name: string | null
                    type: 'income' | 'expense' | 'adjustment'
                    description: string | null
                    confidence: number
                    is_confirmed: boolean
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    currency?: string
                    base_amount: number
                    category: string
                    merchant_name?: string | null
                    type: 'income' | 'expense' | 'adjustment'
                    description?: string | null
                    confidence?: number
                    is_confirmed?: boolean
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    currency?: string
                    base_amount?: number
                    category?: string
                    merchant_name?: string | null
                    type?: 'income' | 'expense' | 'adjustment'
                    description?: string | null
                    confidence?: number
                    is_confirmed?: boolean
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
            }
            messages: {
                Row: {
                    id: string
                    user_id: string
                    session_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    intent: string | null
                    confidence: number | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    session_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    intent?: string | null
                    confidence?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    session_id?: string
                    role?: 'user' | 'assistant' | 'system'
                    content?: string
                    intent?: string | null
                    confidence?: number | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
            goals: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    target_amount: number
                    current_amount: number
                    deadline: string | null
                    category: string
                    is_completed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    target_amount: number
                    current_amount?: number
                    deadline?: string | null
                    category?: string
                    is_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    target_amount?: number
                    current_amount?: number
                    deadline?: string | null
                    category?: string
                    is_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'reminder' | 'alert' | 'milestone' | 'transaction'
                    title: string
                    message: string | null
                    related_id: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'reminder' | 'alert' | 'milestone' | 'transaction'
                    title: string
                    message?: string | null
                    related_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'reminder' | 'alert' | 'milestone' | 'transaction'
                    title?: string
                    message?: string | null
                    related_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            reminders: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    amount: number | null
                    due_date: string
                    is_recurring: boolean
                    is_paid: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    amount?: number | null
                    due_date: string
                    is_recurring?: boolean
                    is_paid?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    amount?: number | null
                    due_date?: string
                    is_recurring?: boolean
                    is_paid?: boolean
                    created_at?: string
                }
            }
            recurring_rules: {
                Row: {
                    id: string
                    user_id: string
                    keyword: string
                    amount: number | null
                    cycle: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    last_triggered: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    keyword: string
                    amount?: number | null
                    cycle: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    last_triggered?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    keyword?: string
                    amount?: number | null
                    cycle?: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    last_triggered?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            subscription_status: {
                Row: {
                    user_id: string
                    is_active: boolean
                    plan: 'free' | 'six_month' | 'three_month' | 'monthly'
                    expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    is_active?: boolean
                    plan?: 'free' | 'six_month' | 'three_month' | 'monthly'
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    is_active?: boolean
                    plan?: 'free' | 'six_month' | 'three_month' | 'monthly'
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            transaction_type: 'income' | 'expense' | 'adjustment'
            recurring_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly'
            subscription_plan: 'free' | 'six_month' | 'three_month' | 'monthly'
            notification_type: 'reminder' | 'alert' | 'milestone' | 'transaction'
            message_role: 'user' | 'assistant' | 'system'
        }
    }
}
