import { createClient } from '@/lib/supabase/client'

export async function softDeleteTransaction(transactionId: string) {
    console.log('🗑️ Starting delete for:', transactionId);

    try {
        const supabase = createClient()

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('👤 Auth check:', { userId: user?.id, authError });

        if (authError || !user) {
            throw new Error('Not authenticated');
        }

        // Attempt update
        console.log('📝 Attempting update...');
        const result = await supabase
            .from('transactions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', transactionId)
            .select()

        console.log('📊 Update result:', result);

        if (result.error) {
            console.error('❌ Supabase error:', result.error);
            throw result.error;
        }

        if (!result.data || result.data.length === 0) {
            throw new Error('No rows updated - transaction not found or permission denied');
        }

        console.log('✅ Successfully deleted');
        return result.data;

    } catch (error) {
        console.error('💥 Exception caught:', error);
        throw error;
    }
}

export async function undoDeleteTransaction(transactionId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', transactionId)

    if (error) throw error
}

export async function getTransactions(options?: {
    walletId?: string
    limit?: number
    offset?: number
}) {
    const supabase = createClient()

    let query = supabase
        .from('transactions')
        .select(`
            *,
            wallet:wallets(id, name, type, currency)
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false })

    // Filter by wallet if specified
    if (options?.walletId) {
        query = query.eq('wallet_id', options.walletId)
    }

    // Apply pagination
    if (options?.limit) {
        query = query.limit(options.limit)
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
}

