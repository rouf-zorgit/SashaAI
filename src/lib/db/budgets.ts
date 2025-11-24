import { supabase } from '../supabase';

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date?: string;
    alert_threshold: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SavingsGoal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    deadline?: string;
    category?: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface BillReminder {
    id: string;
    user_id: string;
    title: string;
    amount?: number;
    currency: string;
    due_date: string;
    recurring: boolean;
    frequency?: 'monthly' | 'quarterly' | 'yearly';
    is_paid: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// Budgets
export async function getUserBudgets(userId: string) {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Budget[];
}

export async function createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();

    if (error) throw error;
    return data as Budget;
}

export async function updateBudget(id: string, updates: Partial<Budget>) {
    const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Budget;
}

export async function deleteBudget(id: string) {
    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Savings Goals
export async function getUserGoals(userId: string) {
    const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavingsGoal[];
}

export async function createGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('savings_goals')
        .insert(goal)
        .select()
        .single();

    if (error) throw error;
    return data as SavingsGoal;
}

export async function updateGoal(id: string, updates: Partial<SavingsGoal>) {
    const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as SavingsGoal;
}

export async function deleteGoal(id: string) {
    const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Bill Reminders
export async function getUserReminders(userId: string) {
    const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

    if (error) throw error;
    return data as BillReminder[];
}

export async function createReminder(reminder: Omit<BillReminder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('bill_reminders')
        .insert(reminder)
        .select()
        .single();

    if (error) throw error;
    return data as BillReminder;
}

export async function updateReminder(id: string, updates: Partial<BillReminder>) {
    const { data, error } = await supabase
        .from('bill_reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as BillReminder;
}

export async function deleteReminder(id: string) {
    const { error } = await supabase
        .from('bill_reminders')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function markReminderPaid(id: string) {
    const { data, error } = await supabase
        .from('bill_reminders')
        .update({ is_paid: true })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as BillReminder;
}
