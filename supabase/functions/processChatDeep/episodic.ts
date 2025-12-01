// ============================================================================
// EPISODIC MEMORY - System 3
// ============================================================================
// Enables temporal recall: "Last week you spent X on Y"
// Stores and retrieves specific spending episodes
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Get last week's spending by category
 */
export async function getLastWeekSpending(
    userId: string,
    supabaseClient: any
): Promise<{ category: string; total: number }[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('occurred_at', oneWeekAgo)
        .is('deleted_at', null)

    if (!transactions || transactions.length === 0) {
        return []
    }

    // Group by category
    const byCategory: { [key: string]: number } = {}
    for (const tx of transactions) {
        byCategory[tx.category] = (byCategory[tx.category] || 0) + parseFloat(tx.amount)
    }

    return Object.entries(byCategory).map(([category, total]) => ({
        category,
        total
    }))
}

/**
 * Get spending for specific time period
 */
export async function getSpendingEpisode(
    userId: string,
    startDate: Date,
    endDate: Date,
    supabaseClient: any
): Promise<any[]> {
    const { data } = await supabaseClient
        .from('episodic_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'transaction')
        .gte('occurred_at', startDate.toISOString())
        .lte('occurred_at', endDate.toISOString())
        .order('occurred_at', { ascending: false })

    return data || []
}

/**
 * Generate episodic context for AI
 */
export async function generateEpisodicContext(
    userId: string,
    supabaseClient: any
): Promise<string> {
    const lastWeek = await getLastWeekSpending(userId, supabaseClient)

    if (lastWeek.length === 0) {
        return ''
    }

    const topSpending = lastWeek.sort((a, b) => b.total - a.total).slice(0, 3)

    return `
LAST WEEK'S SPENDING:
${topSpending.map(({ category, total }) =>
        `- ${category}: ${total.toFixed(0)} BDT`
    ).join('\n')}

Use this to say things like: "Last week you spent ${topSpending[0].total.toFixed(0)} BDT on ${topSpending[0].category}"
`.trim()
}

/**
 * Log important episode
 */
export async function logEpisode(
    userId: string,
    eventType: string,
    summary: string,
    data: any,
    importance: number,
    supabaseClient: any
): Promise<void> {
    await supabaseClient
        .from('episodic_events')
        .insert({
            user_id: userId,
            event_type: eventType,
            event_data: data,
            occurred_at: new Date().toISOString(),
            importance,
            summary,
            tags: [eventType]
        })

    console.log(`📝 Logged episode: ${summary}`)
}
