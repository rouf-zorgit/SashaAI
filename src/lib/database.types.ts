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
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    monthly_salary?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    monthly_salary?: number | null
                    created_at?: string
                    updated_at?: string
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
        }
    }
}
