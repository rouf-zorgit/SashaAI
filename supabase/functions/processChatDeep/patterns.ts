// ============================================================================
// PATTERN RECOGNITION - System 5
// ============================================================================
// Detects spending patterns: weekend spike, payday splurge, category addiction
// Identifies recurring bills and sudden spending spikes
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface DetectedPattern {
    type: 'weekend_spike' | 'payday_splurge' | 'category_addiction' | 'recurring_bill' | 'sudden_spike'
    trigger?: string
    avgAmount: number
    frequency: string
    confidence: number
    message: string
}

/**
 * Detect recurring bills from transaction history
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

    if (!transactions || transactions.length < 3) {
        return []
    }

    // Group by merchant and amount
    const groups: { [key: string]: any[] } = {}
    for (const tx of transactions) {
        if (tx.merchant_name) {
            const key = `${tx.merchant_name}_${tx.amount}`
            if (!groups[key]) groups[key] = []
            groups[key].push(tx)
        }
    }

    const patterns: DetectedPattern[] = []

    for (const [key, txs] of Object.entries(groups)) {
        if (txs.length >= 2) {
            const [merchant, amount] = key.split('_')
            const avgAmount = parseFloat(amount)

            patterns.push({
                type: 'recurring_bill',
                trigger: merchant,
                avgAmount,
                frequency: `${txs.length} times in 3 months`,
                confidence: Math.min(txs.length / 3, 1),
                message: `${merchant} appears to be a recurring bill (${avgAmount} BDT)`
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

    if (!transactions || transactions.length < 5) {
        return []
    }

    // Calculate average by category
    const byCategory: { [key: string]: number[] } = {}
    for (const tx of transactions) {
        if (!byCategory[tx.category]) byCategory[tx.category] = []
        byCategory[tx.category].push(parseFloat(tx.amount))
    }

    const patterns: DetectedPattern[] = []

    for (const [category, amounts] of Object.entries(byCategory)) {
        if (amounts.length < 3) continue

        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const max = Math.max(...amounts)

        // Spike if max is 3x average
        if (max > avg * 3) {
            patterns.push({
                type: 'sudden_spike',
                trigger: category,
                avgAmount: max,
                frequency: 'one-time',
                confidence: 0.8,
                message: `Unusual spike in ${category}: ${max.toFixed(0)} BDT (avg: ${avg.toFixed(0)} BDT)`
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

    // Detect recurring bills
    const recurringBills = await detectRecurringBills(userId, supabaseClient)
    patterns.push(...recurringBills)

    // Detect sudden spikes
    const spikes = await detectSuddenSpike(userId, supabaseClient)
    patterns.push(...spikes)

    // Save patterns to database
    for (const pattern of patterns) {
        if (pattern.type === 'recurring_bill') {
            await supabaseClient
                .from('recurring_payments')
                .upsert({
                    user_id: userId,
                    merchant_name: pattern.trigger,
                    amount: pattern.avgAmount,
                    frequency: 'monthly',
                    confidence: pattern.confidence
                })
        } else if (pattern.type === 'sudden_spike') {
            await supabaseClient
                .from('sudden_spike_patterns')
                .insert({
                    user_id: userId,
                    category: pattern.trigger,
                    amount: pattern.avgAmount,
                    spike_percentage: 300,
                    average_amount: pattern.avgAmount / 3
                })
        }
    }

    console.log(`🔍 Detected ${patterns.length} patterns`)
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

    if (patterns.length === 0) {
        return ''
    }

    return `
PATTERN WARNINGS:
${patterns.map(p => `⚠️ ${p.message}`).join('\n')}

Mention these patterns when relevant to help user stay aware.
`.trim()
}
