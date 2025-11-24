import { useState } from 'react';
import { getUserProfileExtended, updateUserProfileExtended, createUserProfileExtended } from '../lib/db/sasha';

export function ProfileOnboarding({ userId, onComplete }: { userId: string, onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        spending_personality: 'balanced',
        primary_goal: 'save',
        monthly_budget: 30000,
        salary_day: 1,
        sarcasm_preference: 'medium'
    });

    const handleSubmit = async () => {
        try {
            const existing = await getUserProfileExtended(userId);
            if (existing) {
                await updateUserProfileExtended(userId, { ...formData, onboarding_completed: true } as any);
            } else {
                await createUserProfileExtended({ user_id: userId, ...formData, onboarding_completed: true } as any);
            }
            onComplete();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Sasha</h2>
                <p className="text-gray-500 mb-6">Let's set up your financial personality.</p>

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">What's your spending vibe?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['impulsive', 'balanced', 'cautious'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, spending_personality: type })}
                                        className={`p-3 rounded-lg border text-sm capitalize ${formData.spending_personality === type
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold mt-4"
                        >
                            Next
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                            <select
                                value={formData.primary_goal}
                                onChange={(e) => setFormData({ ...formData, primary_goal: e.target.value })}
                                className="w-full p-3 border rounded-lg"
                            >
                                <option value="save">Save Money</option>
                                <option value="invest">Start Investing</option>
                                <option value="debt_free">Kill Debt</option>
                                <option value="budget">Stick to Budget</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (BDT)</label>
                            <input
                                type="number"
                                value={formData.monthly_budget}
                                onChange={(e) => setFormData({ ...formData, monthly_budget: parseInt(e.target.value) })}
                                className="w-full p-3 border rounded-lg"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-lg">Back</button>
                            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sasha's Sarcasm Level</label>
                            <div className="space-y-2">
                                {[
                                    { val: 'off', label: 'Off (Boring)', desc: 'Just the facts.' },
                                    { val: 'low', label: 'Low (Gentle)', desc: 'Kind but firm.' },
                                    { val: 'medium', label: 'Medium (Default)', desc: 'Witty and sharp.' },
                                    { val: 'high', label: 'High (Roast Me)', desc: 'Emotional damage.' }
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setFormData({ ...formData, sarcasm_preference: opt.val })}
                                        className={`w-full p-3 rounded-lg border text-left flex justify-between items-center ${formData.sarcasm_preference === opt.val
                                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="font-medium text-gray-900">{opt.label}</span>
                                        <span className="text-xs text-gray-500">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-lg">Back</button>
                            <button onClick={handleSubmit} className="flex-1 py-3 bg-black text-white rounded-lg font-bold">Finish</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
