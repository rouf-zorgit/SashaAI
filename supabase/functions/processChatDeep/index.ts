import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { logUsage } from '../_shared/analytics.ts'
import { initSentry, captureException } from '../_shared/sentry.ts'

initSentry()

// Import Deep Learning Systems
import { extractSalaryInfo, extractFixedCosts, extractSalaryDay, extractName } from './ltm.ts'
import { trackTopic, trackCorrection } from './stm.ts'
import { logEpisode } from './episodic.ts'
import { runPatternAnalysis } from './patterns.ts'
import { detectEmotion } from './utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTime = performance.now()
    let userIdForLog = 'unknown'

    try {
        logger.time('processChatDeep')
        const body = await req.json()

        // Handle Supabase Database Webhook payload
        // type: 'INSERT', table: 'messages', record: { ... }
        const { type, table, record } = body

        if (type !== 'INSERT' || table !== 'messages') {
            return new Response('Not an INSERT message event', { status: 200 })
        }

        // We only trigger deep learning after the AI responds, so we have the full pair
        if (record.role !== 'assistant') {
            return new Response('Skipping user message (waiting for assistant reply)', { status: 200 })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const aiMessage = record
        const userId = aiMessage.user_id
        const sessionId = aiMessage.session_id
        userIdForLog = userId || 'unknown'

        logger.info(`Deep Learning Mode`, { userId, sessionId })

        // 1. Fetch the preceding User Message
        const { data: userMessages } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .eq('role', 'user')
            .lt('created_at', aiMessage.created_at)
            .order('created_at', { ascending: false })
            .limit(1)

        if (!userMessages || userMessages.length === 0) {
            console.log('❌ No preceding user message found')
            return new Response('No context found', { status: 200 })
        }

        const userMessage = userMessages[0]
        const userContent = userMessage.content
        const aiContent = aiMessage.content

        console.log(`User said: "${userContent.substring(0, 50)}..."`)
        console.log(`AI replied: "${aiContent.substring(0, 50)}..."`)

        // =====================================================================
        // TASK 1: EMOTIONAL ANALYSIS & SAVING
        // =====================================================================
        console.log(`\n❤️ ANALYZING EMOTIONS...`)
        const { emotion, intensity } = detectEmotion(userContent)
        if (emotion !== 'neutral') {
            await supabaseClient.from('user_emotional_state').insert({
                user_id: userId,
                emotion: emotion,
                intensity: intensity,
                context: userContent.substring(0, 200)
            })
            console.log(`✅ Saved emotion: ${emotion}`)
        }

        // =====================================================================
        // TASK 2: DEEP LTM EXTRACTION
        // =====================================================================
        console.log(`\n🧠 DEEP LTM EXTRACTION...`)
        await Promise.all([
            extractName(userContent, userId, supabaseClient),
            extractSalaryInfo(userContent, userId, supabaseClient),
            extractFixedCosts(userContent, userId, supabaseClient),
            extractSalaryDay(userContent, userId, supabaseClient)
        ])
        console.log(`✅ LTM extraction complete`)

        // =====================================================================
        // TASK 3: STM UPDATES (Topic Tracking)
        // =====================================================================
        console.log(`\n📝 UPDATING STM...`)
        if (userContent.toLowerCase().includes('want to talk about') || userContent.toLowerCase().includes('let\'s discuss')) {
            const topic = userContent.split(/want to talk about|let's discuss/i)[1]?.trim()
            if (topic) {
                await trackTopic(topic, userId, sessionId, supabaseClient)
                console.log(`✅ Tracked topic: ${topic}`)
            }
        }

        // =====================================================================
        // TASK 4: EPISODIC MEMORY LOGGING
        // =====================================================================
        console.log(`\n📖 LOGGING EPISODE...`)
        // We log the interaction pair
        await logEpisode(
            userId,
            'interaction',
            `User: ${userContent} | AI: ${aiContent}`,
            { userMessageId: userMessage.id, aiMessageId: aiMessage.id },
            3, // Standard importance
            supabaseClient
        )
        console.log(`✅ Episode logged`)

        // =====================================================================
        // TASK 5: PATTERN RECOGNITION
        // =====================================================================
        console.log(`\n📉 RUNNING PATTERN ANALYSIS...`)
        await runPatternAnalysis(userId, supabaseClient)
        console.log(`✅ Pattern analysis complete`)

        logger.timeEnd('processChatDeep')
        const executionTime = performance.now() - startTime

        // Log Usage
        await logUsage({
            function_name: 'processChatDeep',
            user_id: userIdForLog,
            execution_time_ms: Math.round(executionTime),
            status: 'success'
        }, supabaseClient)

        return new Response(
            JSON.stringify({ success: true, mode: 'deep_learning' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        logger.error('Deep Learning Error', error)
        captureException(error, { userId: userIdForLog })

        // Log Error Usage
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await logUsage({
            function_name: 'processChatDeep',
            user_id: userIdForLog,
            execution_time_ms: Math.round(performance.now() - startTime),
            status: 'error',
            error_message: error.message
        }, supabaseClient)

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
