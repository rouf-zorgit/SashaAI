import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runNotificationChecks } from '@/app/actions/notifications'

/**
 * API Route to manually trigger Sasha's notification intelligence checks
 * POST /api/run-notification-checks
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Run all notification checks
        const result = await runNotificationChecks(user.id)

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to run notification checks', details: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Notification checks completed successfully'
        })

    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
