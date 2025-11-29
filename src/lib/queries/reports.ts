import { createClient } from '@/lib/supabase/server'

export async function getMonthlyReport(
    userId: string,
    year: number,
    month: number
) {
    const supabase = await createClient()

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    console.log(`📊 getMonthlyReport: Querying for ${year}-${month}`)
    console.log(`📊 Date range: ${startDate} to ${endDate}`)

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error('❌ getMonthlyReport error:', error)
        return null
    }

    console.log(`📊 Found ${transactions?.length || 0} transactions`)

    if (!transactions) return null

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    console.log(`📊 Income: ${income}, Expenses: ${expenses}`)

    // Group by category
    const byCategory: Record<string, number> = {}
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
        })

    // Top categories
    const topCategories = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
        }))

    return {
        income,
        expenses,
        balance: income - expenses,
        byCategory,
        topCategories,
        transactionCount: transactions.length,
        avgExpense: transactions.filter(t => t.type === 'expense').length > 0
            ? expenses / transactions.filter(t => t.type === 'expense').length
            : 0,
    }
}

export async function getYearlyTrend(userId: string, year: number) {
    const supabase = await createClient()

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)

    if (!transactions) return []

    // Group by month
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i).toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0,
    }))

    transactions.forEach(t => {
        const dateStr = t.date || t.created_at
        const monthIndex = new Date(dateStr).getMonth()
        if (t.type === 'income') {
            byMonth[monthIndex].income += Number(t.amount)
        } else {
            byMonth[monthIndex].expenses += Number(t.amount)
        }
    })

    return byMonth
}
