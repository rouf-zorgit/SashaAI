import { supabase } from '../supabase';

export interface Message {
    id: string;
    user_id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    intent?: string;
    confidence?: number;
    metadata?: any;
    created_at: string;
}

/**
 * Get all messages for a specific session
 */
export async function getMessagesBySession(
    userId: string,
    sessionId: string
): Promise<{ data: Message[], error: any }> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages by session:', error);
        return { data: [], error };
    }

    return { data: data as Message[], error: null };
}

/**
 * Get recent messages for a user (across all sessions)
 */
export async function getRecentMessages(
    userId: string,
    limit: number = 50
): Promise<{ data: Message[], error: any }> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent messages:', error);
        return { data: [], error };
    }

    // Reverse to get chronological order
    return { data: (data as Message[]).reverse(), error: null };
}

/**
 * Get all messages for a user (legacy - use getMessagesBySession instead)
 * @deprecated Use getMessagesBySession for better performance
 */
export async function getMessages(userId: string): Promise<{ data: Message[], error: any }> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return { data: [], error };
    }

    return { data: data as Message[], error: null };
}

/**
 * Create a new message
 */
export async function createMessage(
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: {
        intent?: string;
        confidence?: number;
        metadata?: any;
    }
): Promise<Message | null> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            user_id: userId,
            session_id: sessionId,
            role,
            content,
            intent: options?.intent,
            confidence: options?.confidence,
            metadata: options?.metadata || {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating message:', error);
        return null;
    }

    return data as Message;
}

/**
 * Delete all messages for a session
 */
export async function deleteSessionMessages(
    userId: string,
    sessionId: string
): Promise<{ success: boolean, error: any }> {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error deleting session messages:', error);
        return { success: false, error };
    }

    return { success: true, error: null };
}
