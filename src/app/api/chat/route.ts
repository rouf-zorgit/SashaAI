import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getUserContext } from '@/lib/db/user-context'
import { extractTransactions, extractTransfers } from '@/lib/ai/parse-transaction'
import { checkLowBalance } from '@/app/actions/notifications'
import { invalidateUserCache } from '@/lib/cache/server-cache'
import { rateLimit, RateLimits, getRateLimitError } from '@/lib/rate-limit'

const SASHA_SYSTEM_PROMPT = `You are Sasha, a friendly AI finance assistant. Be BRIEF and casual.

LOGGING TRANSACTIONS:
When user mentions spending or earning money, you MUST include a transaction marker.
Format: [TRANSACTION: amount=NUMBER, category=CATEGORY, type=expense|income, description=TEXT, wallet=WALLET_NAME]

RULES:
1. Detect wallet from context or keywords (cash, bKash, card, bank, savings). Default: "default".
2. Categories: groceries, transport, bills, shopping, dining, health, entertainment, income, other.
3. For transfers: [TRANSFER: amount=NUMBER, from=WALLET_A, to=WALLET_B, description=TEXT]

EXAMPLES:
User: "Lunch 500"
Sasha: "Logged! 🍽️ [TRANSACTION: amount=500, category=dining, type=expense, description=Lunch, wallet=default]"

User: "Salary 50k"
Sasha: "Yay! 💰 [TRANSACTION: amount=50000, category=income, type=income, description=Salary, wallet=default]"

User: "Paid 2000 electric bill from bKash"
Sasha: "Done. ⚡ [TRANSACTION: amount=2000, category=bills, type=expense, description=electric bill, wallet=bKash]"

User: "Transfer 5k from Bank to Savings"
Sasha: "Transferred! 💸 [TRANSFER: amount=5000, from=Bank, to=Savings, description=Transfer]"

IMPORTANT:
- The marker [TRANSACTION:...] is hidden from the user, so keep your text response complete but brief.
`

