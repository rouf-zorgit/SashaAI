import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/app/actions/notifications'

/**
 * Weekly Summary Cron Job
 * Runs: Every Monday at 9:00 AM (0 9 * * 1)
 * 
 * Generates comprehensive weekly financial reports for all users
 */
export async function GET(request: NextRequest) {
    try {
        // Verify this is a cron request (Vercel adds this header)
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const supabase = await createClient()

        // Get all active users
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')

        if (usersError || !users) {
            console.error('Error fetching users:', usersError)
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            )
        }

        console.log(`Generating weekly summaries for ${users.length} users...`)

        // Generate weekly summary for each user
        const results = await Promise.allSettled(
            users.map(async (user) => {
                try {
                    await generateWeeklySummary(user.id)
                    return { userId: user.id, success: true }
                } catch (error) {
                    console.error(`Error for user ${user.id}:`, error)
                    return { userId: user.id, success: false, error }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        console.log(`Weekly summaries complete: ${successful} successful, ${failed} failed`)

        return NextResponse.json({
            success: true,
            message: 'Weekly summaries generated',
            stats: {
                totalUsers: users.length,
                successful,
                failed
            }
        })

    } catch (error: any) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
