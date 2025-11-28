import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const SASHA_SYSTEM_PROMPT = `You are Sasha, a friendly AI finance assistant. Be BRIEF and casual.

CRITICAL: When user mentions spending or earning money, you MUST include a transaction marker in your response.

FORMAT:
[TRANSACTION: amount=500, category=dining, type=expense, description=lunch today]

CATEGORIES:
- groceries, transport, entertainment, bills, shopping, food, dining, health, other
- For income: use category=income

TYPES:
- expense (for spending)
- income (for earning)

EXAMPLES:

User: "I spent 500 on lunch"
Your response: "Logged ৳500 for lunch! 🍽️ [TRANSACTION: amount=500, category=dining, type=expense, description=lunch]"

User: "Paid 2000 for electricity bill"
Your response: "Got it! ৳2000 for electricity 💡 [TRANSACTION: amount=2000, category=bills, type=expense, description=electricity bill]"

User: "Got my salary 50000"
Your response: "Nice! ৳50,000 income logged 💰 [TRANSACTION: amount=50000, category=income, type=income, description=monthly salary]"

User: "Bought groceries for 1500"
Your response: "Logged ৳1500 for groceries 🛒 [TRANSACTION: amount=1500, category=groceries, type=expense, description=groceries]"

IMPORTANT:
- ALWAYS include the [TRANSACTION:...] marker when logging expenses/income
- The marker can be anywhere in your response
- Keep the user-visible part brief and friendly
- The marker will be hidden from the user
`

function extractTransaction(aiResponse: string): any {
    console.log('🔍 Checking response for [TRANSACTION:...');

    // Look for [TRANSACTION: amount=X, category=Y, type=Z, description=W]
    const regex = /\[TRANSACTION:\s*amount=([0-9.]+),\s*category=(\w+),\s*type=(\w+),\s*description=([^\]]+)\]/;
    const match = aiResponse.match(regex);

    if (!match) {
        console.log('⚠️ No [TRANSACTION:...] marker found in response');
        return null;
    }

    console.log('✅ Transaction marker found!');

    return {
        amount: parseFloat(match[1]),
        category: match[2],
        type: match[3],
        description: match[4].trim(),
    };
}

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

        console.log('🔍 AI Response:', fullResponse);
        console.log('🔍 Attempting to extract transaction...');

        const transaction = extractTransaction(fullResponse);

        console.log('🔍 Extracted transaction:', transaction);

        if (transaction) {
            console.log('� Saving transaction to database...');
            console.log('💾 Transaction data:', JSON.stringify(transaction, null, 2));

            const { data: savedTx, error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    amount: transaction.amount,
                    category: transaction.category,
                    type: transaction.type,
                    description: transaction.description,
                    date: new Date().toISOString().split('T')[0],
                })
                .select()
                .single();

            if (txError) {
                console.error('❌ TRANSACTION SAVE FAILED:', txError);
                console.error('❌ Error code:', txError.code);
                console.error('❌ Error message:', txError.message);
                console.error('❌ Error details:', JSON.stringify(txError, null, 2));
            } else {
                console.log('✅ TRANSACTION SAVED SUCCESSFULLY:', savedTx);
            }
        } else {
            console.log('⚠️ No transaction found in AI response');
        }

        // Then save assistant message (without the [TRANSACTION] marker visible to user)
        const cleanResponse = fullResponse.replace(/\[TRANSACTION:[^\]]+\]/g, '').trim();

        // CRITICAL: Save assistant message to database
        console.log('💾 Chat API: Saving assistant message...')
        const { error: assistantMessageError } = await supabase
            .from('messages')
            .insert({
                user_id: user.id,
                session_id: currentSessionId,
                role: 'assistant',
                content: cleanResponse,
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
                message: cleanResponse,
                sessionId: currentSessionId,
                transaction: transaction, // Send transaction info for toast notification
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
