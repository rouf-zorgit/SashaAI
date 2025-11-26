import { useState } from 'react';
import { updateProfile } from '../lib/db/profiles';
import { Loader2, ArrowRight, Check } from 'lucide-react';

export function ProfileOnboarding({ userId, onComplete }: { userId: string, onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        monthly_salary: '',
        currency: 'BDT',
        fixed_costs: '',
        primary_goal: '',
        communication_style: ''
    });

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateProfile(userId, {
                full_name: formData.full_name,
                monthly_salary: parseFloat(formData.monthly_salary) || 0,
                currency: formData.currency,
                fixed_costs: parseFloat(formData.fixed_costs) || 0,
                primary_goal: formData.primary_goal,
                communication_style: formData.communication_style,
                onboarding_completed: true
            });
            onComplete();
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1: return formData.full_name.length > 0;
            case 2: return formData.monthly_salary.length > 0;
            case 3: return formData.fixed_costs.length > 0;
            case 4: return formData.primary_goal.length > 0;
            case 5: return formData.communication_style.length > 0;
            default: return false;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Step 1: Name */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Before we get started, what should I call you?</h2>
                            </div>
                            <input
                                type="text"
                                autoFocus
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Your Name"
                                className="w-full text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && isStepValid() && handleNext()}
                            />
                        </div>
                    )}

                    {/* Step 2: Income */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Nice to meet you, {formData.full_name}!</h2>
                                <p className="text-gray-600 text-lg">To help you better, what’s your monthly income?</p>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-24 p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-600 outline-none bg-white"
                                >
                                    <option value="BDT">BDT</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                                <input
                                    type="number"
                                    autoFocus
                                    value={formData.monthly_salary}
                                    onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                                    placeholder="0.00"
                                    className="flex-1 text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && isStepValid() && handleNext()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fixed Costs */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Great! Now tell me about your fixed monthly costs.</h2>
                                <p className="text-gray-600 text-lg">Things like rent, food, bills — a rough number is fine.</p>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    {formData.currency}
                                </span>
                                <input
                                    type="number"
                                    autoFocus
                                    value={formData.fixed_costs}
                                    onChange={(e) => setFormData({ ...formData, fixed_costs: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full text-lg p-4 pl-16 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && isStepValid() && handleNext()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Goal */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">What is your main financial goal right now?</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'save', label: 'Saving more', icon: '💰' },
                                    { id: 'reduce_expenses', label: 'Reducing expenses', icon: '📉' },
                                    { id: 'debt_control', label: 'Debt control', icon: '🛡️' },
                                    { id: 'invest', label: 'Investing', icon: '📈' }
                                ].map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => {
                                            setFormData({ ...formData, primary_goal: goal.id });
                                            // Small delay to show selection before moving next
                                            setTimeout(() => setStep(5), 200);
                                        }}
                                        className={`p-4 text-left border-2 rounded-xl transition-all flex items-center gap-4 group ${formData.primary_goal === goal.id
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-2xl">{goal.icon}</span>
                                        <span className={`text-lg font-medium ${formData.primary_goal === goal.id ? 'text-blue-900' : 'text-gray-700'
                                            }`}>
                                            {goal.label}
                                        </span>
                                        {formData.primary_goal === goal.id && (
                                            <Check className="ml-auto text-blue-600 w-6 h-6" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Style */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Last thing — how do you like me to talk to you?</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'friendly', label: 'Friendly', desc: 'Warm and encouraging', icon: '😊' },
                                    { id: 'formal', label: 'Formal', desc: 'Professional and concise', icon: '👔' },
                                    { id: 'simple', label: 'Very Simple', desc: 'Like explaining to a grandma', icon: '👵' }
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setFormData({ ...formData, communication_style: style.id })}
                                        className={`p-4 text-left border-2 rounded-xl transition-all flex items-center gap-4 ${formData.communication_style === style.id
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-2xl">{style.icon}</span>
                                        <div className="flex-1">
                                            <div className={`text-lg font-medium ${formData.communication_style === style.id ? 'text-blue-900' : 'text-gray-900'
                                                }`}>
                                                {style.label}
                                            </div>
                                            <div className="text-sm text-gray-500">{style.desc}</div>
                                        </div>
                                        {formData.communication_style === style.id && (
                                            <Check className="ml-auto text-blue-600 w-6 h-6" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-end">
                        {step < 5 ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isStepValid() || loading}
                                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Get Started'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
