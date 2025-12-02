'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            data,
            read: false  // ✅ FIXED: Database uses 'read', not 'is_read'
        })

    if (error) {
        console.error('Error creating notification:', error)
        throw error  // ✅ ADDED: Throw error so we can see what went wrong
    }
}

export async function markNotificationRead(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    revalidatePath('/history') // Notifications are shown here currently
}

export async function markAllNotificationsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

    revalidatePath('/history')
}

export async function checkLowBalance(walletId: string) {
    const supabase = await createClient()

    // Get wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single()

    if (!wallet) return

    // Threshold: 10% of limit, or 1000 if no limit
    const limit = wallet.monthly_limit || 10000
    const threshold = limit * 0.1

    if (wallet.balance < threshold) {
        // Check if we already notified recently (to avoid spam) - simplified for MVP
        // In a real app, we'd check the last notification time for this wallet/type

        await createNotification(
            wallet.user_id,
            'warning',
            'Low Balance Warning',
            `Your ${wallet.name} balance is low (${wallet.currency} ${wallet.balance}).`,
            { walletId: wallet.id }
        )
    }
}

/**
 * SASHA'S NOTIFICATION INTELLIGENCE SYSTEM
 * Professional Chartered Accountant persona with 4 specialized roles
 */

/**
 * THE STRICT AUDITOR - Checks if user has exceeded category budgets
 */
export async function checkBudgetExceeded(userId: string) {
    const supabase = await createClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('created_at', startOfMonth.toISOString())
        .is('deleted_at', null)

    if (!transactions || transactions.length === 0) return

    const categorySpending: Record<string, number> = {}
    transactions.forEach(tx => {
        const cat = tx.category || 'other'
        categorySpending[cat] = (categorySpending[cat] || 0) + Number(tx.amount)
    })

    const budgets: Record<string, number> = {
        dining: 5000,
        shopping: 8000,
        entertainment: 3000,
        transport: 4000,
        groceries: 10000
    }

    for (const [category, spent] of Object.entries(categorySpending)) {
        const budget = budgets[category]
        if (!budget) continue

        const percentOver = ((spent - budget) / budget) * 100

        if (percentOver > 0) {
            await createNotification(
                userId,
                'error',
                `${category.charAt(0).toUpperCase() + category.slice(1)} Budget Exceeded`,
                `As your CA, I must inform you that you've exceeded your ${category} budget by ${percentOver.toFixed(0)}%. You've spent ৳${spent.toFixed(0)} against a budget of ৳${budget.toFixed(0)}. Consider adjusting your spending or revising your budget allocation.`,
                { type: 'budget_exceeded', category, spent, budget }
            )
        } else if (percentOver > -20) {
            await createNotification(
                userId,
                'warning',
                `${category.charAt(0).toUpperCase() + category.slice(1)} Budget Alert`,
                `You're approaching your ${category} budget limit. Current spending: ৳${spent.toFixed(0)} (${((spent / budget) * 100).toFixed(0)}% of ৳${budget.toFixed(0)}). I recommend monitoring this category closely for the rest of the month.`,
                { type: 'budget_warning', category, spent, budget }
            )
        }
    }

    revalidatePath('/history')
}

/**
 * THE GOAL KEEPER - Monitors goal progress
 */
export async function checkGoalProgress(userId: string) {
    const supabase = await createClient()

    const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)

    if (!goals || goals.length === 0) return

    for (const goal of goals) {
        const progress = (goal.current_amount / goal.target_amount) * 100

        if (progress >= 100) {
            await createNotification(
                userId,
                'success',
                `🎉 Goal Achieved: ${goal.title}`,
                `Congratulations! You've successfully reached your goal of ৳${goal.target_amount.toFixed(0)}. This demonstrates excellent financial discipline. Consider setting a new goal to maintain momentum.`,
                { type: 'goal_reached', goalId: goal.id }
            )
        } else if (goal.deadline) {
            const daysUntilDeadline = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const requiredMonthlyRate = (goal.target_amount - goal.current_amount) / (daysUntilDeadline / 30)

            if (daysUntilDeadline <= 30 && progress < 50) {
                await createNotification(
                    userId,
                    'error',
                    `Goal At Risk: ${goal.title}`,
                    `Your goal deadline is ${daysUntilDeadline} days away, but you're only at ${progress.toFixed(0)}% completion. To reach your target, you'll need to save approximately ৳${requiredMonthlyRate.toFixed(0)} per month. Let's discuss a revised savings strategy.`,
                    { type: 'goal_at_risk', goalId: goal.id }
                )
            }
        }
    }

    revalidatePath('/history')
}

