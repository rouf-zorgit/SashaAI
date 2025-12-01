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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get all users (in a real app, we might process in batches)
        const { data: users, error: userError } = await supabaseClient
            .from('profiles')
            .select('id')
        
        if (userError) throw userError

        const results = []

        for (const user of users) {
            const userId = user.id
            console.log(`Analyzing patterns for user ${userId}...`)

            // 1. Fetch last 90 days of transactions
            const ninetyDaysAgo = new Date()
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
            
            const { data: transactions } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', ninetyDaysAgo.toISOString())
                .order('created_at', { ascending: true })

            if (!transactions || transactions.length < 10) {
                console.log(`Not enough data for user ${userId}`)
                continue
            }

            // ==========================================
            // A. RECURRING PAYMENTS DETECTION
            // ==========================================
            const merchantGroups: Record<string, any[]> = {}
            transactions.forEach(t => {
                if (t.type === 'expense') {
                    // Use description as merchant proxy since merchant_name column doesn't exist
                    const key = t.description || 'Unknown'
                    if (!merchantGroups[key]) merchantGroups[key] = []
                    merchantGroups[key].push(t)
                }
            })

            for (const [merchant, txs] of Object.entries(merchantGroups)) {
                if (txs.length >= 2) {
                    // Check intervals
                    let isRecurring = true
                    let _totalInterval = 0
                    let count = 0
                    
                    for (let i = 1; i < txs.length; i++) {
                        const d1 = new Date(txs[i-1].created_at).getTime()
                        const d2 = new Date(txs[i].created_at).getTime()
                        const days = (d2 - d1) / (1000 * 60 * 60 * 24)
                        
                        // Allow variance (e.g., 28-32 days for monthly)
                        if (days >= 25 && days <= 35) {
                            _totalInterval += days
                            count++
                        } else {
                            isRecurring = false
                        }
                    }

                    if (isRecurring && count > 0) {
                        const avgAmount = txs.reduce((sum, t) => sum + Number(t.amount), 0) / txs.length
                        const lastTx = txs[txs.length - 1]
                        const nextDue = new Date(lastTx.created_at)
                        nextDue.setDate(nextDue.getDate() + 30) // Assume monthly for now

                        await supabaseClient.from('recurring_payments').upsert({
                            user_id: userId,
                            merchant_name: merchant,
                            amount: avgAmount,
                            frequency: 'monthly',
                            next_due_date: nextDue.toISOString(),
                            last_paid_date: lastTx.created_at,
                            confidence: 0.9
                        }, { onConflict: 'user_id, merchant_name' }) // Assuming composite unique key or just insert
                        
                        results.push({ user: userId, type: 'recurring', merchant })
                    }
                }
            }

            // ==========================================
            // B. WEEKEND SPIKE DETECTION
            // ==========================================
            let weekendSum = 0, weekendCount = 0
            let weekdaySum = 0, weekdayCount = 0

            transactions.forEach(t => {
                if (t.type === 'expense') {
                    const day = new Date(t.created_at).getDay()
                    if (day === 0 || day === 6) { // Sun=0, Sat=6 (Adjust based on locale, assuming Sat/Sun weekend)
                        weekendSum += Number(t.amount)
                        weekendCount++
                    } else {
                        weekdaySum += Number(t.amount)
                        weekdayCount++
                    }
                }
            })

            const avgWeekend = weekendCount > 0 ? weekendSum / weekendCount : 0
            const avgWeekday = weekdayCount > 0 ? weekdaySum / weekdayCount : 0

            if (avgWeekend > avgWeekday * 1.5 && avgWeekend > 1000) {
                await supabaseClient.from('spending_patterns').upsert({
                    user_id: userId,
                    pattern_type: 'weekend_spike',
                    trigger_day: 'Saturday/Sunday',
                    avg_amount: avgWeekend,
                    confidence: 0.85,
                    detection_metadata: { weekend_avg: avgWeekend, weekday_avg: avgWeekday }
                })
                results.push({ user: userId, type: 'weekend_spike' })
            }

            // ==========================================
            // C. PAYDAY SPLURGE DETECTION
            // ==========================================
            const incomes = transactions.filter(t => t.type === 'income' && Number(t.amount) > 5000)
            
            for (const income of incomes) {
                const incomeDate = new Date(income.created_at).getTime()
                const limitDate = incomeDate + (48 * 60 * 60 * 1000) // 48 hours
                
                const splurgeSum = transactions
                    .filter(t => t.type === 'expense' && 
                           new Date(t.created_at).getTime() > incomeDate && 
                           new Date(t.created_at).getTime() < limitDate)
                    .reduce((sum, t) => sum + Number(t.amount), 0)

                if (splurgeSum > Number(income.amount) * 0.3) {
                    await supabaseClient.from('spending_patterns').upsert({
                        user_id: userId,
                        pattern_type: 'payday_splurge',
                        trigger_category: 'General',
                        avg_amount: splurgeSum,
                        confidence: 0.9,
                        detection_metadata: { income: income.amount, spent_48h: splurgeSum }
                    })
                    results.push({ user: userId, type: 'payday_splurge' })
                    break // Only flag once per analysis
                }
            }

            // ==========================================
            // D. CATEGORY ADDICTION
            // ==========================================
            const categoryCounts: Record<string, number> = {}
            const categorySums: Record<string, number> = {}
            let totalSpend = 0

            transactions.forEach(t => {
                if (t.type === 'expense') {
                    const cat = t.category || 'Uncategorized'
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
                    categorySums[cat] = (categorySums[cat] || 0) + Number(t.amount)
                    totalSpend += Number(t.amount)
                }
            })

            for (const [cat, count] of Object.entries(categoryCounts)) {
                const amount = categorySums[cat]
                // > 20% of total spend OR > 5 times per week (approx > 60 in 90 days)
                if ((amount > totalSpend * 0.2 && cat !== 'Rent' && cat !== 'Bills') || count > 60) {
                    await supabaseClient.from('spending_patterns').upsert({
                        user_id: userId,
                        pattern_type: 'impulse_category',
                        trigger_category: cat,
                        avg_amount: amount / count,
                        frequency: 'high',
                        confidence: 0.85,
                        detection_metadata: { total_count: count, total_amount: amount, pct_of_total: amount/totalSpend }
                    })
                    results.push({ user: userId, type: 'addiction', category: cat })
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, analyzed: users.length, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