export async function POST(request: NextRequest) {
    console.log('🚀 Chat API: Request received')
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 })
        }

        const anthropic = new Anthropic({ apiKey })
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        // ✅ RATE LIMITING: Check per-minute limit
        const rateLimitMinute = rateLimit(`chat:${user.id}:minute`, RateLimits.chat)
        if (!rateLimitMinute.success) {
            return new Response(JSON.stringify({
                error: getRateLimitError('chat', rateLimitMinute.resetIn || 60),
                remaining: rateLimitMinute.remaining,
                resetIn: rateLimitMinute.resetIn
            }), { status: 429 })
        }

        // ✅ RATE LIMITING: Check per-hour limit
        const rateLimitHour = rateLimit(`chat:${user.id}:hour`, RateLimits.chatHourly)
        if (!rateLimitHour.success) {
            return new Response(JSON.stringify({
                error: getRateLimitError('chatHourly', rateLimitHour.resetIn || 3600),
                remaining: rateLimitHour.remaining,
                resetIn: rateLimitHour.resetIn
            }), { status: 429 })
        }

        let body
        try {
            body = await request.json()
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
        }

        const { messages, sessionId: providedSessionId } = body
        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 })
        }

        const currentSessionId = providedSessionId || `session_${Date.now()}_${Math.random().toString(36)}`
        const lastUserMessage = messages[messages.length - 1]

        // Save user message
        await supabase.from('messages').insert({
            user_id: user.id,
            session_id: currentSessionId,
            role: 'user',
            content: lastUserMessage.content,
            created_at: new Date().toISOString(),
        })

        // Fetch context
        const context = await getUserContext(user.id)
        const userWallets = context?.wallets || []

        // Build system prompt
        let systemPrompt = SASHA_SYSTEM_PROMPT
        if (context && context.profile) {
            const { profile, wallets, active_loans, monthly_spending } = context

            const walletInfo = wallets.map((w: any) =>
                `- ${w.name}: ${w.currency} ${w.balance} (${w.type})${w.is_active === false ? ' (LOCKED)' : ''}`
            ).join('\n')

            const spendingInfo = Object.entries(monthly_spending || {}).map(([c, a]) => `- ${c}: ${a}`).join('\n')

            systemPrompt += `\nUSER CONTEXT:\nName: ${profile.name}\nCurrency: ${profile.currency}\n`
            systemPrompt += `WALLETS:\n${walletInfo}\n`
            systemPrompt += `SPENDING:\n${spendingInfo}\n`
            if (active_loans.length) systemPrompt += `LOANS: ${active_loans.length} active\n`
        }

        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                try {
                    // Limit context to last 20 messages for performance/cost
                    // Filter out any messages with empty content
                    const recentMessages = messages
                        .slice(-20)
                        .filter((m: any) => m.content && m.content.trim().length > 0)
                        .map((m: any) => ({
                            role: m.role,
                            content: m.content
                        }))

                    console.log('📨 Sending messages to Claude:', recentMessages.length)

                    const streamResponse = await anthropic.messages.create({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 1024,
                        system: systemPrompt,
                        messages: recentMessages,
                        stream: true,
                    })

                    let fullResponse = ''

                    for await (const chunk of streamResponse) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            const text = chunk.delta.text
                            fullResponse += text
                            sendEvent({ type: 'text', content: text })
                        }
                    }

                    // Process transactions
                    const transactions = extractTransactions(fullResponse)
                    const transfers = extractTransfers(fullResponse)
                    const savedTransactions = []

                    // Match wallet helper
                    const matchWallet = (hint: string) => {
                        if (!hint || hint === 'default') return userWallets.find((w: any) => w.is_default) || userWallets[0]
                        const lowerHint = hint.toLowerCase()
                        return userWallets.find((w: any) => w.name.toLowerCase() === lowerHint) ||
                            userWallets.find((w: any) => w.name.toLowerCase().includes(lowerHint)) ||
                            userWallets.find((w: any) => w.is_default) || userWallets[0]
                    }

                    // Save transactions
                    console.log('🔍 Transactions to save:', transactions.length, transactions)

                    for (const tx of transactions) {
                        console.log('💾 Processing transaction:', tx)

                        const wallet = matchWallet(tx.walletHint)
                        console.log('💰 Matched wallet:', wallet?.name, wallet?.id)

                        if (!wallet) {
                            console.error('❌ No wallet found for transaction:', tx)
                            continue
                        }

                        const currentDate = new Date().toISOString()

                        const { data: savedTx, error: txError } = await supabase.from('transactions').insert({
                            user_id: user.id,
                            amount: tx.amount,
                            base_amount: tx.amount,
                            category: tx.category,
                            type: tx.type,
                            description: tx.description,
                            wallet_id: wallet.id,
                            date: currentDate,  // ✅ CHANGED TO 'date'
                            created_at: currentDate,
                            deleted_at: null
                        }).select().single()

                        console.log('✅ Saved transaction result:', savedTx)
                        console.log('❌ Transaction error:', txError)

                        if (txError) {
                            console.error('Transaction save error:', txError)
                            continue
                        }

                        if (savedTx) {
                            savedTransactions.push(savedTx)
                            const newBal = tx.type === 'expense' ? wallet.balance - tx.amount : wallet.balance + tx.amount
                            await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id)
                            console.log('💵 Updated wallet balance:', wallet.name, 'new balance:', newBal)
                            if (tx.type === 'expense') await checkLowBalance(wallet.id)
                        }
                    }

                    console.log('📊 Total saved transactions:', savedTransactions.length)

                    // Save transfers (simplified)
                    for (const tr of transfers) {
                        const fromW = matchWallet(tr.fromWalletHint)
                        const toW = matchWallet(tr.toWalletHint)
                        if (fromW && toW && fromW.id !== toW.id && fromW.balance >= tr.amount) {
                            await supabase.from('wallets').update({ balance: fromW.balance - tr.amount }).eq('id', fromW.id)
                            await supabase.from('wallets').update({ balance: toW.balance + tr.amount }).eq('id', toW.id)
                            await supabase.from('wallet_transfers').insert({
                                user_id: user.id, from_wallet_id: fromW.id, to_wallet_id: toW.id, amount: tr.amount, description: tr.description
                            })
                        }
                    }

                    if (transactions.length || transfers.length) invalidateUserCache(user.id)

                    // Save assistant message
                    const cleanResponse = fullResponse
                        .replace(/\[TRANSACTION:[^\]]+\]/g, '')
                        .replace(/\[TRANSFER:[^\]]+\]/g, '')
                        .trim()

                    await supabase.from('messages').insert({
                        user_id: user.id,
                        session_id: currentSessionId,
                        role: 'assistant',
                        content: cleanResponse,
                        created_at: new Date().toISOString(),
                    })

                    sendEvent({
                        type: 'data',
                        sessionId: currentSessionId,
                        transactions: savedTransactions
                    })
                    controller.close()

                } catch (error: any) {
                    console.error('❌ Stream processing error:', error)
                    console.error('❌ Error details:', {
                        message: error.message,
                        status: error.status,
                        stack: error.stack
                    })

                    // Handle specific Anthropic errors
                    let errorMsg = 'An unexpected error occurred.'
                    let errorType = 'unknown'

                    if (error.status === 429) {
                        errorMsg = 'Too many requests. Please wait a moment.'
                        errorType = 'rate_limit'
                    } else if (error.status >= 500) {
                        errorMsg = 'Sasha is temporarily unavailable. Please try again.'
                        errorType = 'api_error'
                    } else if (error.message?.includes('timeout')) {
                        errorMsg = 'Sasha took too long to respond.'
                        errorType = 'timeout'
                    }

                    sendEvent({ type: 'error', error: errorMsg, code: errorType })
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        })

    } catch (error) {
        console.error('Chat API Error:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }
}
