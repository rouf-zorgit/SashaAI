import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Force redeploy check
// Last updated: 2025-11-24 16:37
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { log, logError, detectEmotion, isSpam, getFamiliarityLevel, buildMemoryContext, generateProactiveNudge } from './utils.ts'
import type { ChatRequest, ChatResponse, Transaction, Profile } from './types.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type definitions moved to types.ts

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        // FIX: Default arrays to empty if missing to prevent crashes
        const { userId, sessionId, message, recentMessages = [], recentTransactions = [] } = body

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

        // LAYER 1: INPUT FILTER
        if (isSpam(message)) {
            return new Response(
                JSON.stringify({
                    mode: 'conversation',
                    reply: "That doesn't look right. Try again?",
                    intent: 'spam',
                    confidence: 1.0
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // LAYER 2: EMOTION DETECTION
        const { emotion: detectedEmotion, intensity: emotionIntensity } = detectEmotion(message)

        // Save emotional state if not neutral
        if (detectedEmotion !== 'neutral') {
            try {
                await supabaseClient.from('user_emotional_state').insert({
                    user_id: userId,
                    emotion: detectedEmotion,
                    intensity: emotionIntensity,
                    context: message.substring(0, 200)
                })
            } catch (error) {
                console.error('Failed to save emotional state (table may not exist):', error)
            }
        }

        // Retrieve recent emotional history
        let emotionalHistory: any[] = []
        try {
            const { data } = await supabaseClient
                .from('user_emotional_state')
                .select('*')
                .eq('user_id', userId)
                .order('detected_at', { ascending: false })
                .limit(3)
            emotionalHistory = data || []
        } catch (error) {
            console.error('Failed to retrieve emotional history (table may not exist):', error)
        }

        // LAYER 3: MEMORY & PROFILE RETRIEVAL

        let profile = null
        try {
            const { data } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            profile = data
        } catch (error) {
            console.error('Failed to retrieve profile:', error)
        }

        let preferences = null
        try {
            const { data } = await supabaseClient
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single()
            preferences = data
        } catch (error) {
            console.error('Failed to retrieve preferences:', error)
        }

        // PATTERNS: Retrieve recurring payments
        let recurringBills: any[] = []
        try {
            const { data } = await supabaseClient
                .from('recurring_payments')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
            recurringBills = data || []
        } catch (error) {
            console.error('Failed to retrieve recurring payments:', error)
        }

        // PATTERNS: Retrieve spending habits
        let spendingPatterns: any[] = []
        try {
            const { data } = await supabaseClient
                .from('spending_patterns')
                .select('*')
                .eq('user_id', userId)
            spendingPatterns = data || []
        } catch (error) {
            console.error('Failed to retrieve spending patterns:', error)
        }

        const { data: recentTx } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('occurred_at', { ascending: false })
            .limit(5)

        const { data: memoryEvents } = await supabaseClient
            .from('memory_events')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)

        const { data: patterns } = await supabaseClient
            .from('user_spending_patterns')
            .select('*')
            .eq('user_id', userId)
            .single()

        // STM: Retrieve session context
        let sessionContext: any[] = []
        if (sessionId) {
            const { data: contextData } = await supabaseClient
                .from('conversation_context')
                .select('*')
                .eq('session_id', sessionId)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(10)

            sessionContext = contextData || []
            log(`Retrieved ${sessionContext.length} context items for session ${sessionId}`)
        }

        // EPISODIC: Retrieve recent important events
        let recentEpisodes: any[] = []
        try {
            const { data } = await supabaseClient
                .from('episodic_events')
                .select('*')
                .eq('user_id', userId)
                .order('occurred_at', { ascending: false })
                .limit(5)
            recentEpisodes = data || []
        } catch (error) {
            console.error('Failed to retrieve episodic events (table may not exist):', error)
        }

        const memoryContextBlock = `
USER PROFILE:
- Name: ${profile?.name || 'N/A'}
- Monthly Income: ${profile?.income_monthly || 'N/A'}
- Onboarding Step: ${profile?.onboarding_step || 'O0'}

USER PREFERENCES:
- Communication Style: ${preferences?.communication_style || 'Direct'}
- Financial Goal: ${preferences?.financial_goal || 'Save Money'}
- Risk Tolerance: ${preferences?.risk_tolerance || 'Medium'}
- Forbidden Words: ${preferences?.forbidden_words?.join(', ') || 'None'}

RECENT PATTERNS:
- Weekend Spike: ${patterns?.weekend_spike || false}
- Top Category: ${patterns?.top_category || 'N/A'}

MEMORIES:
${memoryEvents?.map(m => `- ${m.kind}: ${JSON.stringify(m.data)}`).join('\n') || 'None'}

SESSION CONTEXT:
${sessionContext.map(c => `- ${c.context_type}: ${c.key} = ${c.value}`).join('\n') || 'None'}

RECENT EVENTS:
${recentEpisodes?.map(e => `- ${new Date(e.occurred_at).toLocaleDateString()}: ${e.summary}`).join('\n') || 'None'}

SPENDING PATTERNS:
- Recurring Bills: ${recurringBills.map(b => `${b.merchant_name} (${b.amount}) due ${new Date(b.next_due_date).toLocaleDateString()}`).join(', ') || 'None'}
- Habits: ${spendingPatterns.map(p => `${p.pattern_type} (${p.trigger_category || p.trigger_day})`).join(', ') || 'None'}


STEP 1: Identify the merchant/store name
- Look for words after "at", "from", "to"
- Look for brand names (Starbucks, KFC, Netflix, Uber, etc.)
- If found, extract it exactly as written

STEP 2: Extract transaction details
- Amount: The number mentioned
- Category: What type of expense (food, coffee, entertainment, transport, etc.)
- Merchant: The store/brand name from Step 1 (REQUIRED if mentioned)
- Type: "expense" or "income"
- Currency: Default to "BDT"

Respond with JSON:
{
  "intent": "TRANSACTION" | "SMALL_TALK" | "ONBOARDING" | "GENERAL_QUERY",
  "confidence": 0.0-1.0,
  "entities": {
    "amount": number,
    "category": string,
    "merchant": string (MUST include if any store/brand name is mentioned),
    "type": "expense" | "income",
    "currency": "BDT"
  }
}

Examples:
Input: "I spent 500 at Starbucks"
Output: {"intent": "TRANSACTION", "confidence": 0.95, "entities": {"amount": 500, "category": "coffee", "merchant": "Starbucks", "type": "expense", "currency": "BDT"}}

Input: "Paid 1200 to Netflix"
Output: {"intent": "TRANSACTION", "confidence": 0.95, "entities": {"amount": 1200, "category": "entertainment", "merchant": "Netflix", "type": "expense", "currency": "BDT"}}

Input: "Bought food from KFC for 800"
Output: {"intent": "TRANSACTION", "confidence": 0.95, "entities": {"amount": 800, "category": "food", "merchant": "KFC", "type": "expense", "currency": "BDT"}}
`

        const classificationPrompt = `
${memoryContextBlock}

USER MESSAGE: "${message}"
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
                    { role: 'system', content: 'You are a precise entity extraction system. Always extract merchant names when present.' },
                    { role: 'user', content: classificationPrompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        })

        const classificationData = await classificationResponse.json()
        const classification = JSON.parse(classificationData.choices[0].message.content)

        // LAYER 5: BEHAVIOR INSTRUCTION GENERATION

        // PERSONALITY: Detect financial crisis
        const recentTransactionsList = recentTx || []
        const isCrisis = recentTransactionsList.some(t =>
            Number(t.amount) > (profile?.income_monthly || 50000) * 0.5
        ) || message.toLowerCase().includes('broke') ||
            message.toLowerCase().includes("can't afford") ||
            message.toLowerCase().includes('debt') ||
            message.toLowerCase().includes('emergency')

        // PERSONALITY: Detect achievements
        const isAchievement = message.toLowerCase().includes('paid off') ||
            message.toLowerCase().includes('saved') ||
            message.toLowerCase().includes('achieved') ||
            message.toLowerCase().includes('reached my goal') ||
            message.toLowerCase().includes('bonus') ||
            message.toLowerCase().includes('promotion') ||
            message.toLowerCase().includes('raise')

        // PATTERNS: Check for active patterns
        const weekendPattern = spendingPatterns.find(p => p.pattern_type === 'weekend_spike')
        const paydayPattern = spendingPatterns.find(p => p.pattern_type === 'payday_splurge')
        const impulsePatterns = spendingPatterns.filter(p => p.pattern_type === 'impulse_category')

        // PERSONALITY: Track relationship/familiarity
        let interactionCount = 0
        try {
            const { count } = await supabaseClient
                .from('episodic_events')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('event_type', 'conversation')
            interactionCount = count || 0
        } catch (error) {
            console.error('Failed to get interaction count (table may not exist):', error)
        }

        const familiarity = interactionCount > 50 ? 'close' :
            interactionCount > 20 ? 'familiar' :
                interactionCount > 5 ? 'acquainted' : 'new'

        log(`Familiarity: ${familiarity} (${interactionCount} conversations)`)

        let behaviorInstruction = ""
        let updateOnboardingStep: string | null = null

        // PERSONALITY: Add crisis mode instruction
        if (isCrisis) {
            behaviorInstruction += " 🚨 CRISIS MODE: Be serious, supportive, no jokes. Focus on practical solutions to help them through this."
        }

        // PERSONALITY: Add achievement mode instruction
        if (isAchievement) {
            behaviorInstruction += " 🎉 CELEBRATION MODE: Be enthusiastic and encouraging! They achieved something great!"
        }

        // PERSONALITY: Add familiarity instruction
        if (familiarity === 'close') {
            behaviorInstruction += " You know this user well. Be more casual and personal."
        } else if (familiarity === 'new') {
            behaviorInstruction += " This is a new user. Be welcoming and patient."
        }

        // PATTERNS: Proactive Nudges
        const now = new Date()
        const dayOfWeek = now.getDay() // 0=Sun, 6=Sat

        // Weekend Spike Warning (Friday/Saturday)
        if (weekendPattern && (dayOfWeek === 5 || dayOfWeek === 6)) {
            behaviorInstruction += ` ⚠️ PATTERN ALERT: User tends to overspend on weekends (Avg: ${weekendPattern.avg_amount}). Gently remind them to stay on track.`
        }

        // Payday Splurge Warning (if recent income)
        if (paydayPattern) {
            const recentIncome = recentTx?.find((t: any) => t.type === 'income' && new Date(t.created_at).getTime() > Date.now() - 48 * 60 * 60 * 1000)
            if (recentIncome) {
                behaviorInstruction += ` 💸 SPLURGE ALERT: User just got paid and tends to overspend immediately. Suggest moving money to savings first.`
            }
        }

        // Category Addiction Warning
        if (classification.intent === 'TRANSACTION' && classification.entities?.category) {
            const category = classification.entities.category
            const addiction = impulsePatterns.find(p => p.trigger_category?.toLowerCase() === category.toLowerCase())
            if (addiction) {
                behaviorInstruction += ` ☕ HABIT ALERT: User spends a lot on ${category} (Freq: ${addiction.frequency}). Ask if they really need this.`
            }
        }

        // EPISODIC: Detect "when/remember" queries
        const isWhenQuery = message.toLowerCase().includes('when did i') ||
            message.toLowerCase().includes('when was') ||
            message.toLowerCase().includes('last time i')
        const isRememberQuery = message.toLowerCase().includes('remember when') ||
            message.toLowerCase().includes('do you remember')

        if (isWhenQuery || isRememberQuery) {
            // Extract search term from query
            const searchTerm = message.toLowerCase()
                .replace(/when did i|when was|last time i|remember when|do you remember/g, '')
                .trim()

            // Search episodic events
            const { data: matchingEvents } = await supabaseClient
                .from('episodic_events')
                .select('*')
                .eq('user_id', userId)
                .or(`summary.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
                .order('importance', { ascending: false })
                .limit(5)

            if (matchingEvents && matchingEvents.length > 0) {
                const eventSummaries = matchingEvents.map(e =>
                    `${new Date(e.occurred_at).toLocaleDateString()}: ${e.summary}`
                ).join('; ')
                behaviorInstruction = `Recall these events: ${eventSummaries}. Answer the user's question based on this information.`
            } else {
                behaviorInstruction = "No matching events found. Politely tell the user you don't have that information."
            }
        }

        // Check onboarding state
        const onboardingStep = profile?.onboarding_step || 'O0'
        const isOnboarding = onboardingStep !== 'O_done'

        if (isOnboarding && !isWhenQuery && !isRememberQuery) {
            // Onboarding Flow
            switch (onboardingStep) {
                case 'O0':
                    behaviorInstruction = "Welcome user warmly. Ask: 'What's your name?'"
                    updateOnboardingStep = 'O1'
                    break
                case 'O1':
                    if (classification.entities?.name) {
                        behaviorInstruction = `Great! Nice to meet you, ${classification.entities.name}. Ask: 'What's your monthly income?'`
                        updateOnboardingStep = 'O2'
                    } else {
                        behaviorInstruction = "Ask for their name politely."
                    }
                    break
                case 'O2':
                    if (classification.entities?.income_monthly) {
                        behaviorInstruction = "Good! Ask: 'What do you want to achieve financially?'"
                        updateOnboardingStep = 'O3'
                    } else {
                        behaviorInstruction = "Ask for their monthly income."
                    }
                    break
                case 'O3':
                    if (classification.entities?.financial_goal) {
                        behaviorInstruction = "Encourage their goal. Ask: 'Do you want me to be strict or chill?'"
                        updateOnboardingStep = 'O4'
                    } else {
                        behaviorInstruction = "Ask what they want to achieve financially."
                    }
                    break
                case 'O4':
                    if (['strict', 'chill', 'hard', 'soft'].some(w => message.toLowerCase().includes(w))) {
                        behaviorInstruction = "Confirm preference. Say: 'Okay, setup done! What do you want to track first?'"
                        updateOnboardingStep = 'O_done'
                    } else {
                        behaviorInstruction = "Ask: 'Strict or chill?'"
                    }
                    break
            }
        } else {
            // Normal Behavior + FINANCIAL REALITY CHECKS + PROACTIVE NUDGES
            const now = new Date()
            const dayOfWeek = now.getDay()
            const dayOfMonth = now.getDate()
            let proactiveNudge = ""

            if (dayOfWeek === 5 || dayOfWeek === 6) {
                proactiveNudge = "It's the weekend. Warn user not to overspend on 'fun'."
            } else if (dayOfMonth > 25) {
                proactiveNudge = "Month end. Warn user that salary is running low."
            } else if (dayOfMonth < 5) {
                proactiveNudge = "New month. Remind user to pay rent/bills first."
            }

            switch (classification.intent) {
                case 'TRANSACTION':
                    const amount = classification.entities?.amount || 0
                    const merchant = classification.entities?.merchant
                    let category = classification.entities?.category
                    let warning = ""

                    // Validation checks
                    if (amount > 0) {
                        if (message.toLowerCase().includes('coffee') && amount > 1000) warning = "SUSPICIOUS: Coffee > 1000 BDT."
                        if (message.toLowerCase().includes('food') && amount > 5000) warning = "SUSPICIOUS: Food > 5000 BDT."
                        if (amount > 50000 && !message.toLowerCase().includes('rent') && !message.toLowerCase().includes('salary')) warning = "HIGH VALUE: Confirm this isn't a typo."
                    }

                    const isDuplicate = recentTx?.some((t: any) =>
                        t.amount === amount &&
                        (t.merchant_name === merchant || !merchant) && // Check merchant if available
                        new Date(t.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
                    )
                    if (isDuplicate) warning = "DUPLICATE DETECTED: Same amount/merchant as yesterday."

                    if (warning) {
                        behaviorInstruction = `VALIDATION FAILED: ${warning}. Ask user to confirm. DO NOT log it yet.`
                    } else {
                        behaviorInstruction = `Extract amount (${amount}), merchant (${merchant || 'Unknown'}), and category (${category || 'Unknown'}). Confirm with user.`
                    }
                    break

                case 'SMALL_TALK':
                    behaviorInstruction = "Reply once briefly. If repeated, get annoyed."
                    if (proactiveNudge) behaviorInstruction += ` AND ${proactiveNudge}`
                    break
                case 'BUDGET_CREATE':
                    behaviorInstruction = "Ask for monthly costs (rent, food, bills, transport). Do NOT give a budget yet."
                    break
                case 'BUDGET_ADVICE':
                    behaviorInstruction = "Keep it simple. Ask for fixed costs first."
                    break
                case 'RANDOM_NUMBER':
                    behaviorInstruction = "Do NOT save. Ask 'What is this amount for?'"
                    break
                case 'CONFUSION':
                    behaviorInstruction = "Apologize. Explain simply. Use Simple Mode."
                    break
                case 'COMPLAINT':
                    behaviorInstruction = "Apologize lightly. Ask how to fix."
                    break
                default:
                    behaviorInstruction = "Be helpful and simple."
                    if (proactiveNudge) behaviorInstruction += ` AND ${proactiveNudge}`
            }
        }

        // =================================================================================
        // LAYER 6: FINAL RESPONSE GENERATION 🗣️
        // =================================================================================
        console.log('--- LAYER 6: FINAL RESPONSE ---')

        const finalSystemPrompt = `
You are Sasha, a witty and direct AI financial assistant. Your personality:
- Straight-talking, no-nonsense, but caring
- Use humor and light sarcasm when appropriate
- Keep responses SHORT (1-2 sentences max)
- Be conversational and natural
- Remember user's name: ${profile?.name || 'User'}

BEHAVIOR INSTRUCTION: ${behaviorInstruction}

USER CONTEXT:
${memoryContextBlock}

PERSONALITY ADAPTATION - CRITICAL RULES:
Based on user's current emotion: ${detectedEmotion} (intensity: ${emotionIntensity})

${detectedEmotion === 'frustrated' || detectedEmotion === 'angry' ? `
🔴 FRUSTRATED/ANGRY MODE:
- Be patient and understanding
- NO sarcasm whatsoever
- Acknowledge their frustration explicitly
- Offer practical, immediate solutions
- Use calm, supportive language
- Example: "I hear you. That sounds frustrating. Let's figure this out together."
` : ''}

${detectedEmotion === 'stressed' || detectedEmotion === 'worried' ? `
🟡 STRESSED/WORRIED MODE:
- Be calm and reassuring
- Use gentle, simple language
- Break down complex things step-by-step
- Offer concrete support
- Avoid overwhelming them
- Example: "Take a breath. We'll handle this step by step. You've got this."
` : ''}

${detectedEmotion === 'happy' || detectedEmotion === 'excited' ? `
🟢 HAPPY/EXCITED MODE:
- Match their positive energy!
- Be enthusiastic and celebratory
- Use exclamation points
- Celebrate their wins
- Encourage them to keep going
- Example: "That's awesome! I'm so happy for you! Keep up the great work!"
` : ''}

${detectedEmotion === 'neutral' ? `
⚪ NEUTRAL MODE:
- Use standard witty/direct style
- Sarcasm level: ${preferences?.sarcasm_level || 'Medium'}
- Communication style: ${preferences?.communication_style || 'Direct'}
- Be yourself - smart, helpful, slightly sassy
` : ''}

CRITICAL: Your tone MUST match the user's emotional state. Never be sarcastic when they're upset.

IMPORTANT: Track conversation context for continuity. If the user mentions:
- A topic they want to discuss (e.g., "I want to talk about budgeting") → save as context
- A decision they're considering (e.g., "I'm thinking about buying a car") → save as context  
- A preference they express (e.g., "I prefer weekly summaries") → save as context
- A question they ask that might need follow-up → save as context

Respond with a JSON object:
{
    "reply": "Your simple response here",
    "transaction": { // Only if TRANSACTION intent
        "amount": number,
        "category": string,
        "merchant": string,
        "type": "expense" | "income",
        "currency": "BDT"
    },
    "memory_update": { // Optional: If you learned something new
        "kind": "profile_update" | "preference_update" | "memory_event",
        "data": { ... }
    },
    "new_context": [ // Optional: Context to save for this session
        {"type": "topic", "key": "current_topic", "value": "budgeting"},
        {"type": "decision", "key": "considering", "value": "buying a car"},
        {"type": "preference", "key": "summary_frequency", "value": "weekly"},
        {"type": "question", "key": "pending_question", "value": "how to save more"}
    ]
}
`

        const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: finalSystemPrompt },
                    ...recentMessages.slice(-3),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        })

        const finalData = await finalResponse.json()
        const finalContent = JSON.parse(finalData.choices[0].message.content)

        console.log('Final response:', finalContent)

        // Construct final response object
        const response: ChatResponse = {
            mode: classification.intent === 'TRANSACTION' ? 'transaction' : 'conversation',
            reply: finalContent.reply,
            intent: classification.intent === 'TRANSACTION' ? 'create' : 'none',
            confidence: classification.confidence,
            transaction: finalContent.transaction
        }

        // If transaction detected, ensure fields are present
        if (response.mode === 'transaction' && response.transaction) {
            response.transaction.currency = response.transaction.currency || 'BDT'
            response.transaction.type = response.transaction.type || 'expense'
            response.transaction.occurred_at = new Date().toISOString()

            console.log('Transaction before override:', response.transaction)
            console.log('Classification entities:', classification.entities)

            // SMART CATEGORIZATION OVERRIDE: Use merchant from classification, not AI response
            if (classification.intent === 'TRANSACTION') {
                const merchant = classification.entities?.merchant  // Get from classification!
                console.log('Merchant from classification:', merchant)

                if (merchant) {
                    try {
                        const { data: pastTx, error: lookupError } = await supabaseClient
                            .from('transactions')
                            .select('category')
                            .eq('user_id', userId)
                            .eq('merchant_name', merchant)
                            .order('created_at', { ascending: true })
                            .limit(1)

                        console.log('Smart categorization lookup result:', pastTx, 'Error:', lookupError)

                        if (pastTx && pastTx.length > 0) {
                            const smartCategory = pastTx[0].category
                            console.log(`SMART CATEGORIZATION: Overriding "${response.transaction.category}" with "${smartCategory}" for merchant "${merchant}"`)
                            response.transaction.category = smartCategory
                            response.transaction.merchant = merchant  // Ensure merchant is in response
                            response.reply = `I categorized '${merchant}' as '${smartCategory}' based on your past transactions. Done!`
                        } else {
                            console.log('No past transactions found for merchant:', merchant)
                            response.transaction.merchant = merchant  // Still add merchant even if no history
                        }
                    } catch (e) {
                        console.error('Smart categorization override failed:', e)
                    }
                } else {
                    console.log('No merchant found in classification.entities')
                }
            }

            console.log('Transaction after override:', response.transaction)

            // EPISODIC: Log transaction event
            try {
                const importance = response.transaction.amount > 5000 ? 7 : 5
                await supabaseClient.from('episodic_events').insert({
                    user_id: userId,
                    event_type: 'transaction',
                    event_data: {
                        amount: response.transaction.amount,
                        category: response.transaction.category,
                        merchant_name: response.transaction.merchant,
                        type: response.transaction.type,
                        currency: response.transaction.currency
                    },
                    occurred_at: response.transaction.occurred_at,
                    importance,
                    tags: [response.transaction.category, response.transaction.type],
                    summary: `${response.transaction.type === 'income' ? 'Earned' : 'Spent'} ${response.transaction.amount} BDT on ${response.transaction.category}`
                })
                console.log('Episodic event logged for transaction')
            } catch (error) {
                console.error('Failed to log episodic event:', error)
            }
        }

        // EPISODIC: Log important conversation moments
        if (classification.intent === 'BUDGET_CREATE' || classification.intent === 'BUDGET_ADVICE') {
            try {
                await supabaseClient.from('episodic_events').insert({
                    user_id: userId,
                    event_type: 'conversation',
                    event_data: {
                        message: message.substring(0, 200),
                        intent: classification.intent,
                        entities: classification.entities
                    },
                    occurred_at: new Date().toISOString(),
                    importance: 7,
                    tags: ['conversation', 'budget', classification.intent.toLowerCase()],
                    summary: `User asked about budgeting: "${message.substring(0, 100)}"`
                })
            } catch (error) {
                console.error('Failed to log conversation event:', error)
            }
        }

        // EPISODIC: Log goals and decisions
        if (message.toLowerCase().includes('want to') || message.toLowerCase().includes('planning to') || message.toLowerCase().includes('thinking about')) {
            try {
                const eventType = message.toLowerCase().includes('want to') ? 'goal' : 'decision'
                await supabaseClient.from('episodic_events').insert({
                    user_id: userId,
                    event_type: eventType,
                    event_data: {
                        message: message,
                        context: classification.entities
                    },
                    occurred_at: new Date().toISOString(),
                    importance: 8,
                    tags: [eventType, 'user_intent'],
                    summary: `User mentioned: "${message.substring(0, 100)}"`
                })
            } catch (error) {
                console.error('Failed to log goal/decision event:', error)
            }
        }

        // Handle Memory Updates (LTM)
        const memUpdate = finalContent.memory_update || classification.memory_update
        if (memUpdate) {
            console.log('Processing memory update:', memUpdate)
            try {
                if (memUpdate.kind === 'profile_update') {
                    await supabaseClient.from('profiles').update(memUpdate.data).eq('id', userId)
                } else if (memUpdate.kind === 'preference_update') {
                    await supabaseClient.from('user_preferences').upsert({ user_id: userId, ...memUpdate.data })
                } else if (memUpdate.kind === 'memory_event') {
                    await supabaseClient.from('memory_events').insert({
                        user_id: userId,
                        kind: 'general',
                        data: memUpdate.data,
                        salience: 3
                    })
                }
            } catch (error) {
                console.error('Memory update error:', error)
            }
        }

        // STM: Save new session context
        if (sessionId && finalContent.new_context && Array.isArray(finalContent.new_context)) {
            console.log(`Saving ${finalContent.new_context.length} context items for session ${sessionId}`)
            try {
                const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

                for (const ctx of finalContent.new_context) {
                    if (ctx.type && ctx.key && ctx.value) {
                        await supabaseClient.from('conversation_context').insert({
                            user_id: userId,
                            session_id: sessionId,
                            context_type: ctx.type,
                            key: ctx.key,
                            value: ctx.value,
                            expires_at: expiresAt
                        })
                    }
                }
            } catch (error) {
                console.error('Context save error:', error)
            }
        }

        // Handle Onboarding State Update
        if (updateOnboardingStep) {
            await supabaseClient.from('profiles').update({
                onboarding_step: updateOnboardingStep,
                last_onboarding_prompt: finalContent.reply
            }).eq('id', userId)
        }

        // ========== FINAL RESPONSE TRACE ==========
        console.log('========== FINAL RESPONSE TRACE ==========')
        console.log('1. AI Raw Response transaction:', finalContent.transaction)
        console.log('2. Response object BEFORE return:', JSON.stringify(response, null, 2))
        if (response.transaction) {
            console.log('3. Transaction category:', response.transaction.category)
            console.log('4. Transaction merchant:', response.transaction.merchant)
            console.log('5. Transaction amount:', response.transaction.amount)
            console.log('6. Full transaction object:', JSON.stringify(response.transaction, null, 2))
        }
        console.log('==========================================')

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : ''

        return new Response(
            JSON.stringify({
                mode: 'conversation',
                reply: `🐛 DEBUG ERROR: ${errorMessage}\n\nStack: ${errorStack.split('\n')[0]}`,
                intent: 'error',
                confidence: 0
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
