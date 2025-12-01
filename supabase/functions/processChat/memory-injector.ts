// ============================================================================
// MEMORY INJECTOR - System 8b
// ============================================================================
// Builds comprehensive memory context for AI from all memory systems
// Combines LTM, STM, Episodic, and Pattern data into cohesive context
// ============================================================================

/**
 * Build Long-Term Memory context block
 */
export function buildLTMContext(
    profile: any,
    preferences: any,
    spendingPatterns: any,
    memoryEvents: any[]
): string {
    const ltmBlock = `
=== LONG-TERM MEMORY ===

USER PROFILE:
- Name: ${profile?.name || 'Unknown'}
- Monthly Income: ${profile?.income_monthly ? `${profile.income_monthly} BDT` : 'Not set'}
- Salary Day: ${profile?.salary_day ? `Day ${profile.salary_day}` : 'Not set'}
- Fixed Costs: ${profile?.fixed_costs ? Object.entries(profile.fixed_costs).map(([k, v]) => `${k}: ${v} BDT`).join(', ') : 'None'}

PREFERENCES:
- Communication Style: ${preferences?.communication_style || 'Direct'}
- Financial Goal: ${preferences?.financial_goal || 'Save Money'}
- Risk Tolerance: ${preferences?.risk_tolerance || 'Medium'}
- Sarcasm Level: ${preferences?.sarcasm_level || 'Medium'}

SPENDING PERSONALITY:
- Weekend Spike: ${spendingPatterns?.weekend_spike ? 'YES ⚠️' : 'No'}
- Payday Pattern: ${spendingPatterns?.payday_pattern ? 'YES ⚠️' : 'No'}
- Stress Shopping: ${spendingPatterns?.stress_shopping ? 'YES ⚠️' : 'No'}
- Top Category: ${spendingPatterns?.top_category || 'N/A'}
- Avg Daily Spend: ${spendingPatterns?.avg_daily_spend ? `${spendingPatterns.avg_daily_spend} BDT` : 'N/A'}

IMPORTANT MEMORIES:
${memoryEvents?.map(m => `- [${m.kind}] ${JSON.stringify(m.data)}`).join('\n') || '- None'}

CRITICAL: You MUST remember all of the above. NEVER ask for information you already know.
`
    return ltmBlock.trim()
}

/**
 * Build Short-Term Memory context block
 */
export function buildSTMContext(sessionContext: any[]): string {
    if (!sessionContext || sessionContext.length === 0) {
        return ''
    }

    const stmBlock = `
=== SHORT-TERM MEMORY (This Session) ===

${sessionContext.map(ctx => {
        switch (ctx.context_type) {
            case 'topic':
                return `📌 Current Topic: ${ctx.value}`
            case 'correction':
                return `✏️ User Corrected: ${ctx.key} → ${ctx.value}`
            case 'clarification':
                return `❓ Pending Question: ${ctx.value}`
            case 'decision':
                return `🤔 User Considering: ${ctx.value}`
            default:
                return `- ${ctx.key}: ${ctx.value}`
        }
    }).join('\n')}

CRITICAL: Reference this context in your response to show continuity.
`
    return stmBlock.trim()
}

/**
 * Build Episodic Memory context block
 */
export function buildEpisodicContext(recentEpisodes: any[]): string {
    if (!recentEpisodes || recentEpisodes.length === 0) {
        return ''
    }

    const episodicBlock = `
=== EPISODIC MEMORY (Recent Events) ===

${recentEpisodes.map(e => {
        const date = new Date(e.occurred_at)
        const timeAgo = getTimeAgo(date)
        return `- ${timeAgo}: ${e.summary} [importance: ${e.importance}/10]`
    }).join('\n')}

CRITICAL: Use these episodes to provide context like "Last week you spent..." or "Remember when you..."
`
    return episodicBlock.trim()
}

/**
 * Build Pattern Recognition context block
 */
export function buildPatternContext(
    spendingPatterns: any[],
    recurringBills: any[]
): string {
    if ((!spendingPatterns || spendingPatterns.length === 0) &&
        (!recurringBills || recurringBills.length === 0)) {
        return ''
    }

    const patternBlock = `
=== DETECTED PATTERNS ===

SPENDING HABITS:
${spendingPatterns?.map(p => {
        return `- ${p.pattern_type}: ${p.trigger_category || p.trigger_day} (Avg: ${p.avg_amount} BDT, Confidence: ${(p.confidence * 100).toFixed(0)}%)`
    }).join('\n') || '- None detected yet'}

RECURRING BILLS:
${recurringBills?.map(b => {
        const dueDate = b.next_due_date ? new Date(b.next_due_date).toLocaleDateString() : 'Unknown'
        return `- ${b.merchant_name}: ${b.amount} BDT (Due: ${dueDate})`
    }).join('\n') || '- None detected yet'}

CRITICAL: Warn user about patterns when relevant. E.g., "I noticed you overspend on weekends..."
`
    return patternBlock.trim()
}

/**
 * Build complete memory context for AI
 */
export function buildCompleteContext(memoryData: {
    profile: any
    preferences: any
    spendingPatterns: any
    memoryEvents: any[]
    sessionContext: any[]
    recentEpisodes: any[]
    detectedPatterns: any[]
    recurringBills: any[]
}): string {
    const sections = [
        buildLTMContext(
            memoryData.profile,
            memoryData.preferences,
            memoryData.spendingPatterns,
            memoryData.memoryEvents
        ),
        buildSTMContext(memoryData.sessionContext),
        buildEpisodicContext(memoryData.recentEpisodes),
        buildPatternContext(memoryData.detectedPatterns, memoryData.recurringBills)
    ].filter(section => section.length > 0)

    return sections.join('\n\n')
}

/**
 * Helper: Get human-readable time ago
 */
function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Check if AI should ask for information
 */
export function shouldAskAgain(
    field: 'name' | 'salary' | 'fixed_costs' | 'financial_goal',
    profile: any,
    preferences: any
): boolean {
    switch (field) {
        case 'name':
            return !profile?.name
        case 'salary':
            return !profile?.income_monthly
        case 'fixed_costs':
            return !profile?.fixed_costs || Object.keys(profile.fixed_costs).length === 0
        case 'financial_goal':
            return !preferences?.financial_goal || preferences.financial_goal === 'Save Money'
        default:
            return true
    }
}
