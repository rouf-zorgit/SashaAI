import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import optimized AI systems
import { checkForSpam } from './spam-controller.ts'
import { enforceSimpleEnglish } from './personality.ts'
import { extractSalaryInfo, extractFixedCosts, extractSalaryDay, extractName } from './ltm.ts'
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
        console.log(`Message: ${message}`)

        // =====================================================================
        // SPAM CHECK (Fast - local only)
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

        if (spamCheck.isSpam) {
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
        // QUICK UNDO CHECK (Before loading memory)
        // =====================================================================
        if (message.toLowerCase().includes('undo')) {
            console.log(`\n↩️ UNDO REQUEST`)
            const undoResult = await undoLastTransaction(userId, supabaseClient)

            if (undoResult.needsClarification && undoResult.recentTransactions) {
                const txList = undoResult.recentTransactions
                    .map((t, i) => `${i + 1}. ${t.amount} BDT at ${t.merchant || t.category}`)
                    .join('\n')

                return new Response(
                    JSON.stringify({
                        mode: 'conversation',
                        reply: `${undoResult.message}\n\n${txList}\n\nTell me the number.`,
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
        // LOAD ESSENTIAL MEMORY ONLY (Single query)
        // =====================================================================
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('name, income_monthly, salary_day, fixed_costs')
            .eq('id', userId)
            .single()

        // Build minimal memory context
        const memoryContext = `
USER PROFILE (NEVER ASK AGAIN):
- Name: ${profile?.name || 'NOT SET'}
- Monthly Income: ${profile?.income_monthly ? `${profile.income_monthly} BDT` : 'NOT SET'}
- Salary Day: ${profile?.salary_day ? `Day ${profile.salary_day}` : 'NOT SET'}
`.trim()

        // =====================================================================
        // EMOTION DETECTION (Fast - local only)
        // =====================================================================
        const { emotion: detectedEmotion } = detectEmotion(message)

        // Personality adaptation
        let personalityNote = ""
        if (detectedEmotion === 'stressed' || detectedEmotion === 'anxious') {
            personalityNote = "User is stressed - be supportive, NO sarcasm, be gentle."
        } else if (detectedEmotion === 'happy' || detectedEmotion === 'excited') {
            personalityNote = "User is happy - match their energy, be enthusiastic."
        }

        // =====================================================================
        // SINGLE AI CALL (Classification + Response + Transaction Extraction)
        // =====================================================================
        console.log(`\n💬 CALLING AI...`)

        const systemPrompt = `You are Sasha, a friendly financial assistant.

${memoryContext}

${personalityNote}

CRITICAL RULES:
1. ALWAYS check USER PROFILE before responding
2. If user's name is in profile, USE IT - never say "I don't know"
3. If salary is in profile, reference it - never ask again
4. Extract ALL transactions from message (can be multiple)
5. Use simple English, max 2 sentences

TRANSACTION EXTRACTION EXAMPLES:

Example 1: "I bought a pen for 20 tk"
→ 1 transaction: [{amount: 20, category: "stationery", merchant: "pen", type: "expense", currency: "BDT"}]

Example 2: "I bought a pen for 20 tk and transportation for 60 tk and I earned 600 tk by pathao"
→ 3 transactions: [
  {amount: 20, category: "stationery", merchant: "pen", type: "expense", currency: "BDT"},
  {amount: 60, category: "transport", merchant: "transportation", type: "expense", currency: "BDT"},
  {amount: 600, category: "income", merchant: "pathao", type: "income", currency: "BDT"}
]

Example 3: "coffee 50 tk, lunch 200 tk"
→ 2 transactions: [
  {amount: 50, category: "food", merchant: "coffee", type: "expense", currency: "BDT"},
  {amount: 200, category: "food", merchant: "lunch", type: "expense", currency: "BDT"}
]

USER MESSAGE: "${message}"

Analyze and respond. If message contains transactions, extract ALL of them (not just the first one).

Return JSON:
{
  "intent": "conversation" | "transaction" | "undo" | "question",
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
                    { role: 'system', content: systemPrompt },
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
        // BACKGROUND MEMORY EXTRACTION (Don't wait for it)
        // =====================================================================
        // Run in background - don't await
        Promise.all([
            extractName(message, userId, supabaseClient),
            extractSalaryInfo(message, userId, supabaseClient),
            extractFixedCosts(message, userId, supabaseClient),
            extractSalaryDay(message, userId, supabaseClient)
        ]).catch(err => console.error('Background extraction error:', err))

        // =====================================================================
        // TRANSACTION PROCESSING (If any)
        // =====================================================================
        try {
            if (aiResponse.transactions && Array.isArray(aiResponse.transactions) && aiResponse.transactions.length > 0) {
                console.log(`\n💰 PROCESSING ${aiResponse.transactions.length} TRANSACTION(S)...`)

                const savedTransactions = []

                for (const transaction of aiResponse.transactions) {
                    try {
                        const transactionData: TransactionData = {
                            ...transaction,
                            occurred_at: new Date().toISOString(),
                            source: 'chat' as const,
                            confidence: 0.9
                        }

                        // Quick validation
                        if (!transactionData.amount || transactionData.amount <= 0) {
                            continue
                        }

                        // Save transaction
                        const saveResult = await saveTransaction(transactionData, userId, supabaseClient)

                        if (saveResult.success) {
                            console.log(`✅ Transaction saved: ${saveResult.transactionId}`)
                            savedTransactions.push(transaction)
                        }
                    } catch (txError) {
                        console.error(`❌ Error processing transaction:`, txError)
                    }
                }

                // Update reply with results
                if (savedTransactions.length > 0) {
                    const summary = savedTransactions.map(t => `${t.amount} BDT (${t.category})`).join(', ')
                    aiResponse.reply = `Done! Saved ${savedTransactions.length} transaction(s): ${summary}.`
                }
            }
        } catch (error) {
            console.error(`❌ Transaction processing error:`, error)
        }

        // =====================================================================
        // RETURN RESPONSE
        // =====================================================================
        const response: ChatResponse = {
            mode: aiResponse.transactions && aiResponse.transactions.length > 0 ? 'transaction' : 'conversation',
            reply: aiResponse.reply,
            intent: aiResponse.intent || 'conversation',
            confidence: 0.9
        }

        console.log(`✅ Response: ${response.reply}`)

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Error:', error)
        return new Response(
            JSON.stringify({
                mode: 'conversation',
                reply: 'Something went wrong on my side. Could you try again in a moment?',
                intent: 'error',
                confidence: 1.0
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
