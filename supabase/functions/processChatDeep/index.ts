import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { logUsage } from '../_shared/analytics.ts'
import { initSentry, captureException } from '../_shared/sentry.ts'

initSentry()

// Import Deep Learning Systems
import { extractFromMessage } from '../processChat/memory-extractor.ts'
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
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
        await extractFromMessage(userContent, userId, anthropicKey, supabaseClient)
        console.log(`✅ LTM extraction complete`)

        // =====================================================================
        // TASK 3: STM UPDATES (Topic & Correction Tracking)
        // =====================================================================
        console.log(`\n📝 UPDATING STM...`)

        // Use AI to detect topic changes and corrections
        if (anthropicKey) {
            try {
                const stmAnalysisPrompt = `Analyze this conversation pair for STM tracking:

User: "${userContent}"
AI: "${aiContent}"

Return JSON:
{
  "topicChange": "new topic name" or null,
  "isCorrection": true/false,
  "correctionField": "field name" or null,
  "correctionOldValue": "old value" or null,
  "correctionNewValue": "new value" or null
}

Examples:
- "Let's talk about savings" → topicChange: "savings"
- "No, I spent 500 not 50" → isCorrection: true, correctionField: "amount", correctionOldValue: "50", correctionNewValue: "500"
- Normal chat → all null/false

IMPORTANT: Return only valid JSON, no other text.`

                const stmResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': anthropicKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20240620',
                        max_tokens: 512,
                        system: 'You are a precise STM analyzer. Return only valid JSON.',
                        messages: [
                            { role: 'user', content: stmAnalysisPrompt }
                        ],
                        temperature: 0.1
                    })
                })

                const stmData = await stmResponse.json()
                const analysis = JSON.parse(stmData.content[0].text)

                // Track topic change
                if (analysis.topicChange) {
                    await trackTopic(analysis.topicChange, userId, sessionId, supabaseClient)
                    console.log(`✅ Tracked topic: ${analysis.topicChange}`)
                }

                // Track correction
                if (analysis.isCorrection && analysis.correctionField) {
                    await trackCorrection(
                        analysis.correctionField,
                        analysis.correctionOldValue || 'unknown',
                        analysis.correctionNewValue || 'unknown',
                        userId,
                        sessionId,
                        supabaseClient
                    )
                    console.log(`✅ Tracked correction: ${analysis.correctionField}`)
                }
            } catch (error) {
                console.error('STM analysis failed:', error)
            }
        }
        console.log(`✅ STM update complete`)

        // =====================================================================
        // TASK 4: EPISODIC MEMORY LOGGING
        // =====================================================================
        console.log(`\n📖 LOGGING EPISODE...`)

        // Generate semantic summary instead of raw text
        let episodeSummary = `User: ${userContent.substring(0, 50)}... | AI: ${aiContent.substring(0, 50)}...`

        if (anthropicKey) {
            try {
                const summaryPrompt = `Summarize this conversation in 1 short sentence (max 10 words):

User: "${userContent}"
AI: "${aiContent}"

Examples:
- "Discussed weekend spending habits"
- "Logged coffee expense of 850 BDT"
- "Asked about savings goals"
- "Corrected transaction amount"

Return ONLY the summary, nothing else.`

                const summaryResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': anthropicKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20240620',
                        max_tokens: 50,
                        system: 'You are a concise summarizer. Return only the summary.',
                        messages: [
                            { role: 'user', content: summaryPrompt }
                        ],
                        temperature: 0.3
                    })
                })

                const summaryData = await summaryResponse.json()
                episodeSummary = summaryData.content[0].text.trim()
            } catch (error) {
                console.error('Episode summary generation failed:', error)
            }
        }

        // Log the interaction with semantic summary
        await logEpisode(
            userId,
            'interaction',
            episodeSummary,
            { userMessageId: userMessage.id, aiMessageId: aiMessage.id },
            3, // Standard importance
            supabaseClient
        )
        console.log(`✅ Episode logged: ${episodeSummary}`)

        // =====================================================================
        // TASK 5: PATTERN RECOGNITION (Throttled)
        // =====================================================================
        console.log(`\n📉 CHECKING PATTERN ANALYSIS...`)

        // Check when pattern analysis was last run
        const { data: preferences } = await supabaseClient
            .from('user_preferences')
            .select('last_pattern_analysis')
            .eq('user_id', userId)
            .single()

        const lastAnalysis = preferences?.last_pattern_analysis
        const now = new Date()
        const shouldRunAnalysis = !lastAnalysis ||
            (now.getTime() - new Date(lastAnalysis).getTime()) > 24 * 60 * 60 * 1000 // 24 hours

        if (shouldRunAnalysis) {
            console.log(`Running pattern analysis...`)
            await runPatternAnalysis(userId, supabaseClient)

            // Update last run timestamp
            await supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    last_pattern_analysis: now.toISOString()
                })

            console.log(`✅ Pattern analysis complete`)
        } else {
            const hoursSinceLastRun = Math.round((now.getTime() - new Date(lastAnalysis).getTime()) / (1000 * 60 * 60))
            console.log(`⏭️ Skipping pattern analysis (last run ${hoursSinceLastRun}h ago)`)
        }

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
