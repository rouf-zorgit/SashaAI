import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

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

        // Parse request body
        const body = await request.json()
        const { messages } = body

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Messages array is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

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
                            // Send as Server-Sent Event
                            controller.enqueue(
                                new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                            )
                        }

                        if (event.type === 'message_stop') {
                            // Send done signal
                            controller.enqueue(
                                new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                            )
                        }
                    }

                    controller.close()
                } catch (error) {
                    console.error('Error streaming from Claude:', error)
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({ error: 'Failed to get response from Sasha' })}\n\n`
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
