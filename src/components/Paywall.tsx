import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getSubscriptionStatus, hasFeatureAccess, FEATURES } from '../lib/subscription';
import { useNavigate } from 'react-router-dom';

interface PaywallProps {
    feature: keyof typeof FEATURES;
    children?: React.ReactNode;
}

export const Paywall: React.FC<PaywallProps> = ({ feature, children }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (user) {
            getSubscriptionStatus(user.id).then(status => {
                const hasAccess = hasFeatureAccess(feature, status.tier);
                setShowPaywall(!hasAccess);
            });
        }
    }, [user, feature]);

    if (!showPaywall) {
        return <>{children}</>;
    }

    const featureName = FEATURES[feature].name;

    return (
        <div className="relative">
            {/* Blurred content */}
            <div className="filter blur-sm pointer-events-none">
                {children}
            </div>

            {/* Paywall overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border-2 border-purple-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown size={32} className="text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                    <p className="text-gray-600 mb-6">
                        <span className="font-semibold text-purple-600">{featureName}</span> is only available on the Premium plan.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all"
                        >
                            Upgrade to Premium
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Go Back
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mt-4">
                        Start your 7-day free trial today
                    </p>
                </div>
            </div>
        </div>
    );
};


