import { supabase } from '../supabase';

export interface ReceiptInsert {
    user_id: string;
    storage_path: string;
    merchant?: string;
    amount?: number;
    currency?: string;
    date?: string;
    items?: string[]; // JSONB
    status?: 'pending' | 'processed' | 'confirmed' | 'rejected';
    transaction_id?: string;
}

export interface ReceiptUpdate {
    merchant?: string;
    amount?: number;
    currency?: string;
    date?: string;
    items?: string[];
    status?: 'pending' | 'processed' | 'confirmed' | 'rejected';
    transaction_id?: string;
}

export async function createReceipt(receipt: ReceiptInsert) {
    const { data, error } = await supabase
        .from('receipts')
        .insert(receipt)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateReceipt(id: string, updates: ReceiptUpdate) {
    const { data, error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserReceipts(userId: string) {
    const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
