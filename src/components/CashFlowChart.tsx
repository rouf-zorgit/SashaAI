import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getCashFlowPredictions, type CashFlowPrediction } from '../lib/db/sasha';
import { TrendingDown, AlertOctagon } from 'lucide-react';

export function CashFlowChart({ userId }: { userId: string }) {
    const [data, setData] = useState<CashFlowPrediction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadPredictions = async () => {
            if (!userId) return;
            const predictions = await getCashFlowPredictions(userId);
            if (mounted) {
                setData(predictions);
                setLoading(false);
            }
        };
        loadPredictions();
        return () => { mounted = false; };
    }, [userId]);



    if (loading) return <div className="h-64 bg-gray-50 rounded-xl animate-pulse"></div>;
    if (data.length === 0) return null;

    const crisisPoint = data.find(d => d.warning_level === 'crisis');
    const minBalance = Math.min(...data.map(d => d.predicted_balance || 0));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-gray-900">30-Day Cash Flow Forecast</h3>
                    <p className="text-sm text-gray-500">Predicted balance based on your spending patterns</p>
                </div>
                {crisisPoint && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                        <AlertOctagon size={16} />
                        Crisis predicted on {new Date(crisisPoint.prediction_date).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="prediction_date"
                            tickFormatter={(date) => new Date(date).getDate().toString()}
                            stroke="#9ca3af"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(val) => `${val / 1000}k`}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value.toFixed(0)} BDT`, 'Balance']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="predicted_balance"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {minBalance < 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start">
                    <TrendingDown className="text-red-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-bold text-red-800">Liquidity Warning</p>
                        <p className="text-xs text-red-600 mt-1">
                            Sasha predicts you'll go negative. Cut non-essential spending by {Math.abs(minBalance).toFixed(0)} BDT immediately.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
