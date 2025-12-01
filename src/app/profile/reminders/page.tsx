import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RemindersClient } from '@/components/reminders/RemindersClient'
import { getProfile } from '@/lib/db/profiles'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        const profile = await getProfile(supabase, user.id)
        const currency = profile?.currency || 'USD'

        const { data: reminders, error: remindersError } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true })

        if (remindersError) {
            console.error('Reminders error:', remindersError)
            return <RemindersClient initialReminders={[]} user={user} currency={currency} />
        }

        return (
            <RemindersClient
                initialReminders={reminders || []}
                user={user}
                currency={currency}
            />
        )

    } catch (error) {
        console.error('Reminders page error:', error)
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
