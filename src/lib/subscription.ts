import { supabase } from '../supabase';

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionStatus {
    tier: SubscriptionTier;
    isActive: boolean;
    expiresAt?: string;
    trialEndsAt?: string;
}

// Feature definitions
export const FEATURES = {
    // Free tier
    basicTransactions: { tier: 'free' as const, name: 'Basic Transactions' },
    chatWithSasha: { tier: 'free' as const, name: 'Chat with Sasha AI' },
    basicReports: { tier: 'free' as const, name: 'Basic Reports' },

    // Premium tier
    advancedReports: { tier: 'premium' as const, name: 'Advanced Analytics' },
    weeklySummary: { tier: 'premium' as const, name: 'Weekly AI Summary' },
    budgetAlerts: { tier: 'premium' as const, name: 'Budget Alerts' },
    goalTracking: { tier: 'premium' as const, name: 'Unlimited Goals' },
    patternInsights: { tier: 'premium' as const, name: 'Pattern Insights' },
    exportData: { tier: 'premium' as const, name: 'Export Data' },
    prioritySupport: { tier: 'premium' as const, name: 'Priority Support' },
};

// Free tier limits
export const FREE_LIMITS = {
    maxGoals: 3,
    maxBudgets: 5,
    maxReminders: 10,
    historyDays: 90, // Only see last 90 days
};

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expires_at, trial_ends_at')
            .eq('id', userId)
            .single();

        if (!profile) {
            return { tier: 'free', isActive: true };
        }

        const now = new Date();
        const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
        const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;

        // Check if premium is active
        const isPremiumActive =
            profile.subscription_tier === 'premium' &&
            (!expiresAt || expiresAt > now);

        // Check if trial is active
        const isTrialActive = trialEndsAt && trialEndsAt > now;

        return {
            tier: (isPremiumActive || isTrialActive) ? 'premium' : 'free',
            isActive: true,
            expiresAt: profile.subscription_expires_at,
            trialEndsAt: profile.trial_ends_at,
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return { tier: 'free', isActive: true };
    }
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
    feature: keyof typeof FEATURES,
    userTier: SubscriptionTier
): boolean {
    const requiredTier = FEATURES[feature].tier;

    if (requiredTier === 'free') return true;
    if (requiredTier === 'premium' && userTier === 'premium') return true;

    return false;
}

/**
 * Check if user is within free tier limits
 */
export function isWithinLimit(
    limitType: keyof typeof FREE_LIMITS,
    currentCount: number,
    userTier: SubscriptionTier
): boolean {
    if (userTier === 'premium') return true;
    return currentCount < FREE_LIMITS[limitType];
}

/**
 * Start free trial (7 days)
 */
export async function startFreeTrial(userId: string): Promise<boolean> {
    try {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        const { error } = await supabase
            .from('profiles')
            .update({
                trial_ends_at: trialEndsAt.toISOString(),
                subscription_tier: 'premium'
            })
            .eq('id', userId);

        return !error;
    } catch (error) {
        console.error('Error starting trial:', error);
        return false;
    }
}
