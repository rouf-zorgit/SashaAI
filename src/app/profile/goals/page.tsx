import { createClient } from '@/lib/supabase/server'
import { getGoalsServer } from '@/lib/queries/server-goals'
import { GoalsClient } from '@/components/goals/GoalsClient'
import { redirect } from 'next/navigation'

export default async function GoalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const goals = await getGoalsServer(user.id)

    return <GoalsClient initialGoals={goals} />
}
