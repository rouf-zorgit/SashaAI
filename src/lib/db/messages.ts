import { SupabaseClient } from '@supabase/supabase-js'

export interface Message {
    id: string
    user_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
}

export async function getMessages(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 50
): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit)

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data || []
}

export async function saveMessage(
    supabase: SupabaseClient,
    userId: string,
    role: 'user' | 'assistant',
    content: string
): Promise<Message | null> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            user_id: userId,
            role,
            content,
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving message:', error)
        throw error
    }

    return data
}

export async function deleteMessage(
    supabase: SupabaseClient,
    messageId: string
): Promise<void> {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

    if (error) {
        console.error('Error deleting message:', error)
        throw error
    }
}
