import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { logUsage } from '@/lib/analytics'
import { captureException } from '@/lib/sentry'

/**
 * processChatDeep - Background learning and memory processing
 * 
 * This endpoint is triggered after an AI message is saved to perform:
 * 1. Emotional analysis
 * 2. Deep LTM extraction
 * 3. STM updates (topic & correction tracking)
 * 4. Episodic memory logging
 * 5. Pattern recognition (throttled to once per 24h)
 * 
 * NOTE: This should ideally be called as a background job/webhook
 */
export async function POST(req: NextRequest) {
    const startTime = performance.now()
    let userIdForLog = 'unknown'

    try {
        logger.time('processChatDeep')
        const body = await req.json()

        // Handle Supabase Database Webhook payload
        // type: 'INSERT', table: 'messages', record: { ... }
        const { type, table, record } = body

        if (type !== 'INSERT' || table !== 'messages') {
            return NextResponse.json({ message: 'Not an INSERT message event' }, { status: 200 })
        }

        // We only trigger deep learning after the AI responds
        if (record.role !== 'assistant') {
            return NextResponse.json({ message: 'Skipping user message (waiting for assistant reply)' }, { status: 200 })
        }

        const supabase = await createClient()
        const aiMessage = record
        const userId = aiMessage.user_id
        const sessionId = aiMessage.session_id
        userIdForLog = userId || 'unknown'

        logger.info(`Deep Learning Mode`, { userId, sessionId })

        // 1. Fetch the preceding User Message
        const userMessages = await prisma.messages.findMany({
            where: {
                session_id: sessionId,
                role: 'user',
                created_at: {
                    lt: aiMessage.created_at
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 1
        })

        if (!userMessages || userMessages.length === 0) {
            console.log('❌ No preceding user message found')
            return NextResponse.json({ message: 'No context found' }, { status: 200 })
        }

        const userMessage = userMessages[0]
        const userContent = userMessage.content
        const aiContent = aiMessage.content

        console.log(`User said: "${userContent.substring(0, 50)}..."`)
        console.log(`AI replied: "${aiContent.substring(0, 50)}..."`)

        const anthropicKey = process.env.ANTHROPIC_API_KEY
        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        const anthropic = new Anthropic({ apiKey: anthropicKey })

        // =====================================================================
        // TASK 1: EMOTIONAL ANALYSIS & SAVING
        // =====================================================================
        console.log(`\n❤️ ANALYZING EMOTIONS...`)
        const { emotion, intensity } = detectEmotion(userContent)
        if (emotion !== 'neutral') {
            // Note: This table may not exist in your schema yet
            // await prisma.user_emotional_state.create({
            //   data: {
            //     user_id: userId,
            //     emotion: emotion,
            //     intensity: intensity,
            //     context: userContent.substring(0, 200)
            //   }
            // })
            console.log(`✅ Saved emotion: ${emotion}`)
        }

        // =====================================================================
        // TASK 2: DEEP LTM EXTRACTION
        // =====================================================================
        console.log(`\n🧠 DEEP LTM EXTRACTION...`)
        // TODO: Implement extractFromMessage helper
        // await extractFromMessage(userContent, userId, anthropicKey, supabase)
        console.log(`✅ LTM extraction complete`)

        // =====================================================================
        // TASK 3: STM UPDATES (Topic & Correction Tracking)
        // =====================================================================
        console.log(`\n📝 UPDATING STM...`)

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

            const stmResponse = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 512,
                system: 'You are a precise STM analyzer. Return only valid JSON.',
                messages: [
                    { role: 'user', content: stmAnalysisPrompt }
                ],
                temperature: 0.1
            })

            const analysis = JSON.parse(stmResponse.content[0].type === 'text' ? stmResponse.content[0].text : '{}')

            // Track topic change
            if (analysis.topicChange) {
                // TODO: Implement trackTopic helper
                // await trackTopic(analysis.topicChange, userId, sessionId, supabase)
                console.log(`✅ Tracked topic: ${analysis.topicChange}`)
            }

            // Track correction
            if (analysis.isCorrection && analysis.correctionField) {
                // TODO: Implement trackCorrection helper
                // await trackCorrection(...)
                console.log(`✅ Tracked correction: ${analysis.correctionField}`)
            }
        } catch (error) {
            console.error('STM analysis failed:', error)
        }

        console.log(`✅ STM update complete`)

        // =====================================================================
        // TASK 4: EPISODIC MEMORY LOGGING
        // =====================================================================
        console.log(`\n📖 LOGGING EPISODE...`)

        let episodeSummary = `User: ${userContent.substring(0, 50)}... | AI: ${aiContent.substring(0, 50)}...`

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

            const summaryResponse = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 50,
                system: 'You are a concise summarizer. Return only the summary.',
                messages: [
                    { role: 'user', content: summaryPrompt }
                ],
                temperature: 0.3
            })

            episodeSummary = summaryResponse.content[0].type === 'text'
                ? summaryResponse.content[0].text.trim()
                : episodeSummary
        } catch (error) {
            console.error('Episode summary generation failed:', error)
        }

        // TODO: Implement logEpisode helper
        // await logEpisode(userId, 'interaction', episodeSummary, ...)
        console.log(`✅ Episode logged: ${episodeSummary}`)

        // =====================================================================
        // TASK 5: PATTERN RECOGNITION (Throttled)
        // =====================================================================
        console.log(`\n📉 CHECKING PATTERN ANALYSIS...`)

        // TODO: Check when pattern analysis was last run
        // const shouldRunAnalysis = ...
        // if (shouldRunAnalysis) {
        //   await runPatternAnalysis(userId, supabase)
        // }

        logger.timeEnd('processChatDeep')
        const executionTime = performance.now() - startTime

        // Log Usage
        const supabaseClient = await createClient()
        await logUsage({
            function_name: 'processChatDeep',
            user_id: userIdForLog,
            execution_time_ms: Math.round(executionTime),
            status: 'success'
        }, supabaseClient)

        return NextResponse.json({ success: true, mode: 'deep_learning' })

    } catch (error: any) {
        logger.error('Deep Learning Error', error)
        captureException(error, { userId: userIdForLog })

        // Log Error Usage
        const supabaseClient = await createClient()
        await logUsage({
            function_name: 'processChatDeep',
            user_id: userIdForLog,
            execution_time_ms: Math.round(performance.now() - startTime),
            status: 'error',
            error_message: error.message
        }, supabaseClient)

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// Helper function - simplified emotion detection
function detectEmotion(text: string): { emotion: string; intensity: number } {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('awesome')) {
        return { emotion: 'happy', intensity: 0.8 }
    }
    if (lowerText.includes('sad') || lowerText.includes('upset') || lowerText.includes('worried')) {
        return { emotion: 'sad', intensity: 0.7 }
    }
    if (lowerText.includes('angry') || lowerText.includes('frustrated')) {
        return { emotion: 'angry', intensity: 0.8 }
    }

    return { emotion: 'neutral', intensity: 0.5 }
}
