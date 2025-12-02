import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

interface ChatRequest {
    sessionId: string
    message: string
    profile?: {
        full_name?: string
        monthly_salary?: number
        currency?: string
        primary_goal?: string
        communication_style?: string
    }
}

export async function POST(req: NextRequest) {
    console.log('📝 Chat API called')
    const startTime = performance.now()

    try {
        // ✅ SECURITY: Validate user from JWT token
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing authentication token' },
                { status: 401 }
            )
        }

        const authenticatedUserId = user.id

        const { sessionId, message, profile } = await req.json() as ChatRequest

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, message' },
                { status: 400 }
            )
        }

        const anthropicKey = process.env.ANTHROPIC_API_KEY
        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        // =====================================================================
        // FAST PATH: Quick responses for greetings/simple questions
        // =====================================================================
        const lowerMessage = message.toLowerCase().trim().replace(/[\?\!\.]/g, '')
        const isSimpleGreeting = /^(hi|hello|hey|how are you|what's up|whats up|sup|good morning|good evening)$/i.test(lowerMessage)

        if (isSimpleGreeting) {
            console.log('⚡ Fast path: Simple greeting detected')

            // Quick response without heavy context - using if-else for type safety
            let reply = "Hi! How can I help you today?"

            if (lowerMessage === 'hi') {
                reply = "Hi there! How can I help you with your finances today?"
            } else if (lowerMessage === 'hello') {
                reply = "Hello! Ready to help you manage your money. What's up?"
            } else if (lowerMessage === 'hey') {
                reply = "Hey! What can I do for you today?"
            } else if (lowerMessage === 'how are you') {
                reply = "I'm doing great, thanks for asking! Always happy to help you manage your money."
            } else if (lowerMessage === "what's up" || lowerMessage === 'whats up') {
                reply = "Not much! Just here to help with your finances. What do you need?"
            } else if (lowerMessage === 'sup') {
                reply = "Hey! Ready to track some expenses or check your balance?"
            } else if (lowerMessage === 'good morning') {
                reply = "Good morning! Let's make today financially awesome!"
            } else if (lowerMessage === 'good evening') {
                reply = "Good evening! How can I help you tonight?"
            }

            // Save messages
            await Promise.all([
                prisma.messages.create({
                    data: { user_id: authenticatedUserId, session_id: sessionId, role: 'user', content: message }
                }),
                prisma.messages.create({
                    data: { user_id: authenticatedUserId, session_id: sessionId, role: 'assistant', content: reply }
                })
            ])

            const fastTime = performance.now() - startTime
            console.log(`⚡ Fast path completed in ${Math.round(fastTime)}ms`)

            return NextResponse.json({
                mode: 'conversation',
                reply: reply,
                intent: 'greeting',
                confidence: 1.0,
                transactions: [],
                executionTime: Math.round(fastTime)
            })
        }

        // =====================================================================
        // STEP 1: FETCH USER CONTEXT (Using Prisma)
        // =====================================================================
        console.log('🚀 Fetching user context...')
        const contextStart = performance.now()

        // Fetch all data in parallel for speed
        const [userProfile, userWallets, recentTransactions, activeLoans, sessionMessages] = await Promise.all([
            prisma.profiles.findUnique({
                where: { id: authenticatedUserId },
                select: {
                    full_name: true,
                    email: true,
                    currency: true,
                    monthly_salary: true,
                    primary_goal: true,
                }
            }),
            prisma.wallets.findMany({
                where: { user_id: authenticatedUserId },
                select: {
                    name: true,
                    balance: true,
                    currency: true,
                }
            }),
            prisma.transactions.findMany({
                where: {
                    user_id: authenticatedUserId,
                    deleted_at: null
                },
                orderBy: { created_at: 'desc' },
                take: 5,  // ✅ Reduced from 20 to 5 for faster queries
                select: {
                    amount: true,
                    category: true,
                    description: true,
                    created_at: true,
                }
            }),
            prisma.loans.findMany({
                where: {
                    user_id: authenticatedUserId,
                    is_active: true
                },
                select: {
                    provider: true,
                    remaining_amount: true,
                }
            }),
            prisma.messages.findMany({
                where: {
                    user_id: authenticatedUserId,
                    session_id: sessionId
                },
                orderBy: { created_at: 'desc' },
                take: 5,  // ✅ Reduced from 10 to 5 for faster queries
                select: {
                    role: true,
                    content: true,
                }
            })
        ])

        const contextTime = performance.now() - contextStart
        console.log(`✅ User context fetched in ${Math.round(contextTime)}ms`)

        // Build conversation history
        const conversationHistory = sessionMessages
            .reverse()
            .map((m: { role: string; content: string }) => ({
                role: m.role === 'user' ? 'user' as const : 'assistant' as const,
                content: m.content
            }))

        // Calculate metrics
        const todayStart = new Date().toISOString().split('T')[0]
        const todaysTransactions = recentTransactions.filter((t: { created_at: Date | null }) =>
            t.created_at && t.created_at.toISOString() >= todayStart
        )
        const todaySpending = todaysTransactions
            .map((t: { amount: any; description: string | null; category: string }) =>
                `${t.amount} ${userProfile?.currency || 'BDT'} at ${t.description || t.category}`
            )
            .join(', ')

        const totalBalance = userWallets.reduce((sum: number, w: { balance: any }) =>
            sum + Number(w.balance || 0), 0
        )

        // =====================================================================
        // STEP 2: BUILD ENHANCED SYSTEM PROMPT
        // =====================================================================
        const userName = userProfile?.full_name || profile?.full_name || 'there'
        const salary = userProfile?.monthly_salary || profile?.monthly_salary
        const salaryText = salary ? `${salary} ${userProfile?.currency || profile?.currency || 'BDT'}` : 'not set'
        const goal = profile?.primary_goal || 'general financial wellness'
        const style = profile?.communication_style || 'friendly'

        const walletSummary = userWallets.length > 0
            ? userWallets.map((w: { name: string; balance: any; currency: string | null }) =>
                `${w.name}: ${w.balance} ${w.currency}`
            ).join(', ')
            : 'No wallets set up'

        const systemPrompt = `You are Sasha, a friendly financial assistant.

USER: ${userName} | Balance: ${totalBalance} ${userProfile?.currency || 'BDT'} | Wallets: ${walletSummary}

RULES:
- Keep replies SHORT (1-2 sentences)
- Be warm and conversational
- Detect transactions: "spent 500 lunch" → extract amount, category, type

RESPOND IN JSON:
{
  "reply": "short friendly message",
  "intent": "transaction" | "conversation",
  "confidence": 0.9,
  "transactions": [{"amount": 500, "category": "food", "type": "expense", "description": "lunch"}]
}

If no transaction: transactions = []`

        // =====================================================================
        // STEP 3: CALL CLAUDE API (with timeout and error handling)
        // =====================================================================
        const CLAUDE_TIMEOUT = 25000 // 25 seconds
        const aiStart = performance.now()
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const messages = [
            ...conversationHistory,
            { role: 'user' as const, content: message }
        ]

        let aiResponse
        let parsed

        try {
            console.log('🤖 Calling Claude API...')

            // ✅ FIX: Add timeout to prevent hanging
            aiResponse = await Promise.race([
                anthropic.messages.create({
                    model: 'claude-3-5-haiku-20241022',
                    max_tokens: 512,  // ✅ Reduced from 1024 to 512 for faster responses
                    system: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only, no other text.',
                    messages,
                    temperature: 0.7
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('CLAUDE_TIMEOUT')), CLAUDE_TIMEOUT)
                )
            ])

            console.log(`⏱️ Claude API: ${Math.round(performance.now() - aiStart)}ms`)

            let responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}'
            // Remove markdown code blocks if present
            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

            try {
                parsed = JSON.parse(responseText)
            } catch (parseError) {
                console.error('❌ Failed to parse Claude response:', responseText)
                throw new Error('INVALID_JSON_RESPONSE')
            }

        } catch (apiError: unknown) {
            console.error('❌ Claude API Error:', apiError)

            // Save user message even if AI fails
            await prisma.messages.create({
                data: {
                    user_id: authenticatedUserId,
                    session_id: sessionId,
                    role: 'user',
                    content: message,
                }
            })

            // Type-safe error handling
            const error = apiError as { message?: string; status?: number }

            // Determine error message and retry timing
            let errorReply = "Oops! Something went wrong on my end. Mind trying that again? 😊"
            let retryAfter = 0

            if (error.message === 'CLAUDE_TIMEOUT') {
                errorReply = "Hey! I'm taking a bit longer than usual. Try again in a sec? ⏰"
                retryAfter = 5
            } else if (error.message === 'INVALID_JSON_RESPONSE') {
                errorReply = "I'm having trouble understanding. Could you rephrase that? 🤔"
                retryAfter = 0
            } else if (error.status === 429) {
                errorReply = "Whoa, lots of messages! Give me 30 seconds to catch my breath. 😅"
                retryAfter = 30
            } else if (error.status === 500 || error.status === 503) {
                errorReply = "My AI brain is having a moment. Try again in a few seconds? 🧠"
                retryAfter = 10
            } else if (error.status === 401) {
                errorReply = "There's a configuration issue. Please contact support!"
                console.error('🚨 CRITICAL: Invalid Anthropic API key')
            }

            // Save error response
            await prisma.messages.create({
                data: {
                    user_id: authenticatedUserId,
                    session_id: sessionId,
                    role: 'assistant',
                    content: errorReply,
                }
            })

            return NextResponse.json({
                mode: 'conversation',
                reply: errorReply,
                intent: 'error',
                confidence: 0,
                retryAfter,
                transactions: []
            }, { status: 200 }) // Return 200 to prevent frontend error states
        }


        // =====================================================================
        // STEP 4: SAVE USER MESSAGE TO DB
        // =====================================================================
        await prisma.messages.create({
            data: {
                user_id: authenticatedUserId,
                session_id: sessionId,
                role: 'user',
                content: message,
            }
        })

        // =====================================================================
        // STEP 5: SAVE TRANSACTIONS (If Any)
        // =====================================================================
        const savedTransactionIds: string[] = []

        if (parsed.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
            // ✅ FIX: Get user's default wallet or first available wallet
            const userWallet = await prisma.wallets.findFirst({
                where: {
                    user_id: authenticatedUserId,
                    is_default: true
                }
            })

            let targetWallet = userWallet
            if (!targetWallet) {
                targetWallet = await prisma.wallets.findFirst({
                    where: { user_id: authenticatedUserId }
                })
            }

            // If user has no wallets, return friendly error
            if (!targetWallet) {
                await prisma.messages.create({
                    data: {
                        user_id: authenticatedUserId,
                        session_id: sessionId,
                        role: 'assistant',
                        content: "Hey! You need to create a wallet first before I can track expenses. Head to the Wallets page to set one up! 💰",
                    }
                })

                return NextResponse.json({
                    mode: 'conversation',
                    reply: "Hey! You need to create a wallet first before I can track expenses. Head to the Wallets page to set one up! 💰",
                    intent: 'error',
                    confidence: 0,
                    transactions: []
                })
            }

            for (const tx of parsed.transactions) {
                // ✅ FIX: Validate amount
                const amount = Number(tx.amount)
                if (isNaN(amount) || amount <= 0) {
                    console.log('⚠️ Invalid amount detected:', tx.amount)
                    continue // Skip invalid transactions
                }

                if (amount > 10000000) {
                    console.log('⚠️ Suspicious large amount:', amount)
                    // Still process but log for review
                }

                // ✅ FIX: Create transaction WITH wallet_id
                const savedTx = await prisma.transactions.create({
                    data: {
                        user_id: authenticatedUserId,
                        wallet_id: targetWallet.id,  // ✅ FIXED: Now linked to wallet
                        amount: amount,
                        type: tx.type,
                        category: tx.category,
                        description: tx.description,
                    },
                    select: { id: true }
                })

                if (savedTx) {
                    savedTransactionIds.push(savedTx.id)

                    // ✅ FIX: Update wallet balance immediately
                    const currentBalance = Number(targetWallet.balance)
                    const newBalance = tx.type === 'expense'
                        ? currentBalance - amount
                        : currentBalance + amount

                    await prisma.wallets.update({
                        where: { id: targetWallet.id },
                        data: {
                            balance: newBalance,
                            updated_at: new Date()
                        }
                    })

                    console.log(`✅ Updated wallet "${targetWallet.name}": ৳${currentBalance} → ৳${newBalance}`)
                }
            }

            // Update reply with transaction count
            // Keep Sasha's natural reply - don't overwrite it
            // The AI already confirms the transaction in a friendly way
        }

        // =====================================================================
        // STEP 6: SAVE AI RESPONSE TO DB
        // =====================================================================
        await prisma.messages.create({
            data: {
                user_id: authenticatedUserId,
                session_id: sessionId,
                role: 'assistant',
                content: parsed.reply,
            }
        })

        // =====================================================================
        // STEP 7: RETURN RESPONSE
        // =====================================================================
        const executionTime = performance.now() - startTime
        console.log(`✅ processChat completed in ${Math.round(executionTime)}ms`)

        return NextResponse.json({
            mode: parsed.intent === 'transaction' ? 'transaction' : 'conversation',
            reply: parsed.reply,
            intent: parsed.intent,
            confidence: parsed.confidence,
            transactions: parsed.transactions || [],
            executionTime: Math.round(executionTime)
        })

    } catch (error: any) {
        console.error('❌ processChat error:', error)

        return NextResponse.json({
            mode: 'conversation',
            reply: `Something went wrong. ${error.message}`,
            intent: 'error',
            confidence: 0
        }, { status: 200 })
    }
}