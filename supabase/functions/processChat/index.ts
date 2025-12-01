import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAuthenticatedUserId } from '../_shared/auth.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
    userId: string  // ⚠️ IGNORED - we validate from JWT instead
    sessionId: string
    message: string
    profile: {
        full_name?: string
        monthly_salary?: number
        currency?: string
        primary_goal?: string
        communication_style?: string
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTime = performance.now()

    try {
        // ✅ SECURITY FIX: Validate user from JWT token, not request body
        const authenticatedUserId = await getAuthenticatedUserId(req)
        if (!authenticatedUserId) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized - Invalid or missing authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { sessionId, message, profile } = await req.json() as ChatRequest
        // ⚠️ NOTE: userId from request body is IGNORED - we use authenticatedUserId from JWT

        if (!message || !sessionId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: sessionId, message' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }


        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // =====================================================================
        // STEP 1: FETCH USER CONTEXT (BATCHED - 10x FASTER!)
        // =====================================================================
        console.log('🚀 Fetching batched user context...')
        const contextStart = performance.now()

        // Single query to get ALL user data (using validated userId from JWT)
        const { data: userContext } = await supabase
            .rpc('get_user_context', { p_user_id: authenticatedUserId })

        const contextTime = performance.now() - contextStart
        console.log(`✅ User context fetched in ${Math.round(contextTime)}ms`)

        // Fetch session messages separately (still fast with index)
        const { data: sessionMessages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(10)

        // Build conversation history
        const conversationHistory = (sessionMessages || [])
            .reverse()
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }))

        // Extract data from batched context
        const userProfile = userContext?.profile || {}
        const userWallets = userContext?.wallets || []
        const recentTransactions = userContext?.recent_transactions || []
        const activeLoans = userContext?.active_loans || []

        const monthlySpending = userContext?.monthly_spending || {}
        const notifications = userContext?.notifications || { unread: 0 }

        // Build today's spending summary from recent transactions
        const todayStart = new Date().toISOString().split('T')[0]
        const todaysTransactions = recentTransactions.filter((t: any) =>
            t.created_at >= todayStart
        )
        const todaySpending = todaysTransactions
            .map((t: any) => `${t.amount} ${userProfile.currency || 'BDT'} at ${t.description || t.category}`)
            .join(', ')

        // Calculate total wallet balance
        const totalBalance = userWallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0)

        // =====================================================================
        // STEP 2: BUILD ENHANCED SYSTEM PROMPT WITH BATCHED DATA
        // =====================================================================
        const userName = userProfile?.name || profile?.full_name || 'there'
        const salary = userProfile?.monthly_salary || profile?.monthly_salary
        const salaryText = salary ? `${salary} ${userProfile?.currency || profile?.currency || 'BDT'}` : 'not set'
        const goal = profile?.primary_goal || 'general financial wellness'
        const style = profile?.communication_style || 'friendly'

        // Build wallet summary
        const walletSummary = userWallets.length > 0
            ? userWallets.map((w: any) => `${w.name}: ${w.balance} ${w.currency}`).join(', ')
            : 'No wallets set up'

        // Build spending summary
        const spendingCategories = Object.entries(monthlySpending)
            .map(([cat, amount]) => `${cat}: ${amount}`)
            .join(', ')

        const systemPrompt = `You are Sasha, a ${style} financial assistant.

USER PROFILE:
- Name: ${userName}
- Monthly Income: ${salaryText}
- Primary Goal: ${goal}
- Total Balance: ${totalBalance} ${userProfile?.currency || 'BDT'}
- Active Wallets: ${walletSummary}

${todaySpending ? `TODAY'S SPENDING:\n${todaySpending}` : ''}

${spendingCategories ? `THIS MONTH'S SPENDING:\n${spendingCategories}` : ''}

${activeLoans.length > 0 ? `ACTIVE LOANS: ${activeLoans.length} loan(s)` : ''}

${notifications.unread > 0 ? `UNREAD NOTIFICATIONS: ${notifications.unread}` : ''}

