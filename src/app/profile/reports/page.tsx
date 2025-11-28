import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { getProfile } from '@/lib/db/profiles'
import { getMonthlyReport } from '@/lib/queries/reports'

export default async function ReportsPage() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        const profile = await getProfile(supabase, user.id)
        const currency = profile?.currency || 'USD'

        // Get current month report
        const now = new Date()
        const report = await getMonthlyReport(user.id, now.getFullYear(), now.getMonth() + 1)

        return (
            <ReportsClient
                initialData={report}
                user={user}
                currency={currency}
            />
        )

    } catch (error) {
        console.error('Reports page error:', error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground">Please refresh the page</p>
                </div>
            </div>
        )
    }
}
