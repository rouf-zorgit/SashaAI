import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/app/actions/notifications'

/**
 * API Route to generate weekly summary for current user
 * POST /api/generate-weekly-summary
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

        // Generate weekly summary
        await generateWeeklySummary(user.id)

        return NextResponse.json({
            success: true,
            message: 'Weekly summary generated successfully'
        })

    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
