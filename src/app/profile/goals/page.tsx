import { createClient } from '@/lib/supabase/server'
import { getGoalsServer } from '@/lib/queries/server-goals'
import { GoalsClient } from '@/components/goals/GoalsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (goalsError) {
            console.error('Goals error:', JSON.stringify(goalsError, null, 2))
            return <GoalsClient initialGoals={[]} />
        }

        return <GoalsClient initialGoals={goals || []} userId={user.id} />

    } catch (error) {
        console.error('Goals page error:', error)
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