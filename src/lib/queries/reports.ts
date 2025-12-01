import { createClient } from '@/lib/supabase/server'

export async function getMonthlyReport(
    userId: string,
    year: number,
    month: number
) {
    const supabase = await createClient()

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, type, currency)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error('Monthly report error:', error)
        return null
    }

    if (!transactions) return null

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    // Group by category
    const byCategory: Record<string, number> = {}
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
        })

    // Group by wallet
    const byWallet: Record<string, { name: string, type: string, amount: number, currency: string }> = {}
    transactions
        .filter(t => t.type === 'expense' && t.wallet)
        .forEach(t => {
            const walletId = t.wallet.id
            if (!byWallet[walletId]) {
                byWallet[walletId] = {
                    name: t.wallet.name,
                    type: t.wallet.type,
                    currency: t.wallet.currency,
                    amount: 0
                }
            }
            byWallet[walletId].amount += Number(t.amount)
        })

    return {
        income,
        expenses,
        balance: income - expenses,
        byCategory,
        byWallet,
        transactionCount: transactions.length
    }
}

export async function getWalletStats(userId: string) {
    const supabase = await createClient()

    // Get all wallets
    const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('balance', { ascending: false })

    if (walletError) return []

    return wallets
}
