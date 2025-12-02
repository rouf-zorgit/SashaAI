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
                take: 20,
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
                take: 10,
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
            .map(m => ({
                role: m.role === 'user' ? 'user' as const : 'assistant' as const,
                content: m.content
            }))

        // Calculate metrics
        const todayStart = new Date().toISOString().split('T')[0]
        const todaysTransactions = recentTransactions.filter(t =>
            t.created_at && t.created_at.toISOString() >= todayStart
        )
        const todaySpending = todaysTransactions
            .map(t => `${t.amount} ${userProfile?.currency || 'BDT'} at ${t.description || t.category}`)
            .join(', ')

        const totalBalance = userWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0)

        // =====================================================================
        // STEP 2: BUILD ENHANCED SYSTEM PROMPT
        // =====================================================================
        const userName = userProfile?.full_name || profile?.full_name || 'there'
        const salary = userProfile?.monthly_salary || profile?.monthly_salary
        const salaryText = salary ? `${salary} ${userProfile?.currency || profile?.currency || 'BDT'}` : 'not set'
        const goal = profile?.primary_goal || 'general financial wellness'
        const style = profile?.communication_style || 'friendly'

        const walletSummary = userWallets.length > 0
            ? userWallets.map(w => `${w.name}: ${w.balance} ${w.currency}`).join(', ')
            : 'No wallets set up'

        const systemPrompt = `You are Sasha, a warm and friendly financial assistant who talks like a helpful friend, not a robot.

        USER INFO:
        - Name: ${userName}
        - Monthly Income: ${salaryText}
        - Goal: ${goal}
        - Total Balance: ${totalBalance} ${userProfile?.currency || 'BDT'}
        - Wallets: ${walletSummary}
        ${todaySpending ? `- Today's spending: ${todaySpending}` : ''}
        ${activeLoans.length > 0 ? `- Active loans: ${activeLoans.length}` : ''}

        HOW TO RESPOND:
        - Be warm, natural, and conversational - like a supportive friend
        - Keep responses SHORT (1-2 sentences max)
        - Use the user's name sometimes, but not every message
        - Celebrate their wins, be gentle about overspending
        - No bullet points, no formal language, no robotic responses
        - Sound human - use contractions (I'm, you're, that's), casual phrases

        TRANSACTION DETECTION:
        When user mentions spending or income, extract it. Examples:
        - "spent 500 on lunch" → expense, 500, food
        - "got paid 50000" → income, 50000, salary
        - "bought coffee for 150" → expense, 150, food

        RESPOND IN THIS JSON FORMAT ONLY:
        {
        "reply": "your natural, friendly response here",
        "intent": "transaction" | "conversation",
        "confidence": 0.9,
        "transactions": [
            {
            "amount": 500,
            "category": "food",
            "merchant": "lunch",
            "type": "expense",
            "currency": "BDT",
            "description": "lunch"
            }
        ]
        }

        If no transaction detected, return empty transactions array [].
        Never include markdown, code blocks, or explanation - just the JSON.`

        // =====================================================================
        // STEP 3: CALL CLAUDE API
        // =====================================================================
        const aiStart = performance.now()
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const messages = [
            ...conversationHistory,
            { role: 'user' as const, content: message }
        ]

        const aiResponse = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only, no other text.',
            messages,
            temperature: 0.7
        })

        console.log(`⏱️ Claude API: ${Math.round(performance.now() - aiStart)}ms`)

        let responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}'
        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(responseText)

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
            for (const tx of parsed.transactions) {
                const savedTx = await prisma.transactions.create({
                    data: {
                        user_id: authenticatedUserId,
                        amount: tx.amount,
                        type: tx.type,
                        category: tx.category,
                        description: tx.description,
                    },
                    select: { id: true }
                })

                if (savedTx) {
                    savedTransactionIds.push(savedTx.id)
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
