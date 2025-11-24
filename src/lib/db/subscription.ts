import { supabase } from '../supabase';
import type { SubscriptionPlan } from '../../types/supabase';

export async function checkSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
        .from('subscription_status')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking subscription:', error);
        return null;
    }
    return data;
}

export async function updateSubscription(userId: string, plan: SubscriptionPlan, expiresAt: string) {
    const { data, error } = await supabase
        .from('subscription_status')
        .upsert({
            user_id: userId,
            plan,
            expires_at: expiresAt,
            is_active: new Date(expiresAt) > new Date()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}
