'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOlderMessages(userId: string, before: string, limit = 50) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .lt('created_at', before)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching older messages:', error)
        return []
    }

    return data.reverse()
}
