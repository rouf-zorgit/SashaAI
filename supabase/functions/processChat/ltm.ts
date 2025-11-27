// ============================================================================
// LONG-TERM MEMORY (LTM) - System 1
// ============================================================================
// Manages persistent user information that should never be forgotten
// Prevents re-asking for salary, name, fixed costs, preferences
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Extract salary information from message
 */
export async function extractSalaryInfo(
    message: string,
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const salaryPatterns = [
        /(?:my salary is|i earn|i make|income is)\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:bdt|taka|tk)?/i,
        /(?:salary|income):\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /^(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:bdt|taka|tk)?$/i
    ]

    for (const pattern of salaryPatterns) {
        const match = message.match(pattern)
        if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''))

            if (amount >= 5000 && amount <= 1000000) { // Reasonable salary range
                await supabaseClient
                    .from('profiles')
                    .update({ income_monthly: amount })
                    .eq('id', userId)

                console.log(`✅ Saved salary: ${amount} BDT`)
                return true
            }
        }
    }

    return false
}

/**
 * Extract fixed costs from message
 */
export async function extractFixedCosts(
    message: string,
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const costPatterns = [
        { type: 'rent', pattern: /(?:my rent is|rent:|pay\s+(?:for\s+)?rent)\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i },
        { type: 'electricity', pattern: /(?:electricity|electric)\s+(?:bill|cost)?\s*(?:is)?\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i },
        { type: 'internet', pattern: /(?:internet|wifi)\s+(?:bill|cost)?\s*(?:is)?\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i },
        { type: 'water', pattern: /(?:water)\s+(?:bill|cost)?\s*(?:is)?\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i },
        { type: 'gas', pattern: /(?:gas)\s+(?:bill|cost)?\s*(?:is)?\s*(?:about\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i }
    ]

    let saved = false

    for (const { type, pattern } of costPatterns) {
        const match = message.match(pattern)
        if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''))

            // Get existing fixed costs
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('fixed_costs')
                .eq('id', userId)
                .single()

            const existingCosts = profile?.fixed_costs || {}
            const updatedCosts = {
                ...existingCosts,
                [type]: amount
            }

            await supabaseClient
                .from('profiles')
                .update({ fixed_costs: updatedCosts })
                .eq('id', userId)

            console.log(`✅ Saved fixed cost: ${type} = ${amount} BDT`)
            saved = true
        }
    }

    return saved
}

/**
 * Extract user's name from message
 */
export async function extractName(
    message: string,
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const namePatterns = [
        /(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /(?:name:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    ]

    for (const pattern of namePatterns) {
        const match = message.match(pattern)
        if (match) {
            const name = match[1].trim()

            // Validate name (at least 2 characters, not a number)
            if (name.length >= 2 && !/^\d+$/.test(name)) {
                await supabaseClient
                    .from('profiles')
                    .update({ name: name })
                    .eq('id', userId)

                console.log(`✅ Saved name: ${name}`)
                return true
            }
        }
    }

    return false
}

/**
 * Extract salary day from message
 */
export async function extractSalaryDay(
    message: string,
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const dayPatterns = [
        /(?:i get paid on|salary on|payday is)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/i,
        /(?:i get paid on|salary on|payday is)\s+(\d{1,2})/i
    ]

    for (const pattern of dayPatterns) {
        const match = message.match(pattern)
        if (match) {
            const day = parseInt(match[1])

            if (day >= 1 && day <= 31) {
                await supabaseClient
                    .from('profiles')
                    .update({ salary_day: day })
                    .eq('id', userId)

                console.log(`✅ Saved salary day: ${day}`)
                return true
            }
        }
    }

    return false
}

/**
 * Check if should ask for information again
 */
export async function shouldAskAgain(
    field: 'name' | 'salary' | 'salary_day' | 'fixed_costs',
    userId: string,
    supabaseClient: any
): Promise<boolean> {
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!profile) return true

    switch (field) {
        case 'name':
            return !profile.name || profile.name.trim().length === 0
        case 'salary':
            return !profile.income_monthly || profile.income_monthly <= 0
        case 'salary_day':
            return !profile.salary_day
        case 'fixed_costs':
            return !profile.fixed_costs || Object.keys(profile.fixed_costs).length === 0
        default:
            return true
    }
}

/**
 * Get LTM summary for AI context
 */
export async function getLTMSummary(
    userId: string,
    supabaseClient: any
): Promise<string> {
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

    const { data: patterns } = await supabaseClient
        .from('user_spending_patterns')
        .select('*')
        .eq('user_id', userId)
        .single()

    return `
USER PROFILE (NEVER ASK AGAIN):
- Name: ${profile?.name || 'NOT SET'}
- Monthly Income: ${profile?.income_monthly ? `${profile.income_monthly} BDT` : 'NOT SET'}
- Salary Day: ${profile?.salary_day ? `Day ${profile.salary_day}` : 'NOT SET'}
- Fixed Costs: ${profile?.fixed_costs ? Object.entries(profile.fixed_costs).map(([k, v]) => `${k}: ${v} BDT`).join(', ') : 'NOT SET'}

PREFERENCES:
- Communication: ${preferences?.communication_style || 'Direct'}
- Goal: ${preferences?.financial_goal || 'Save Money'}
- Sarcasm: ${preferences?.sarcasm_level || 'Medium'}

SPENDING PATTERNS:
- Weekend Spike: ${patterns?.weekend_spike ? 'YES' : 'No'}
- Payday Pattern: ${patterns?.payday_pattern ? 'YES' : 'No'}
- Top Category: ${patterns?.top_category || 'N/A'}
`.trim()
}
