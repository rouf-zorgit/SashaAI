import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get month and year from query params
        const searchParams = req.nextUrl.searchParams
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

        // Calculate date range
        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

        // Fetch transactions for the month
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false })

        if (txError) {
            console.error('Transactions error:', txError)
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
        }

        // Calculate report data
        const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const categoryBreakdown: Record<string, number> = {}
        transactions?.forEach(t => {
            if (t.type === 'expense') {
                categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Number(t.amount)
            }
        })

        const reportData = {
            month,
            year,
            totalIncome: income,
            totalExpenses: expenses,
            netSavings: income - expenses,
            categoryBreakdown,
            transactions: transactions || []
        }

        return NextResponse.json(reportData)

    } catch (error: any) {
        console.error('Reports API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
