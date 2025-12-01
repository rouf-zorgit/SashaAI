import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
    try {
        // ✅ SECURITY: Validate user from JWT token
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing authentication token' },
                { status: 401 }
            )
        }

        const authenticatedUserId = user.id
        logger.info(`Analyzing patterns for user ${authenticatedUserId}...`)

        // 1. Fetch last 90 days of transactions
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const transactions = await prisma.transactions.findMany({
            where: {
                user_id: authenticatedUserId,
                created_at: {
                    gte: ninetyDaysAgo
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        })

        if (transactions.length < 10) {
            return NextResponse.json({
                success: true,
                message: 'Not enough data for pattern analysis',
                patterns: []
            })
        }

        const results: any[] = []

        // ==========================================
        // A. RECURRING PAYMENTS DETECTION
        // ==========================================
        const merchantGroups: Record<string, any[]> = {}
        transactions.forEach(t => {
            if (t.type === 'expense') {
                const key = t.description || 'Unknown'
                if (!merchantGroups[key]) merchantGroups[key] = []
                merchantGroups[key].push(t)
            }
        })

        for (const [merchant, txs] of Object.entries(merchantGroups)) {
            if (txs.length >= 2) {
                let isRecurring = true
                let totalInterval = 0
                let count = 0

                for (let i = 1; i < txs.length; i++) {
                    const d1 = new Date(txs[i - 1].created_at!).getTime()
                    const d2 = new Date(txs[i].created_at!).getTime()
                    const days = (d2 - d1) / (1000 * 60 * 60 * 24)

                    if (days >= 25 && days <= 35) {
                        totalInterval += days
                        count++
                    } else {
                        isRecurring = false
                    }
                }

                if (isRecurring && count > 0) {
                    const avgAmount = txs.reduce((sum, t) => sum + Number(t.amount), 0) / txs.length
                    results.push({
                        type: 'recurring',
                        merchant,
                        avgAmount,
                        frequency: 'monthly',
                        confidence: 0.9
                    })
                }
            }
        }

        // ==========================================
        // B. WEEKEND SPIKE DETECTION
        // ==========================================
        let weekendSum = 0, weekendCount = 0
        let weekdaySum = 0, weekdayCount = 0

        transactions.forEach(t => {
            if (t.type === 'expense' && t.created_at) {
                const day = new Date(t.created_at).getDay()
                if (day === 0 || day === 6) {
                    weekendSum += Number(t.amount)
                    weekendCount++
                } else {
                    weekdaySum += Number(t.amount)
                    weekdayCount++
                }
            }
        })

        const avgWeekend = weekendCount > 0 ? weekendSum / weekendCount : 0
        const avgWeekday = weekdayCount > 0 ? weekdaySum / weekdayCount : 0

        if (avgWeekend > avgWeekday * 1.5 && avgWeekend > 1000) {
            results.push({
                type: 'weekend_spike',
                avgWeekend,
                avgWeekday,
                confidence: 0.85
            })
        }

        // ==========================================
        // C. PAYDAY SPLURGE DETECTION
        // ==========================================
        const incomes = transactions.filter(t => t.type === 'income' && Number(t.amount) > 5000)

        for (const income of incomes) {
            if (!income.created_at) continue

            const incomeDate = new Date(income.created_at).getTime()
            const limitDate = incomeDate + (48 * 60 * 60 * 1000)

            const splurgeSum = transactions
                .filter(t => t.type === 'expense' &&
                    t.created_at &&
                    new Date(t.created_at).getTime() > incomeDate &&
                    new Date(t.created_at).getTime() < limitDate)
                .reduce((sum, t) => sum + Number(t.amount), 0)

            if (splurgeSum > Number(income.amount) * 0.3) {
                results.push({
                    type: 'payday_splurge',
                    income: income.amount,
                    spent48h: splurgeSum,
                    confidence: 0.9
                })
                break
            }
        }

        // ==========================================
        // D. CATEGORY ADDICTION
        // ==========================================
        const categoryCounts: Record<string, number> = {}
        const categorySums: Record<string, number> = {}
        let totalSpend = 0

        transactions.forEach(t => {
            if (t.type === 'expense') {
                const cat = t.category || 'Uncategorized'
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
                categorySums[cat] = (categorySums[cat] || 0) + Number(t.amount)
                totalSpend += Number(t.amount)
            }
        })

        for (const [cat, count] of Object.entries(categoryCounts)) {
            const amount = categorySums[cat]
            if ((amount > totalSpend * 0.2 && cat !== 'Rent' && cat !== 'Bills') || count > 60) {
                results.push({
                    type: 'impulse_category',
                    category: cat,
                    totalCount: count,
                    totalAmount: amount,
                    avgAmount: amount / count,
                    pctOfTotal: amount / totalSpend,
                    confidence: 0.85
                })
            }
        }

        logger.info(`Found ${results.length} patterns for user ${authenticatedUserId}`)

        return NextResponse.json({
            success: true,
            patterns: results
        })

    } catch (error: any) {
        logger.error('Error analyzing patterns:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
