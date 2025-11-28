import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from '@/components/history/HistoryClient'
import { getProfile } from '@/lib/db/profiles'

export default async function HistoryPage() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        // Fetch profile for currency
        const profile = await getProfile(supabase, user.id)
        const currency = profile?.currency || 'USD'

        // Fetch transactions
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('date', { ascending: false })
            .limit(100)

        // Fetch notifications
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)


        if (txError) console.error('Transactions error:', JSON.stringify(txError, null, 2))
        if (notifError) console.error('Notifications error:', JSON.stringify(notifError, null, 2))

        return (
            <HistoryClient
                initialTransactions={transactions || []}
                initialNotifications={notifications || []}
                user={user}
                currency={currency}
            />
        )

    } catch (error) {
        console.error('History page error:', error)
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
