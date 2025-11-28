import { createClient } from '@/lib/supabase/server'

export async function getProfileStats(userId: string) {
    const supabase = await createClient()

    // Get current month transactions
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0]

    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)

    const income = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const expenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    return {
        income,
        expenses,
        balance: income - expenses,
    }
}

export async function getUnreadNotificationCount(userId: string) {
    const supabase = await createClient()

    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

    return count || 0
}