PERSONALITY:
${style === 'friendly' ? '- Be warm, encouraging, and conversational' : ''}
${style === 'formal' ? '- Be professional, concise, and direct' : ''}
${style === 'simple' ? '- Use very simple language, like explaining to a grandmother' : ''}

CORE INSTRUCTIONS:
1. Extract ALL transactions from user message (can be multiple)
2. For each transaction, determine: amount, category, merchant, type (income/expense)
3. Keep responses under 2 sentences
4. Use the user's name when appropriate
5. Reference their salary/goal/balance when relevant

RESPONSE FORMAT (JSON):
{
  "reply": "your response (max 2 sentences)",
  "intent": "transaction" | "conversation" | "undo" | "query",
  "confidence": 0.0-1.0,
  "transactions": [
    {
      "amount": number,
      "category": string,
      "merchant": string,
      "type": "expense" | "income",
      "currency": "BDT",
      "description": string
    }
  ]
}

If no transactions detected, return empty transactions array.
`

        // =====================================================================
        // STEP 3: SINGLE AI CALL (Optimized)
        // =====================================================================
        // Claude API expects system prompt separately from messages
        const messages = [
            ...conversationHistory,
            { role: 'user', content: message }
        ]

        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 1024,
                system: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only, no other text.',
                messages,
                temperature: 0.7
            })
        })

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            throw new Error(`Claude API error: ${aiResponse.statusText} - ${errorText}`)
        }

        const aiData = await aiResponse.json()
        const parsed = JSON.parse(aiData.content[0].text)

        // =====================================================================
        // STEP 4: SAVE USER MESSAGE TO DB
        // =====================================================================
        await supabase.from('messages').insert({
            user_id: authenticatedUserId,  // ✅ Using validated userId from JWT
            session_id: sessionId,
            role: 'user',
            content: message,
            intent: parsed.intent,
            confidence: parsed.confidence
        })

        // =====================================================================
        // STEP 5: SAVE TRANSACTIONS (If Any)
        // =====================================================================
        const savedTransactionIds: string[] = []

        if (parsed.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
            for (const tx of parsed.transactions) {
                const { data: savedTx } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: authenticatedUserId,  // ✅ Using validated userId from JWT
                        amount: tx.amount,
                        currency: tx.currency || 'BDT',
                        base_amount: tx.amount, // TODO: Convert to base currency
                        type: tx.type,
                        category: tx.category,
                        merchant_name: tx.merchant,
                        description: tx.description,
                        is_confirmed: true,
                        confidence: parsed.confidence
                    })
                    .select('id')
                    .single()

                if (savedTx) {
                    savedTransactionIds.push(savedTx.id)
                }
            }

            // Update reply with transaction count
            if (savedTransactionIds.length > 0) {
                const summary = parsed.transactions.map((t: any) => `${t.amount} BDT (${t.category})`).join(', ')
                parsed.reply = `Done! Saved ${savedTransactionIds.length} transaction(s): ${summary}.`
            }
        }

        // =====================================================================
        // STEP 6: SAVE AI RESPONSE TO DB
        // =====================================================================
        await supabase.from('messages').insert({
            user_id: authenticatedUserId,  // ✅ Using validated userId from JWT
            session_id: sessionId,
            role: 'assistant',
            content: parsed.reply,
            intent: parsed.intent,
            confidence: parsed.confidence,
            metadata: {
                transaction_ids: savedTransactionIds
            }
        })

        // =====================================================================
        // STEP 7: RETURN RESPONSE
        // =====================================================================
        const executionTime = performance.now() - startTime
        console.log(`✅ processChat completed in ${Math.round(executionTime)}ms`)

        return new Response(
            JSON.stringify({
                mode: parsed.intent === 'transaction' ? 'transaction' : 'conversation',
                reply: parsed.reply,
                intent: parsed.intent,
                confidence: parsed.confidence,
                transactions: parsed.transactions || [],
                executionTime: Math.round(executionTime)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ processChat error:', error)

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
