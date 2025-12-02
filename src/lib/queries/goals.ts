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

    console.log('🎯 Creating goal with data:', {
        user_id: userId,
        title: goal.title,
        target_amount: goal.target_amount,
        current_amount: 0,
        deadline: goal.deadline,
        category: goal.category,
        is_completed: false
    })

    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id: userId,
            title: goal.title,
            target_amount: goal.target_amount,
            current_amount: 0,
            deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null,
            category: goal.category || 'general',
            is_completed: false
        })
        .select()
        .abortSignal(AbortSignal.timeout(10000)) // 10 second timeout

    if (error) {
        console.error('❌ Goal creation error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        throw error
    }

    const createdGoal = data && data.length > 0 ? data[0] : null

    if (!createdGoal) {
        console.error('❌ No goal returned from insert')
        throw new Error('Goal creation failed - no data returned')
    }

    console.log('✅ Goal created successfully:', createdGoal)
    return createdGoal
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
            updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()

    if (error) {
        console.error('Goal update error:', error)
        throw error
    }

    return data && data.length > 0 ? data[0] : null
}

export async function deleteGoal(goalId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

    if (error) throw error
}