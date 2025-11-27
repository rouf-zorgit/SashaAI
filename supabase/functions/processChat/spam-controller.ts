// ============================================================================
// SPAM CONTROLLER - System 7
// ============================================================================
// Detects spam, loops, and repetitive messages
// Escalates irritation and stops responding after 3 spam messages
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface SpamCheckResult {
    isSpam: boolean
    repetitionCount: number
    response: string | null
    shouldStop: boolean
}

/**
 * Generate hash for message to detect duplicates
 * Simple string hash function (no external dependencies)
 */
function hashMessage(message: string): string {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ')
    let hash = 0
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
}

/**
 * Detect if message is a loop (same message repeated)
 */
export async function detectLoop(
    message: string,
    userId: string,
    sessionId: string,
    supabaseClient: any
): Promise<SpamCheckResult> {
    const messageHash = hashMessage(message)

    // Check if this message hash exists in spam tracker
    const { data: existing } = await supabaseClient
        .from('spam_tracker')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .eq('message_hash', messageHash)
        .single()

    if (existing) {
        // Update repetition count
        const newCount = existing.repetition_count + 1

        await supabaseClient
            .from('spam_tracker')
            .update({
                repetition_count: newCount,
                last_seen: new Date().toISOString()
            })
            .eq('id', existing.id)

        return {
            isSpam: true,
            repetitionCount: newCount,
            response: generateSpamResponse(newCount, message),
            shouldStop: newCount >= 3
        }
    } else {
        // First time seeing this message
        await supabaseClient
            .from('spam_tracker')
            .insert({
                user_id: userId,
                session_id: sessionId,
                message_hash: messageHash,
                repetition_count: 1,
                last_seen: new Date().toISOString()
            })

        return {
            isSpam: false,
            repetitionCount: 1,
            response: null,
            shouldStop: false
        }
    }
}

/**
 * Detect if user is asking the same question repeatedly
 */
export function detectRepetition(
    message: string,
    recentMessages: any[]
): boolean {
    if (!recentMessages || recentMessages.length < 2) {
        return false
    }

    const normalized = message.toLowerCase().trim()
    const recentUserMessages = recentMessages
        .filter(m => m.role === 'user')
        .slice(-3)
        .map(m => m.content.toLowerCase().trim())

    // Check if message is very similar to recent messages
    return recentUserMessages.some(recent => {
        const similarity = calculateSimilarity(normalized, recent)
        return similarity > 0.8
    })
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }

    return matrix[str2.length][str1.length]
}

/**
 * Generate escalating spam response
 */
function generateSpamResponse(count: number, _message: string): string {
    switch (count) {
        case 2:
            return "You just said that. What's going on?"
        case 3:
            return "Okay, you're repeating yourself. I'm not responding to this anymore."
        default:
            return "I'm pausing because we're going in circles. Let's talk about something else."
    }
}

/**
 * Check if should stop responding
 */
export function shouldStopResponding(repetitionCount: number): boolean {
    return repetitionCount >= 3
}

/**
 * Main spam check function
 */
export async function checkForSpam(
    message: string,
    userId: string,
    sessionId: string,
    recentMessages: any[],
    supabaseClient: any
): Promise<SpamCheckResult> {
    // Check for exact loops
    const loopResult = await detectLoop(message, userId, sessionId, supabaseClient)

    if (loopResult.isSpam) {
        return loopResult
    }

    // Check for similar repetitions
    const isRepetitive = detectRepetition(message, recentMessages)

    if (isRepetitive) {
        return {
            isSpam: true,
            repetitionCount: 2,
            response: "You already asked something similar. Can you clarify what you need?",
            shouldStop: false
        }
    }

    return {
        isSpam: false,
        repetitionCount: 0,
        response: null,
        shouldStop: false
    }
}
