import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    checkBudgetExceeded,
    checkGoalProgress,
    checkUpcomingBills,
    checkUnusualSpending
} from '@/app/actions/notifications'

/**
 * Daily Notification Cron Job
 * Runs: Every day at 9:00 AM (0 9 * * *)
 * 
 * Checks:
 * - Budget exceeded/warnings
 * - Goal progress and risks
 * - Upcoming bills (3-day window)
 * - Unusual spending patterns
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

        console.log(`Running daily checks for ${users.length} users...`)

        // Run checks for each user
        const results = await Promise.allSettled(
            users.map(async (user) => {
                try {
                    await Promise.all([
                        checkBudgetExceeded(user.id),
                        checkGoalProgress(user.id),
                        checkUpcomingBills(user.id),
                        checkUnusualSpending(user.id)
                    ])
                    return { userId: user.id, success: true }
                } catch (error) {
                    console.error(`Error for user ${user.id}:`, error)
                    return { userId: user.id, success: false, error }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        console.log(`Daily checks complete: ${successful} successful, ${failed} failed`)

        return NextResponse.json({
            success: true,
            message: 'Daily notification checks completed',
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
