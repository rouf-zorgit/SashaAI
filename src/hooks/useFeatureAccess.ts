import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getSubscriptionStatus, hasFeatureAccess, FEATURES } from '../lib/subscription';

export function useFeatureAccess(feature: keyof typeof FEATURES): boolean {
    const { user } = useAuthStore();
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        if (user) {
            getSubscriptionStatus(user.id).then(status => {
                setHasAccess(hasFeatureAccess(feature, status.tier));
            });
        }
    }, [user, feature]);

    return hasAccess;
}
