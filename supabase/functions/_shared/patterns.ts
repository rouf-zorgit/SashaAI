// ============================================================================
// ENHANCED PATTERN RECOGNITION - System 5
// ============================================================================
// Detects spending patterns: weekend spike, payday splurge, category addiction
// Identifies recurring bills with fuzzy matching and temporal analysis
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface DetectedPattern {
    type: 'weekend_spike' | 'payday_splurge' | 'category_addiction' | 'recurring_bill' | 'sudden_spike'
    trigger?: string
    avgAmount: number
    frequency: string
    confidence: number
    message: string
    metadata?: any
}

/**
 * Detect recurring bills with fuzzy amount matching
 */
export async function detectRecurringBills(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', threeMonthsAgo)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: true })

    if (!transactions || transactions.length < 3) {
        return []
    }

    // Group by merchant with fuzzy amount matching (±10%)
    const merchantGroups: { [key: string]: any[] } = {}
    for (const tx of transactions) {
        const merchant = tx.merchant_name || tx.category
        if (!merchant) continue

        if (!merchantGroups[merchant]) {
            merchantGroups[merchant] = []
        }
        merchantGroups[merchant].push(tx)
    }

    const patterns: DetectedPattern[] = []

    for (const [merchant, txs] of Object.entries(merchantGroups)) {
        if (txs.length < 2) continue

        // Calculate average amount and check if amounts are similar (±15% variance)
        const amounts = txs.map(t => Math.abs(parseFloat(t.amount)))
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const variance = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount <= 0.15)

        if (!variance) continue

        // Analyze temporal frequency
        const dates = txs.map(t => new Date(t.occurred_at).getTime())
        const intervals = []
        for (let i = 1; i < dates.length; i++) {
            intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)) // days
        }

        if (intervals.length === 0) continue

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        let frequency = 'irregular'
        let confidence = 0.5

        // Determine frequency
        if (avgInterval >= 25 && avgInterval <= 35) {
            frequency = 'monthly'
            confidence = 0.9
        } else if (avgInterval >= 12 && avgInterval <= 16) {
            frequency = 'bi-weekly'
            confidence = 0.85
        } else if (avgInterval >= 6 && avgInterval <= 8) {
            frequency = 'weekly'
            confidence = 0.8
        } else if (avgInterval >= 85 && avgInterval <= 95) {
            frequency = 'quarterly'
            confidence = 0.75
        }

        // Boost confidence based on consistency
        const intervalVariance = intervals.every(int => Math.abs(int - avgInterval) / avgInterval <= 0.2)
        if (intervalVariance) {
            confidence = Math.min(confidence + 0.1, 1.0)
        }

        if (confidence >= 0.7) {
            patterns.push({
                type: 'recurring_bill',
                trigger: merchant,
                avgAmount,
                frequency,
                confidence,
                message: `${merchant} is likely a ${frequency} bill (~${avgAmount.toFixed(0)} BDT)`,
                metadata: {
                    occurrences: txs.length,
                    avgInterval: Math.round(avgInterval),
                    lastOccurred: txs[txs.length - 1].occurred_at
                }
            })
        }
    }

    return patterns
}

/**
 * Detect weekend spending spikes
 */
export async function detectWeekendSpike(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', oneMonthAgo)
        .is('deleted_at', null)

    if (!transactions || transactions.length < 10) {
        return []
    }

    let weekendTotal = 0
    let weekdayTotal = 0
    let weekendCount = 0
    let weekdayCount = 0

    for (const tx of transactions) {
        const date = new Date(tx.occurred_at)
        const day = date.getDay() // 0 = Sunday, 6 = Saturday
        const amount = Math.abs(parseFloat(tx.amount))

        if (day === 0 || day === 6) {
            weekendTotal += amount
            weekendCount++
        } else {
            weekdayTotal += amount
            weekdayCount++
        }
    }

    if (weekendCount === 0 || weekdayCount === 0) return []

    const weekendAvg = weekendTotal / weekendCount
    const weekdayAvg = weekdayTotal / weekdayCount

    // Spike if weekend spending is 50%+ higher
    if (weekendAvg > weekdayAvg * 1.5) {
        const spikePercentage = ((weekendAvg - weekdayAvg) / weekdayAvg * 100).toFixed(0)
        return [{
            type: 'weekend_spike',
            avgAmount: weekendAvg,
            frequency: 'weekly',
            confidence: 0.85,
            message: `Weekend spending is ${spikePercentage}% higher than weekdays (${weekendAvg.toFixed(0)} vs ${weekdayAvg.toFixed(0)} BDT)`,
            metadata: {
                weekendAvg,
                weekdayAvg,
                spikePercentage: parseFloat(spikePercentage)
            }
        }]
    }

    return []
}

/**
 * Detect payday splurge pattern
 */
