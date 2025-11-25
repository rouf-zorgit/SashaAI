import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { logUsage } from '../_shared/analytics.ts'
import { initSentry, captureException } from '../_shared/sentry.ts'

initSentry()

// Import Fast Mode Systems
import { checkForSpam } from './spam-controller.ts'
import { extractFromMessage } from './memory-extractor.ts'
import { buildCompleteContext } from './memory-injector.ts'
import { generatePersonalityPrompt, enforceSimpleEnglish } from './personality.ts'
import { getSTMContext } from './stm.ts'
import { generateEpisodicContext } from './episodic.ts'
import { getPatternWarnings } from './patterns.ts'
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

    const startTime = performance.now()
    let userIdForLog = 'unknown'

    try {
        logger.time('processChat')
        const body = await req.json()
        const { userId, sessionId = crypto.randomUUID(), message, recentMessages = [] } = body as ChatRequest
        userIdForLog = userId || 'unknown'

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

        logger.info(`Fast Mode Processing`, { userId, sessionId })

        // =====================================================================
        // SYSTEM 7: SPAM/REPETITION CONTROLLER (FAST)
        // =====================================================================
        const spamCheck = await checkForSpam(message, userId, sessionId, recentMessages, supabaseClient)

        if (spamCheck.isSpam && spamCheck.shouldStop) {
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

        // =====================================================================
        // EMOTION DETECTION (FAST - READ ONLY)
        // =====================================================================
        const { emotion: detectedEmotion, intensity: emotionIntensity } = detectEmotion(message)
        // Note: We DO NOT save emotion here. That happens in Deep Mode.

        // =====================================================================
        // SYSTEM 8: MEMORY EXTRACTION (FAST - ENTITIES ONLY)
        // =====================================================================
        const extractedEntities = await extractFromMessage(message, userId, openaiKey, supabaseClient)

        // Note: Deep LTM extraction (salary, costs) moved to Deep Mode.

        // =====================================================================
        // RETRIEVE MEMORY DATA (FAST - READ ONLY)
        // =====================================================================
        const [
            { data: profile },
            { data: preferences },
            { data: spendingPatterns },
            { data: memoryEvents },
            sessionContext,
            { data: recentEpisodes },
            { data: detectedPatterns },
            { data: recurringBills }
        ] = await Promise.all([
            supabaseClient.from('profiles').select('*').eq('id', userId).single(),
            supabaseClient.from('user_preferences').select('*').eq('user_id', userId).single(),
            supabaseClient.from('user_spending_patterns').select('*').eq('user_id', userId).single(),
            supabaseClient.from('memory_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
            getSTMContext(userId, sessionId, supabaseClient),
            supabaseClient.from('episodic_events').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(5),
            supabaseClient.from('spending_patterns').select('*').eq('user_id', userId),
            supabaseClient.from('recurring_payments').select('*').eq('user_id', userId).eq('is_active', true)
        ])

        // =====================================================================
        // SYSTEM 8: MEMORY INJECTION
        // =====================================================================
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

        // Add episodic context (Read only)
        const episodicContext = await generateEpisodicContext(userId, supabaseClient)

        // Add pattern warnings (Read only)
        const patternWarnings = await getPatternWarnings(userId, supabaseClient)

        // =====================================================================
        // SYSTEM 4: PERSONALITY SYSTEM
        // =====================================================================
        const personalityPrompt = generatePersonalityPrompt(detectedEmotion, emotionIntensity, preferences)

        // =====================================================================
        // AI CLASSIFICATION
        // =====================================================================
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

        // =====================================================================
        // HANDLE SPECIAL INTENTS
        // =====================================================================

        // SYSTEM 6: UNDO TRANSACTION (FAST)
        if (classification.intent === 'UNDO' || message.toLowerCase().includes('undo')) {
            const undoResult = await undoLastTransaction(userId, supabaseClient)

            if (undoResult.needsClarification && undoResult.recentTransactions) {
                const txList = undoResult.recentTransactions
                    .map((t, i) => `${i + 1}. ${t.amount} BDT at ${t.merchant || t.category} (${new Date(t.created_at).toLocaleTimeString()})`)
                    .join('\n')

                return new Response(
                    JSON.stringify({
                        mode: 'conversation',
                        reply: `${undoResult.message}\n\n${txList}\n\nTell me the number or describe which one.`,
                        intent: 'clarification',
                        confidence: 1.0
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

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
        const completeSystemPrompt = `
${personalityPrompt}

=== USER MEMORY (USE THIS!) ===
${memoryContext}

${episodicContext}

${patternWarnings}

CRITICAL RULES:
1. ALWAYS check USER MEMORY before responding
2. If user's name is in memory, USE IT - never say "I don't know"
3. If salary is in memory, reference it - never ask again
4. Extract ALL transactions from message (can be multiple)
5. For undo requests, check transaction_undo_stack

USER MESSAGE: "${message}"
INTENT: ${classification.intent}

If this message contains transactions:
- Extract ALL of them
- Return array of transactions

Return JSON:
{
  "reply": "your response using memory (max 2 sentences)",
  "transactions": [
    {
      "amount": number,
      "category": string,
      "merchant": string,
      "type": "expense" | "income",
      "currency": "BDT"
    }
  ]
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
                    { role: 'system', content: completeSystemPrompt },
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
        // SYSTEM 6: TRANSACTION BRAIN (FAST - SAVE ONLY)
        // =====================================================================
        try {
            if (classification.intent === 'TRANSACTION' && aiResponse.transactions && Array.isArray(aiResponse.transactions) && aiResponse.transactions.length > 0) {
                const savedTransactions = []
                const failedTransactions = []

                for (const transaction of aiResponse.transactions) {
                    try {
                        const transactionData: TransactionData = {
                            ...transaction,
                            occurred_at: new Date().toISOString(),
                            source: 'chat' as const,
                            confidence: classification.confidence
                        }

                        const validation = await validateTransaction(transactionData, userId, supabaseClient)

                        if (!validation.isValid) {
                            failedTransactions.push(transaction)
                            continue
                        }

                        if (validation.warnings.length > 0) {
                            // For now, skip transactions with warnings
                            continue
                        }

                        const saveResult = await saveTransaction(transactionData, userId, supabaseClient)

                        if (saveResult.success) {
                            savedTransactions.push(transaction)
                            // Note: Episodic logging moved to Deep Mode
                        } else {
                            failedTransactions.push(transaction)
                        }
                    } catch (txError) {
                        failedTransactions.push(transaction)
                    }
                }

                if (savedTransactions.length > 0) {
                    const summary = savedTransactions.map(t => `${t.amount} BDT (${t.category})`).join(', ')
                    aiResponse.reply = `Done! Saved ${savedTransactions.length} transaction(s): ${summary}.`
                }

                if (failedTransactions.length > 0) {
                    aiResponse.reply += ` ${failedTransactions.length} failed.`
                }
            } else if (classification.intent === 'TRANSACTION') {
                aiResponse.reply = aiResponse.reply || "I understood you want to log a transaction, but I couldn't extract the details. Can you try again?"
            }
        } catch (error) {
            aiResponse.reply = "I had trouble processing that transaction. Can you try again?"
        }

        // =====================================================================
        // RETURN RESPONSE (FAST)
        // =====================================================================
        const response: ChatResponse = {
            mode: classification.intent === 'TRANSACTION' ? 'transaction' : 'conversation',
            reply: aiResponse.reply,
            intent: classification.intent.toLowerCase() as any,
            confidence: classification.confidence,
            transaction: aiResponse.transaction
        }

        logger.timeEnd('processChat')
        const executionTime = performance.now() - startTime

        // Log Usage
        await logUsage({
            function_name: 'processChat',
            user_id: userIdForLog,
            tokens_used: (aiData?.usage?.total_tokens || 0) + (classificationData?.usage?.total_tokens || 0),
            execution_time_ms: Math.round(executionTime),
            status: 'success'
        }, supabaseClient)

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        logger.error('Error in processChat', error)
        captureException(error, { userId: userIdForLog })

        // Log Error Usage
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await logUsage({
            function_name: 'processChat',
            user_id: userIdForLog,
            execution_time_ms: Math.round(performance.now() - startTime),
            status: 'error',
            error_message: error.message
        }, supabaseClient)

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
