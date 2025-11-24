import { supabase } from '../supabase';

import type { Database } from '../database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export async function createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateTransaction(id: string, updates: TransactionUpdate) {
    const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function softDeleteTransaction(id: string) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserTransactions(userId: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export function subscribeToTransactions(userId: string, callback: (payload: any) => void): RealtimeChannel {
    return supabase
        .channel('transactions-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => callback(payload)
        )
        .subscribe();
}

export async function getLastTransaction(userId: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
    }
    return data;
}

export async function getRecentTransactions(userId: string, days: number = 3) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
