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

        // Fetch user profile
        const userProfile = await prisma.profiles.findUnique({
            where: { id: authenticatedUserId },
            select: {
                full_name: true,
                email: true,
                currency: true,
                monthly_salary: true,
                primary_goal: true,
            }
        })

        // Fetch user wallets
        const userWallets = await prisma.wallets.findMany({
            where: { user_id: authenticatedUserId },
            select: {
                name: true,
                balance: true,
                currency: true,
            }
        })

        // Fetch recent transactions
        const recentTransactions = await prisma.transactions.findMany({
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
        })

        // Fetch active loans
        const activeLoans = await prisma.loans.findMany({
            where: {
                user_id: authenticatedUserId,
                status: 'active'
            },
            select: {
                lender_name: true,
                remaining: true,
            }
        })

        // Fetch session messages
        const sessionMessages = await prisma.messages.findMany({
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

        const systemPrompt = `You are Sasha, a ${style} financial assistant.

USER PROFILE:
- Name: ${userName}
- Monthly Income: ${salaryText}
- Primary Goal: ${goal}
- Total Balance: ${totalBalance} ${userProfile?.currency || 'BDT'}
- Active Wallets: ${walletSummary}

${todaySpending ? `TODAY'S SPENDING:\n${todaySpending}` : ''}

${activeLoans.length > 0 ? `ACTIVE LOANS: ${activeLoans.length} loan(s)` : ''}

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
        // STEP 3: CALL CLAUDE API
        // =====================================================================
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const messages = [
            ...conversationHistory,
            { role: 'user' as const, content: message }
        ]

        const aiResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only, no other text.',
            messages,
            temperature: 0.7
        })

        const parsed = JSON.parse(aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}')

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
            if (savedTransactionIds.length > 0) {
                const summary = parsed.transactions.map((t: any) => `${t.amount} BDT (${t.category})`).join(', ')
                parsed.reply = `Done! Saved ${savedTransactionIds.length} transaction(s): ${summary}.`
            }
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
