import { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../../types/supabase';

// Define a simpler update type since we don't have the validator yet
export type ProfileUpdateInput = Partial<Profile>;

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function updateProfile(supabase: SupabaseClient, userId: string, updates: ProfileUpdateInput) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createProfileIfNotExists(
    supabase: SupabaseClient,
    userId: string,
    email: string,
    fullName?: string
) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: userId,
                email,
                full_name: fullName,
            },
            { onConflict: 'id', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle(); // Use maybeSingle to avoid error if RLS blocks return

    if (error) throw error;
    return data;
}
