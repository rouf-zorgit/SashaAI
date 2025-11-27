// ============================================================================
// SHORT-TERM MEMORY (STM) - System 2
// ============================================================================
// Tracks conversation context within a session
// Remembers topics, corrections, and pending clarifications
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Track conversation topic
 */
export async function trackTopic(
    topic: string,
    userId: string,
    sessionId: string,
    supabaseClient: any
): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

    await supabaseClient
        .from('conversation_context')
        .insert({
            user_id: userId,
            session_id: sessionId,
            context_type: 'topic',
            key: 'current_topic',
            value: topic,
            expires_at: expiresAt
        })

    console.log(`📌 Tracked topic: ${topic}`)
}

/**
 * Track user correction
 */
export async function trackCorrection(
    field: string,
    oldValue: string,
    newValue: string,
    userId: string,
    sessionId: string,
    supabaseClient: any
): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await supabaseClient
        .from('conversation_context')
        .insert({
            user_id: userId,
            session_id: sessionId,
            context_type: 'correction',
            key: field,
            value: `${oldValue} → ${newValue}`,
            expires_at: expiresAt
        })

    console.log(`✏️ Tracked correction: ${field}`)
}

/**
 * Track pending clarification
 */
export async function trackClarification(
    question: string,
    userId: string,
    sessionId: string,
    supabaseClient: any
): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await supabaseClient
        .from('conversation_context')
        .insert({
            user_id: userId,
            session_id: sessionId,
            context_type: 'clarification',
            key: 'pending_question',
            value: question,
            expires_at: expiresAt
        })

    console.log(`❓ Tracked clarification: ${question}`)
}

/**
 * Get STM context for session
 */
export async function getSTMContext(
    userId: string,
    sessionId: string,
    supabaseClient: any
): Promise<any[]> {
    const { data } = await supabaseClient
        .from('conversation_context')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

    return data || []
}

/**
 * Cleanup expired STM
 */
export async function cleanupExpiredSTM(supabaseClient: any): Promise<void> {
    await supabaseClient
        .from('conversation_context')
        .delete()
        .lt('expires_at', new Date().toISOString())

    console.log('🧹 Cleaned up expired STM')
}
