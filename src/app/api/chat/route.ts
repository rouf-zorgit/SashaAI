import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

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
    console.log('🚀 Chat API: Request received')
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            console.error('❌ Chat API: ANTHROPIC_API_KEY is missing')
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing API Key' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const anthropic = new Anthropic({
            apiKey: apiKey,
        })

        // Get authenticated user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('❌ Chat API: Unauthorized', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }
        console.log('👤 Chat API: User authenticated', user.id)

        // Parse request body
        const body = await request.json()
        const { messages, sessionId: providedSessionId } = body

        // Get or create session ID
        const currentSessionId = providedSessionId || `session_${Date.now()}_${Math.random().toString(36)}`
        console.log('🆔 Chat API: Session ID:', currentSessionId)

        // Get last user message
        const lastUserMessage = messages[messages.length - 1]

        // CRITICAL: Save user message to database FIRST
        console.log('💾 Chat API: Saving user message...')
        const { error: userMessageError } = await supabase
            .from('messages')
            .insert({
                user_id: user.id,
                session_id: currentSessionId,
                role: 'user',
                content: lastUserMessage.content,
                created_at: new Date().toISOString(),
            })

        if (userMessageError) {
            console.error('❌ Failed to save user message:', userMessageError)
            return new Response(
                JSON.stringify({
                    error: 'Failed to save message',
                    details: userMessageError
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }
        console.log('✅ Chat API: User message saved')

        // Get user profile for context
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // Construct dynamic system prompt with user context
        let systemPrompt = SASHA_SYSTEM_PROMPT
        if (profile) {
            const userContext = `
            
**User Context:**
- Name: ${profile.full_name || 'User'}
- Country: ${profile.country || 'Unknown'}
- Currency: ${profile.currency || 'USD'}
- Monthly Salary: ${profile.monthly_salary ? `${profile.currency} ${profile.monthly_salary}` : 'Not set'}
- Primary Goal: ${profile.primary_goal || 'Not set'}
`
            systemPrompt += userContext
        }

        console.log('🤖 Chat API: Calling Claude API...')
        // Call Claude API (non-streaming for reliability)
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        })
        console.log('📥 Chat API: Claude response received')

        // Get the text content from the response
        const contentBlock = response.content[0]
        const fullResponse = contentBlock.type === 'text' ? contentBlock.text : ''

        // CRITICAL: Save assistant message to database
        console.log('💾 Chat API: Saving assistant message...')
        const { error: assistantMessageError } = await supabase
            .from('messages')
            .insert({
                user_id: user.id,
                session_id: currentSessionId,
                role: 'assistant',
                content: fullResponse,
                created_at: new Date().toISOString(),
            })

        if (assistantMessageError) {
            console.error('❌ Failed to save assistant message:', assistantMessageError)
        } else {
            console.log('✅ Chat API: Assistant message saved')
        }

        // Return response to client
        return new Response(
            JSON.stringify({
                message: fullResponse,
                sessionId: currentSessionId,
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Chat API: Internal server error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
