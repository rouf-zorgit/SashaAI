import { supabase } from '../supabase';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    created_at: string;
}

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

export async function createMessage(userId: string, text: string, sender: 'user' | 'ai'): Promise<Message | null> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            user_id: userId,
            text,
            sender,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating message:', error);
        return null;
    }

    return data as Message;
}