export async function detectPaydaySplurge(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    // Get user's salary day
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('salary_day')
        .eq('id', userId)
        .single()

    if (!profile?.salary_day) return []

    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', twoMonthsAgo)
        .is('deleted_at', null)

    if (!transactions || transactions.length < 10) return []

    let paydayTotal = 0
    let nonPaydayTotal = 0
    let paydayCount = 0
    let nonPaydayCount = 0

    for (const tx of transactions) {
        const date = new Date(tx.occurred_at)
        const dayOfMonth = date.getDate()
        const amount = Math.abs(parseFloat(tx.amount))

        // Consider ±3 days around salary day as "payday period"
        const isPaydayPeriod = Math.abs(dayOfMonth - profile.salary_day) <= 3

        if (isPaydayPeriod) {
            paydayTotal += amount
            paydayCount++
        } else {
            nonPaydayTotal += amount
            nonPaydayCount++
        }
    }

    if (paydayCount === 0 || nonPaydayCount === 0) return []

    const paydayAvg = paydayTotal / paydayCount
    const nonPaydayAvg = nonPaydayTotal / nonPaydayCount

    // Splurge if payday spending is 40%+ higher
    if (paydayAvg > nonPaydayAvg * 1.4) {
        const splurgePercentage = ((paydayAvg - nonPaydayAvg) / nonPaydayAvg * 100).toFixed(0)
        return [{
            type: 'payday_splurge',
            avgAmount: paydayAvg,
            frequency: 'monthly',
            confidence: 0.8,
            message: `Payday spending spikes ${splurgePercentage}% (${paydayAvg.toFixed(0)} vs ${nonPaydayAvg.toFixed(0)} BDT)`,
            metadata: {
                salaryDay: profile.salary_day,
                paydayAvg,
                nonPaydayAvg,
                splurgePercentage: parseFloat(splurgePercentage)
            }
        }]
    }

    return []
}

/**
 * Detect category addiction (over-spending in specific category)
 */
export async function detectCategoryAddiction(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', oneMonthAgo)
        .is('deleted_at', null)

    if (!transactions || transactions.length < 10) return []

    const byCategory: { [key: string]: number[] } = {}
    let totalSpending = 0

    for (const tx of transactions) {
        const amount = Math.abs(parseFloat(tx.amount))
        if (!byCategory[tx.category]) byCategory[tx.category] = []
        byCategory[tx.category].push(amount)
        totalSpending += amount
    }

    const patterns: DetectedPattern[] = []

    for (const [category, amounts] of Object.entries(byCategory)) {
        const categoryTotal = amounts.reduce((a, b) => a + b, 0)
        const percentage = (categoryTotal / totalSpending) * 100

        // Flag if category is >40% of total spending
        if (percentage > 40 && amounts.length >= 5) {
            patterns.push({
                type: 'category_addiction',
                trigger: category,
                avgAmount: categoryTotal / amounts.length,
                frequency: `${amounts.length} times/month`,
                confidence: 0.85,
                message: `${category} is ${percentage.toFixed(0)}% of your spending (${categoryTotal.toFixed(0)} BDT)`,
                metadata: {
                    percentage: parseFloat(percentage.toFixed(1)),
                    totalSpent: categoryTotal,
                    transactionCount: amounts.length
                }
            })
        }
    }

    return patterns
}

/**
 * Detect sudden spending spikes
 */
export async function detectSuddenSpike(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', oneMonthAgo)
        .is('deleted_at', null)

    if (!transactions || transactions.length < 5) return []

    const byCategory: { [key: string]: number[] } = {}
    for (const tx of transactions) {
        if (!byCategory[tx.category]) byCategory[tx.category] = []
        byCategory[tx.category].push(Math.abs(parseFloat(tx.amount)))
    }

    const patterns: DetectedPattern[] = []

    for (const [category, amounts] of Object.entries(byCategory)) {
        if (amounts.length < 3) continue

        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const max = Math.max(...amounts)

        // Spike if max is 2.5x average (lowered threshold for better detection)
        if (max > avg * 2.5) {
            const spikePercentage = ((max - avg) / avg * 100).toFixed(0)
            patterns.push({
                type: 'sudden_spike',
                trigger: category,
                avgAmount: max,
                frequency: 'one-time',
                confidence: 0.75,
                message: `Unusual ${category} spike: ${max.toFixed(0)} BDT (${spikePercentage}% above avg)`,
                metadata: {
                    maxAmount: max,
                    avgAmount: avg,
                    spikePercentage: parseFloat(spikePercentage)
                }
            })
        }
    }

    return patterns
}

/**
 * Run comprehensive pattern analysis
 */
export async function runPatternAnalysis(
    userId: string,
    supabaseClient: any
): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // Run all detection algorithms in parallel
    const [recurringBills, weekendSpike, paydaySplurge, categoryAddiction, spikes] = await Promise.all([
        detectRecurringBills(userId, supabaseClient),
        detectWeekendSpike(userId, supabaseClient),
        detectPaydaySplurge(userId, supabaseClient),
        detectCategoryAddiction(userId, supabaseClient),
        detectSuddenSpike(userId, supabaseClient)
    ])

    patterns.push(...recurringBills, ...weekendSpike, ...paydaySplurge, ...categoryAddiction, ...spikes)

    // Save high-confidence patterns to database
    for (const pattern of patterns) {
        if (pattern.confidence >= 0.7) {
            if (pattern.type === 'recurring_bill') {
                await supabaseClient
                    .from('recurring_payments')
                    .upsert({
                        user_id: userId,
                        merchant_name: pattern.trigger,
                        amount: pattern.avgAmount,
                        frequency: pattern.frequency,
                        confidence: pattern.confidence,
                        is_active: true
                    }, {
                        onConflict: 'user_id,merchant_name'
                    })
            }
        }
    }

    console.log(`🔍 Detected ${patterns.length} patterns (${patterns.filter(p => p.confidence >= 0.7).length} high-confidence)`)
    return patterns
}

/**
 * Get pattern warnings for AI context
 */
export async function getPatternWarnings(
    userId: string,
    supabaseClient: any
): Promise<string> {
    const patterns = await runPatternAnalysis(userId, supabaseClient)

    // Only show high-confidence patterns
    const highConfidence = patterns.filter(p => p.confidence >= 0.7)

    if (highConfidence.length === 0) {
        return ''
    }

    return `
SPENDING PATTERNS DETECTED:
${highConfidence.map(p => `⚠️ ${p.message} (${(p.confidence * 100).toFixed(0)}% confidence)`).join('\n')}

Use these insights to help user make better financial decisions.
`.trim()
}
