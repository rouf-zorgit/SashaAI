import { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { saveScenario } from '../lib/db/sasha';
import { supabase } from '../lib/supabase';

export function ScenarioPlanner({ userId }: { userId: string }) {
    const [scenario, setScenario] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const runScenario = async () => {
        if (!scenario.trim()) return;
        setLoading(true);

        try {
            // For MVP, we simulate the calculation here or call an Edge Function
            // Let's do a simple simulation locally for speed, or call OpenAI via processChat if we want full AI
            // But the plan was to use a dedicated table/logic.
            // Let's use a simplified logic here for the MVP component

            const { data: profile } = await supabase
                .from('user_profiles_extended')
                .select('monthly_income, monthly_budget')
                .eq('user_id', userId)
                .single();

            const income = profile?.monthly_income || 50000;
            const budget = profile?.monthly_budget || 30000;

            // Simple parsing
            let sashaComment = '';
            let outcome = {};

            if (scenario.toLowerCase().includes('save')) {
                const amount = parseInt(scenario.match(/\d+/)?.[0] || '0');
                const buffer = income - budget - amount;
                const feasible = buffer > 0;

                sashaComment = feasible
                    ? `Feasible. You'd have ${buffer} BDT left. In 1 year, you'd have ${amount * 12} BDT. Empire building.`
                    : `Denied. You'd be ${Math.abs(buffer)} BDT in debt every month. Fix your expenses first.`;

                outcome = { type: 'savings', amount, feasible, buffer };
            } else {
                sashaComment = "I can only calculate savings scenarios right now. Try 'What if I save 5000?'";
            }

            const simulation = {
                user_id: userId,
                scenario_text: scenario,
                scenario_type: 'savings' as const,
                results: outcome,
                sasha_comment: sashaComment
            };

            await saveScenario(simulation);
            setResult(simulation);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Scenario Planner</h3>

            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="e.g., What if I save 5000 BDT/month?"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    onClick={runScenario}
                    disabled={loading || !scenario}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                    Run
                </button>
            </div>

            {result && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2">Sasha's Analysis:</h4>
                    <p className="text-gray-700 italic mb-4">"{result.sasha_comment}"</p>

                    {result.results?.feasible !== undefined && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Feasibility</p>
                                <p className={`text-lg font-bold ${result.results.feasible ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.results.feasible ? 'High' : 'Impossible'}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold">Monthly Buffer</p>
                                <p className="text-lg font-bold text-gray-800">{result.results.buffer} BDT</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
