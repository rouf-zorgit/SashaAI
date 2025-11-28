import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { Goal } from '@/types/database'

export const getGoalsServer = cache(async (userId: string): Promise<Goal[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
})
