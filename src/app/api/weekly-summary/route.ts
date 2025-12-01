import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
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
        const anthropicKey = process.env.ANTHROPIC_API_KEY

        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        // Get last 7 days of transactions
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const transactions = await prisma.transactions.findMany({
            where: {
                user_id: authenticatedUserId,
                deleted_at: null,
                created_at: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        })

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

        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const aiResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 300,
            system: 'You are a helpful financial advisor.',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        })

        const summary = aiResponse.content[0].type === 'text'
            ? aiResponse.content[0].text.trim()
            : ''

        return NextResponse.json({
            summary,
            stats: {
                income,
                expenses,
                net: income - expenses,
                topCategory: topCategory ? topCategory[0] : null,
                transactionCount: transactions.length
            }
        })

    } catch (error: any) {
        logger.error('Error generating weekly summary:', error)
        return NextResponse.json(
            { error: 'Failed to generate summary' },
            { status: 500 }
        )
    }
}
