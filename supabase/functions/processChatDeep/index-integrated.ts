import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import all 8 AI systems
import { checkForSpam } from './spam-controller.ts'
import { extractFromMessage } from './memory-extractor.ts'
import { buildCompleteContext } from './memory-injector.ts'
import { generatePersonalityPrompt, enforceSimpleEnglish } from './personality.ts'
import { extractSalaryInfo, extractFixedCosts, extractSalaryDay } from './ltm.ts'
import { trackTopic, trackCorrection, getSTMContext } from './stm.ts'
import { generateEpisodicContext, logEpisode } from './episodic.ts'
import { runPatternAnalysis, getPatternWarnings } from './patterns.ts'
import { validateTransaction, saveTransaction, undoLastTransaction, type TransactionData } from './transaction-brain.ts'
import { detectEmotion } from './utils.ts'
import type { ChatRequest, ChatResponse } from './types.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { userId, sessionId = crypto.randomUUID(), message, recentMessages = [] } = body as ChatRequest

        if (!userId || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`\n========== PROCESSING MESSAGE ==========`)
        console.log(`User: ${userId}`)
        console.log(`Session: ${sessionId}`)
        console.log(`Message: ${message}`)

        // =====================================================================
        // SYSTEM 7: SPAM/REPETITION CONTROLLER
        // =====================================================================
        const spamCheck = await checkForSpam(message, userId, sessionId, recentMessages, supabaseClient)

        if (spamCheck.isSpam && spamCheck.shouldStop) {
            console.log(`🚫 SPAM DETECTED: Stopping response (count: ${spamCheck.repetitionCount})`)
            return new Response(
                JSON.stringify({
                    mode: 'conversation',
                    reply: spamCheck.response || '...',
                    intent: 'spam',
                    confidence: 1.0
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (spamCheck.isSpam) {
            console.log(`⚠️ SPAM WARNING: Escalating (count: ${spamCheck.repetitionCount})`)
            return new Response(
                JSON.stringify({
                    mode: 'conversation',
                    reply: spamCheck.response,
                    intent: 'spam_warning',
                    confidence: 1.0
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // =====================================================================
        // EMOTION DETECTION
        // =====================================================================
        const { emotion: detectedEmotion, intensity: emotionIntensity } = detectEmotion(message)
        console.log(`😊 Emotion: ${detectedEmotion} (intensity: ${emotionIntensity})`)

        // Save emotional state
        if (detectedEmotion !== 'neutral') {
            try {
                await supabaseClient.from('user_emotional_state').insert({
                    user_id: userId,
                    emotion: detectedEmotion,
                    intensity: emotionIntensity,
                    context: message.substring(0, 200)
                })
            } catch (error) {
                console.error('Failed to save emotional state:', error)
            }
        }

        // =====================================================================
        // SYSTEM 8: MEMORY EXTRACTION
        // =====================================================================
        console.log(`\n🧠 EXTRACTING ENTITIES...`)
        const extractedEntities = await extractFromMessage(message, userId, openaiKey, supabaseClient)
        console.log(`✅ Extracted ${extractedEntities.length} entities`)

        // Also try specific LTM extractions
        await extractSalaryInfo(message, userId, supabaseClient)
        await extractFixedCosts(message, userId, supabaseClient)
        await extractSalaryDay(message, userId, supabaseClient)

        // =====================================================================
        // RETRIEVE ALL MEMORY DATA
        // =====================================================================
        console.log(`\n📚 RETRIEVING MEMORIES...`)

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

        const { data: spendingPatterns } = await supabaseClient
            .from('user_spending_patterns')
            .select('*')
            .eq('user_id', userId)
            .single()

        const { data: memoryEvents } = await supabaseClient
            .from('memory_events')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)

        const sessionContext = await getSTMContext(userId, sessionId, supabaseClient)

        const { data: recentEpisodes } = await supabaseClient
            .from('episodic_events')
            .select('*')
            .eq('user_id', userId)
            .order('occurred_at', { ascending: false })
            .limit(5)

        const { data: detectedPatterns } = await supabaseClient
            .from('spending_patterns')
            .select('*')
            .eq('user_id', userId)

        const { data: recurringBills } = await supabaseClient
            .from('recurring_payments')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        // =====================================================================
        // SYSTEM 8: MEMORY INJECTION
        // =====================================================================
        console.log(`\n💉 BUILDING MEMORY CONTEXT...`)
        const memoryContext = buildCompleteContext({
            profile,
            preferences,
            spendingPatterns,
            memoryEvents: memoryEvents || [],
            sessionContext,
            recentEpisodes: recentEpisodes || [],
            detectedPatterns: detectedPatterns || [],
            recurringBills: recurringBills || []
        })

        // Add episodic context
        const episodicContext = await generateEpisodicContext(userId, supabaseClient)

        // Add pattern warnings
        const patternWarnings = await getPatternWarnings(userId, supabaseClient)

        // =====================================================================
        // SYSTEM 4: PERSONALITY SYSTEM
        // =====================================================================
        console.log(`\n🎭 GENERATING PERSONALITY PROMPT...`)
        const personalityPrompt = generatePersonalityPrompt(detectedEmotion, emotionIntensity, preferences)

        // =====================================================================
        // AI CLASSIFICATION
        // =====================================================================
        console.log(`\n🤖 CLASSIFYING INTENT...`)

        const classificationPrompt = `
${memoryContext}

${episodicContext}

${patternWarnings}

USER MESSAGE: "${message}"

Classify this message and extract entities.

Return JSON:
{
  "intent": "TRANSACTION" | "UNDO" | "SMALL_TALK" | "QUERY" | "GOAL",
  "confidence": 0.0-1.0,
  "entities": {
    "amount": number (if transaction),
    "category": string (if transaction),
    "merchant": string (if transaction),
    "type": "expense" | "income" (if transaction)
  }
}
`

        const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a precise intent classifier. Return only valid JSON.' },
                    { role: 'user', content: classificationPrompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        })

        const classificationData = await classificationResponse.json()
        const classification = JSON.parse(classificationData.choices[0].message.content)

        console.log(`✅ Intent: ${classification.intent} (confidence: ${classification.confidence})`)

        // =====================================================================
        // HANDLE SPECIAL INTENTS
        // =====================================================================

        // SYSTEM 6: UNDO TRANSACTION
        if (classification.intent === 'UNDO' || message.toLowerCase().includes('undo')) {
            console.log(`\n↩️ UNDO REQUEST`)
            const undoResult = await undoLastTransaction(userId, supabaseClient)

            return new Response(
                JSON.stringify({
                    mode: 'conversation',
                    reply: undoResult.message,
                    intent: 'undo',
                    confidence: 1.0
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // =====================================================================
        // GENERATE AI RESPONSE
        // =====================================================================
        console.log(`\n💬 GENERATING RESPONSE...`)

        const finalPrompt = `
${personalityPrompt}

${memoryContext}

${episodicContext}

${patternWarnings}

USER MESSAGE: "${message}"
INTENT: ${classification.intent}

Generate a response following your personality. If this is a transaction, extract details and confirm.

Return JSON:
{
  "reply": "your response (max 2 sentences)",
  "transaction": {
    "amount": number,
    "category": string,
    "merchant": string,
    "type": "expense" | "income",
    "currency": "BDT"
  } (only if TRANSACTION intent)
}
`

        const responseData = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: personalityPrompt },
                    ...recentMessages.slice(-3),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        })

        const aiData = await responseData.json()
        const aiResponse = JSON.parse(aiData.choices[0].message.content)

        // Enforce simple English
        aiResponse.reply = enforceSimpleEnglish(aiResponse.reply)

        // =====================================================================
        // SYSTEM 6: TRANSACTION BRAIN
        // =====================================================================
        if (classification.intent === 'TRANSACTION' && aiResponse.transaction) {
            console.log(`\n💰 PROCESSING TRANSACTION...`)

            const transactionData: TransactionData = {
                ...aiResponse.transaction,
                occurred_at: new Date().toISOString(),
                source: 'chat' as const,
                confidence: classification.confidence
            }

            // Validate
            const validation = await validateTransaction(transactionData, userId, supabaseClient)

            if (!validation.isValid) {
                console.log(`❌ Validation failed: ${validation.errors.join(', ')}`)
                return new Response(
                    JSON.stringify({
                        mode: 'conversation',
                        reply: `Validation error: ${validation.errors.join(', ')}`,
                        intent: 'error',
                        confidence: 1.0
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (validation.warnings.length > 0) {
                console.log(`⚠️ Warnings: ${validation.warnings.join(', ')}`)
                aiResponse.reply = `${validation.warnings[0]} Confirm?`
            } else {
                // Save transaction
                const saveResult = await saveTransaction(transactionData, userId, supabaseClient)

                if (saveResult.success) {
                    console.log(`✅ Transaction saved: ${saveResult.transactionId}`)

                    // Log episodic event
                    await logEpisode(
                        userId,
                        'transaction',
                        `Spent ${transactionData.amount} BDT on ${transactionData.category}`,
                        transactionData,
                        transactionData.amount > 5000 ? 7 : 5,
                        supabaseClient
                    )
                } else {
                    console.log(`❌ Save failed: ${saveResult.error}`)
                    aiResponse.reply = `Failed to save: ${saveResult.error}`
                }
            }
        }

        // =====================================================================
        // SYSTEM 2: TRACK STM
        // =====================================================================
        if (message.toLowerCase().includes('want to talk about') || message.toLowerCase().includes('let\'s discuss')) {
            const topic = message.split(/want to talk about|let's discuss/i)[1]?.trim()
            if (topic) {
                await trackTopic(topic, userId, sessionId, supabaseClient)
            }
        }

        // =====================================================================
        // RETURN RESPONSE
        // =====================================================================
        console.log(`\n✅ RESPONSE GENERATED`)
        console.log(`Reply: ${aiResponse.reply}`)
        console.log(`========================================\n`)

        const response: ChatResponse = {
            mode: classification.intent === 'TRANSACTION' ? 'transaction' : 'conversation',
            reply: aiResponse.reply,
            intent: classification.intent.toLowerCase() as any,
            confidence: classification.confidence,
            transaction: aiResponse.transaction
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ ERROR:', error)
        return new Response(
            JSON.stringify({
                mode: 'conversation',
                reply: `Something went wrong. ${error.message}`,
                intent: 'error',
                confidence: 0
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
