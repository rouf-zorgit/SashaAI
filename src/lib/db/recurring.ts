import { supabase } from '../supabase';
import type { RecurringRule } from '../../types/supabase';
import type { Database } from '../database.types';

type RecurringRuleUpdate = Database['public']['Tables']['recurring_rules']['Update'];

export async function detectRecurringRules(userId: string) {
    const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data;
}

export async function updateRecurringRule(ruleId: string, updates: RecurringRuleUpdate) {
    const { data, error } = await supabase
        .from('recurring_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Simple client-side matching logic (can be moved to edge function later)
export function matchRecurringPattern(transactionDescription: string, rules: RecurringRule[]): RecurringRule | undefined {
    const desc = transactionDescription.toLowerCase();
    return rules.find(rule => desc.includes(rule.keyword.toLowerCase()));
}
