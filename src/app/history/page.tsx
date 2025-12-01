import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from '@/components/history/HistoryClient'
import { getProfile } from '@/lib/db/profiles'

export const dynamic = 'force-dynamic'

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

        // Fetch transactions with wallet information
        const { data: rawTransactions, error: txError } = await supabase
            .from('transactions')
            .select('*, wallet:wallets(id, name, type, currency)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100)

        // Fetch notifications
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        // Fetch wallets for filter dropdown
        const { data: wallets } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })


        if (txError) console.error('Transactions error:', JSON.stringify(txError, null, 2))
        if (notifError) console.error('Notifications error:', JSON.stringify(notifError, null, 2))

        // Map transactions to ensure date property exists (fallback to created_at)
        const transactions = rawTransactions?.map(t => ({
            ...t,
            date: t.date || t.created_at
        })) || []

        return (
            <HistoryClient
                initialTransactions={transactions}
                initialNotifications={notifications || []}
                user={user}
                currency={currency}
                wallets={wallets || []}
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
