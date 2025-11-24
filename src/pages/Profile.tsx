import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../lib/db/profiles';
import { Loader2, Save } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../lib/exchangeRates';

import { SarcasmSettings } from '../components/SarcasmSettings';
import { ProfileOnboarding } from '../components/ProfileOnboarding';
import { getUserProfileExtended } from '../lib/db/sasha';

const Profile: React.FC = () => {
    const { user, profile } = useAuthStore();
    const [fullName, setFullName] = useState('');
    const [monthlySalary, setMonthlySalary] = useState('');
    const [defaultCurrency, setDefaultCurrency] = useState('BDT');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [sarcasmLevel, setSarcasmLevel] = useState('medium');
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setMonthlySalary(profile.monthly_salary?.toString() || '');
            setDefaultCurrency((profile as any).default_currency || 'BDT');
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            getUserProfileExtended(user.id).then(p => {
                if (p) {
                    setSarcasmLevel(p.sarcasm_preference || 'medium');
                    if (!p.onboarding_completed) setShowOnboarding(true);
                } else {
                    setShowOnboarding(true);
                }
            });
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(user.id, {
                full_name: fullName,
                monthly_salary: monthlySalary ? parseInt(monthlySalary) : undefined,
                default_currency: defaultCurrency,
            } as any);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">User Profile</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mb-8">
                {message && (
                    <div className={`mb-4 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Currency</label>
                        <select
                            value={defaultCurrency}
                            onChange={(e) => setDefaultCurrency(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {SUPPORTED_CURRENCIES.map((currency) => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.code} - {currency.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Transactions will be converted to this currency</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income ({defaultCurrency})</label>
                        <input
                            type="number"
                            value={monthlySalary}
                            onChange={(e) => setMonthlySalary(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            <div className="max-w-2xl">
                <SarcasmSettings
                    userId={user.id}
                    currentLevel={sarcasmLevel}
                    onUpdate={setSarcasmLevel}
                />
            </div>

            {showOnboarding && (
                <ProfileOnboarding
                    userId={user.id}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}
        </div>
    );
};

export default Profile;
