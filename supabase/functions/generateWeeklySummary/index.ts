import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAuthenticatedUserId } from '../_shared/auth.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ✅ SECURITY FIX: Validate user from JWT token, not request body
        const authenticatedUserId = await getAuthenticatedUserId(req)
        if (!authenticatedUserId) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized - Invalid or missing authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        // ⚠️ NOTE: userId from request body is IGNORED - we use authenticatedUserId from JWT


        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get last 7 days of transactions (using validated userId from JWT)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: transactions, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', authenticatedUserId)
            .is('deleted_at', null)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })

        if (error) throw error

        // Calculate weekly stats
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

        // Group by category
        const categorySpending = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const cat = t.category
                acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount))
                return acc
            }, {} as Record<string, number>)

        const topCategory = Object.entries(categorySpending)
            .sort(([, a], [, b]) => b - a)[0]

        // Generate AI summary
        const prompt = `Generate a brief, friendly weekly financial summary for a user based on this data:

Weekly Stats:
- Total Income: ${income} BDT
- Total Expenses: ${expenses} BDT
- Net: ${income - expenses} BDT
- Top Spending Category: ${topCategory ? `${topCategory[0]} (${topCategory[1]} BDT)` : 'None'}
- Transaction Count: ${transactions.length}

Requirements:
1. Keep it under 3 sentences
2. Be encouraging and positive
3. Highlight one actionable insight
4. Use simple English
5. Don't use emojis

Return ONLY the summary text, nothing else.`

        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 300,
                system: 'You are a helpful financial advisor.',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        })

        const aiData = await aiResponse.json()
        const summary = aiData.content[0].text.trim()

        return new Response(
            JSON.stringify({
                summary,
                stats: {
                    income,
                    expenses,
                    net: income - expenses,
                    topCategory: topCategory ? topCategory[0] : null,
                    transactionCount: transactions.length
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to generate summary' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
