import { createClient } from '@/lib/supabase/server'

export async function getProfileStats(userId: string) {
    const supabase = await createClient()

    // Fetch recent transactions and filter in JS to avoid timezone issues
    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(500)

    if (!transactions) return { income: 0, expenses: 0, balance: 0 }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    })

    const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

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
