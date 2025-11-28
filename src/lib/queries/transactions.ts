import { createClient } from '@/lib/supabase/client'

export async function softDeleteTransaction(transactionId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transactionId)

    if (error) throw error
}

export async function undoDeleteTransaction(transactionId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', transactionId)

    if (error) throw error
}
