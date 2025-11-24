import { supabase } from '../supabase';
import type { Profile } from '../../types/supabase';
import type { ProfileUpdateInput } from '../validators/profile';

export async function getProfile(userId: string): Promise<Profile | null> {
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

export async function updateProfile(userId: string, updates: ProfileUpdateInput) {
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
                // monthly_salary is nullable, so we don't need to set it here unless we have a default
                // created_at and updated_at are handled by defaults/triggers
            },
            { onConflict: 'id', ignoreDuplicates: true }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