/**
 * THE FORECASTER - Predicts upcoming bills
 */
export async function checkUpcomingBills(userId: string) {
    const supabase = await createClient()

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: transactions } = await supabase
        .from('transactions')
        .select('description, amount, created_at, category')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('created_at', threeMonthsAgo.toISOString())
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (!transactions || transactions.length === 0) return

    const merchantGroups: Record<string, any[]> = {}
    transactions.forEach(tx => {
        const key = tx.description || 'Unknown'
        if (!merchantGroups[key]) merchantGroups[key] = []
        merchantGroups[key].push(tx)
    })

    for (const [merchant, txs] of Object.entries(merchantGroups)) {
        if (txs.length >= 3) {
            const dates = txs.map(t => new Date(t.created_at).getTime()).sort((a, b) => b - a)
            const intervals = []
            for (let i = 0; i < dates.length - 1; i++) {
                intervals.push(dates[i] - dates[i + 1])
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

            const lastDate = dates[0]
            const nextDate = new Date(lastDate + avgInterval)
            const daysUntilNext = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            if (daysUntilNext > 0 && daysUntilNext <= 3) {
                const avgAmount = txs.reduce((sum, t) => sum + Number(t.amount), 0) / txs.length

                await createNotification(
                    userId,
                    'warning',
                    `Upcoming Bill: ${merchant}`,
                    `Based on your payment history, your ${merchant} bill (approximately ৳${avgAmount.toFixed(0)}) is due in ${daysUntilNext} days. Please ensure sufficient funds are available in your primary wallet.`,
                    { type: 'upcoming_bill', merchant, amount: avgAmount }
                )
            }
        }
    }

    revalidatePath('/history')
}

/**
 * THE AUDIT - Generates weekly financial summary
 */
export async function generateWeeklySummary(userId: string) {
    const supabase = await createClient()

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, category')
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString())
        .is('deleted_at', null)

    if (!transactions || transactions.length === 0) {
        await createNotification(
            userId,
            'info',
            'Weekly Financial Audit',
            'No transactions recorded this week. If you\'ve made any cash purchases, please log them to maintain accurate records.',
            { type: 'weekly_summary' }
        )
        return
    }

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const netFlow = income - expenses

    const categoryTotals: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'other'
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount)
    })
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

    const message = `Weekly Financial Summary:
• Total Income: ৳${income.toFixed(0)}
• Total Expenses: ৳${expenses.toFixed(0)}
• Net Cash Flow: ${netFlow >= 0 ? '+' : ''}৳${netFlow.toFixed(0)}
• Top Spending: ${topCategory ? `${topCategory[0]} (৳${topCategory[1].toFixed(0)})` : 'N/A'}
• Transactions: ${transactions.length}

${netFlow < 0 ? '⚠️ Your expenses exceeded income this week. Review your spending patterns.' : '✅ Positive cash flow this week. Well done!'}`

    await createNotification(
        userId,
        'info',
        'Weekly Financial Audit',
        message,
        { type: 'weekly_summary', income, expenses, netFlow }
    )

    revalidatePath('/history')
}

/**
 * Detect unusual spending activity
 */
export async function checkUnusualSpending(userId: string) {
    const supabase = await createClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, description, created_at')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('deleted_at', null)

    if (!transactions || transactions.length < 5) return

    const amounts = transactions.map(t => Number(t.amount))
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentTxs = transactions.filter(t => new Date(t.created_at) >= threeDaysAgo)

    for (const tx of recentTxs) {
        const amount = Number(tx.amount)
        if (amount > avg + (2 * stdDev) && amount > 1000) {
            await createNotification(
                userId,
                'warning',
                'Unusual Spending Detected',
                `I noticed a transaction of ৳${amount.toFixed(0)} for "${tx.description}", which is significantly higher than your typical spending of ৳${avg.toFixed(0)}. Please verify this transaction is correct and authorized.`,
                { type: 'unusual_spending', amount, description: tx.description }
            )
        }
    }

    revalidatePath('/history')
}

/**
 * Master function to run all notification checks
 */
export async function runNotificationChecks(userId: string) {
    try {
        await Promise.all([
            checkBudgetExceeded(userId),
            checkGoalProgress(userId),
            checkUpcomingBills(userId),
            checkUnusualSpending(userId)
        ])

        return { success: true }
    } catch (error) {
        console.error('Error running notification checks:', error)
        return { success: false, error }
    }
}
