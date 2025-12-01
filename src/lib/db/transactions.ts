import { SupabaseClient } from '@supabase/supabase-js'

export interface Transaction {
    id: string
    user_id: string
    message_id?: string | null
    amount: number
    category: string
    description?: string | null
    date: string
    type: 'income' | 'expense'
    extracted_from_chat: boolean
    confirmed: boolean
    created_at: string
}

export interface TransactionInput {
    amount: number
    category: string
    description?: string
    date?: string
    type: 'income' | 'expense'
    message_id?: string
    receipt_url?: string | null
    merchant_name?: string
}

export async function saveTransaction(
    supabase: SupabaseClient,
    userId: string,
    transaction: TransactionInput
): Promise<Transaction | null> {
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date || new Date().toISOString().split('T')[0],
            type: transaction.type,
            message_id: transaction.message_id,
            extracted_from_chat: true,
            confirmed: false,
            receipt_url: transaction.receipt_url,
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving transaction:', error)
        throw error
    }

    return data
}

export async function getTransactions(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 100
): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching transactions:', error)
        return []
    }

    return data || []
}

export async function getReceipts(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 50
): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .not('receipt_url', 'is', null)
        .order('date', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching receipts:', error)
        return []
    }

    return data || []
}

export async function confirmTransaction(
    supabase: SupabaseClient,
    transactionId: string
): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .update({ confirmed: true })
        .eq('id', transactionId)

    if (error) {
        console.error('Error confirming transaction:', error)
        throw error
    }
}
