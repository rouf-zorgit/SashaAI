import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId } = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'Missing userId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get last 7 days of transactions
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: transactions, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
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

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful financial advisor.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        })

        const aiData = await aiResponse.json()
        const summary = aiData.choices[0].message.content.trim()

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
