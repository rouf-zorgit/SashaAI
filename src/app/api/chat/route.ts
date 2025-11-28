import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { generateSessionId } from '@/lib/sessions'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

const SASHA_SYSTEM_PROMPT = `You are Sasha, a friendly and helpful AI finance assistant. Your role is to help users track their income and expenses through natural conversation.

**Your Personality:**
- Warm, encouraging, and supportive
- Use casual, friendly language
- Celebrate financial wins with users
- Be empathetic about financial challenges

**Transaction Detection:**
When users mention spending or earning money, help them track it. If you detect a transaction, include it at the end of your response in this exact format:

[TRANSACTION: amount=50, category=groceries, type=expense, description=weekly shopping]

**Categories:** groceries, transport, entertainment, bills, shopping, food, health, dining, salary, freelance, investment, gift, other

**Types:** income or expense

**Examples:**
User: "I spent $50 on groceries today"
You: "Got it! I've logged your $50 grocery expense. That's great that you're keeping track of your spending! [TRANSACTION: amount=50, category=groceries, type=expense, description=grocery shopping]"

User: "Got paid $3000 this month"
You: "Awesome! Congratulations on your paycheck! I've recorded your $3000 income. [TRANSACTION: amount=3000, category=salary, type=income, description=monthly salary]"

**Important:**
- Only include [TRANSACTION: ...] when there's a clear financial transaction
- Always be conversational and friendly first
- If unclear, ask for clarification
- Help users understand their spending patterns`

import { chatRequestSchema } from '@/lib/validations/chat'
import { rateLimit } from '@/lib/rate-limit'

// ... imports ...

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Rate Limiting
        const limit = rateLimit(user.id)
        if (!limit.success) {
            return new Response(
                JSON.stringify({ error: 'Too many requests. Please try again later.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': limit.limit.toString(),
                        'X-RateLimit-Remaining': limit.remaining.toString(),
                        'X-RateLimit-Reset': limit.reset.toString()
                    }
                }
            )
        }

        // Get user profile for context
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // Parse request body
        const body = await request.json()

        // Input Validation
        const validationResult = chatRequestSchema.safeParse(body)
        if (!validationResult.success) {
            return new Response(
                JSON.stringify({ error: 'Invalid request', details: validationResult.error.format() }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const { messages, sessionId: providedSessionId, mode } = validationResult.data

        // Generate or use provided session ID
        const sessionId = providedSessionId || generateSessionId()

        // Save user message to database
        const userMessage = messages[messages.length - 1]
        if (userMessage && userMessage.role === 'user') {
            await supabase.from('messages').insert({
                user_id: user.id,
                session_id: sessionId,
                role: 'user',
                content: userMessage.content,
                metadata: { mode }
            })
        }

        // HYBRID APPROACH: Choose between fast and deep mode
        if (mode === 'deep') {
            // Call Supabase Edge Function for deep learning
            try {
                const { data, error } = await supabase.functions.invoke('processChat', {
                    body: {
                        userId: user.id,
                        sessionId,
                        message: userMessage.content,
                        profile: {
                            full_name: profile?.full_name,
                            monthly_salary: profile?.monthly_salary,
                            currency: profile?.currency,
                            primary_goal: profile?.primary_goal,
                            communication_style: profile?.communication_style
                        }
                    }
                })

                if (error) throw error

                // Save AI response to database
                await supabase.from('messages').insert({
                    user_id: user.id,
                    session_id: sessionId,
                    role: 'assistant',
                    content: data.response,
                    intent: data.intent,
                    confidence: data.confidence,
                    metadata: {
                        mode: 'deep',
                        transactions: data.transactions,
                        memory_updated: true
                    }
                })

                return new Response(
                    JSON.stringify({
                        response: data.response,
                        sessionId,
                        mode: 'deep',
                        transactions: data.transactions
                    }),
                    { headers: { 'Content-Type': 'application/json' } }
                )
            } catch (error: any) {
                console.error('Edge function error:', error)
                // Fall back to fast mode if edge function fails
            }
        }

        // FAST MODE: Use Next.js streaming for quick responses
        let fullResponse = ''

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Call Claude API with streaming
                    const response = await anthropic.messages.create({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 1024,
                        system: SASHA_SYSTEM_PROMPT,
                        messages: messages,
                        stream: true,
                    })

                    // Stream the response
                    for await (const event of response) {
                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                            const text = event.delta.text
                            fullResponse += text
                            // Send as Server-Sent Event
                            controller.enqueue(
                                new TextEncoder().encode(`data: ${JSON.stringify({ text, sessionId })}\\n\\n`)
                            )
                        }

                        if (event.type === 'message_stop') {
                            // Save AI response to database
                            await supabase.from('messages').insert({
                                user_id: user.id,
                                session_id: sessionId,
                                role: 'assistant',
                                content: fullResponse,
                                metadata: { mode: 'fast' }
                            })

                            // Send done signal
                            controller.enqueue(
                                new TextEncoder().encode(`data: ${JSON.stringify({ done: true, sessionId })}\\n\\n`)
                            )
                        }
                    }

                    controller.close()
                } catch (error) {
                    console.error('Error streaming from Claude:', error)
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({ error: 'Failed to get response from Sasha' })}\\n\\n`
                        )
                    )
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Error in chat API:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
