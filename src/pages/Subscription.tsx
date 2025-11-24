import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getSubscriptionStatus, startFreeTrial, FEATURES, type SubscriptionStatus } from '../lib/subscription';

const Subscription: React.FC = () => {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingTrial, setStartingTrial] = useState(false);

    useEffect(() => {
        if (user) {
            loadStatus();
        }
    }, [user]);

    const loadStatus = async () => {
        if (!user) return;
        try {
            const data = await getSubscriptionStatus(user.id);
            setStatus(data);
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrial = async () => {
        if (!user) return;
        setStartingTrial(true);
        try {
            const success = await startFreeTrial(user.id);
            if (success) {
                await loadStatus();
                alert('7-day free trial activated! Enjoy premium features.');
            } else {
                alert('Failed to start trial. Please try again.');
            }
        } catch (error) {
            console.error('Error starting trial:', error);
        } finally {
            setStartingTrial(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading subscription...</div>;
    }

    const isPremium = status?.tier === 'premium';
    const isTrialActive = status?.trialEndsAt && new Date(status.trialEndsAt) > new Date();

    const freeFeatures = Object.entries(FEATURES)
        .filter(([_, f]) => f.tier === 'free')
        .map(([_, f]) => f.name);

    const premiumFeatures = Object.entries(FEATURES)
        .filter(([_, f]) => f.tier === 'premium')
        .map(([_, f]) => f.name);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
                <p className="text-gray-600">Unlock powerful features to take control of your finances</p>
            </div>

            {/* Current Status */}
            {isPremium && (
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Crown size={24} />
                        <h3 className="text-xl font-bold">Premium Active</h3>
                    </div>
                    {isTrialActive ? (
                        <p className="text-purple-100">
                            Trial ends: {new Date(status.trialEndsAt!).toLocaleDateString()}
                        </p>
                    ) : (
                        <p className="text-purple-100">
                            Expires: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'Never'}
                        </p>
                    )}
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                        <div className="text-4xl font-bold text-gray-900 mb-2">৳0</div>
                        <p className="text-gray-600">Forever free</p>
                    </div>

                    <ul className="space-y-3 mb-8">
                        {freeFeatures.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <Check size={20} className="text-green-600 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                            </li>
                        ))}
                        <li className="flex items-center gap-3 text-gray-400">
                            <X size={20} className="flex-shrink-0" />
                            <span>Limited to 3 goals</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400">
                            <X size={20} className="flex-shrink-0" />
                            <span>90-day history only</span>
                        </li>
                    </ul>

                    <button
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                    >
                        Current Plan
                    </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold">
                        POPULAR
                    </div>

                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-2">Premium</h3>
                        <div className="text-4xl font-bold mb-2">৳299</div>
                        <p className="text-purple-100">per month</p>
                    </div>

                    <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3">
                            <Check size={20} className="text-yellow-300 flex-shrink-0" />
                            <span className="font-medium">Everything in Free</span>
                        </li>
                        {premiumFeatures.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <Check size={20} className="text-yellow-300 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                        <li className="flex items-center gap-3">
                            <Check size={20} className="text-yellow-300 flex-shrink-0" />
                            <span>Unlimited goals & budgets</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Check size={20} className="text-yellow-300 flex-shrink-0" />
                            <span>Full transaction history</span>
                        </li>
                    </ul>

                    {isPremium ? (
                        <button
                            disabled
                            className="w-full py-3 bg-white/20 text-white rounded-xl font-medium cursor-not-allowed"
                        >
                            <Crown className="inline mr-2" size={20} />
                            Active
                        </button>
                    ) : isTrialActive ? (
                        <button
                            disabled
                            className="w-full py-3 bg-white/20 text-white rounded-xl font-medium cursor-not-allowed"
                        >
                            Trial Active
                        </button>
                    ) : (
                        <button
                            onClick={handleStartTrial}
                            disabled={startingTrial}
                            className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors disabled:opacity-50"
                        >
                            {startingTrial ? 'Starting...' : (
                                <>
                                    <Zap className="inline mr-2" size={20} />
                                    Start 7-Day Free Trial
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Can I cancel anytime?</h4>
                        <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-1">What happens after the trial?</h4>
                        <p className="text-gray-600 text-sm">After your 7-day trial, you'll be downgraded to the free plan unless you subscribe to premium.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-1">How do I pay?</h4>
                        <p className="text-gray-600 text-sm">Payment integration coming soon. For now, enjoy the free trial!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
