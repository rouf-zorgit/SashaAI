import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/types/database'

export async function getUserGoals(userId: string): Promise<Goal[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

export async function createGoal(
    userId: string,
    goal: {
        title: string
        target_amount: number
        deadline?: string
        category?: string
    }
) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id: userId,
            ...goal,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateGoalProgress(
    goalId: string,
    currentAmount: number
) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('goals')
        .update({
            current_amount: currentAmount,
            updated_at: new Date().toISOString(),
            is_completed: false, // Logic should be handled by caller or DB trigger, but simple check here
        })
        .eq('id', goalId)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteGoal(goalId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

    if (error) throw error
}
