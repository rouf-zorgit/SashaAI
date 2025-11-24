import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WeeklySummaryProps {
    userId: string;
}

interface WeeklySummaryData {
    summary: string;
    stats: {
        income: number;
        expenses: number;
        net: number;
        topCategory: string | null;
        transactionCount: number;
    };
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ userId }) => {
    const [data, setData] = useState<WeeklySummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
                    'generateWeeklySummary',
                    {
                        body: { userId }
                    }
                );

                if (summaryError) throw summaryError;

                setData(summaryData);
            } catch (err) {
                console.error('Error fetching weekly summary:', err);
                setError('Failed to load summary');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-semibold">Weekly AI Summary</h3>
                </div>
                <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
                    <div className="h-4 bg-white/20 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return null; // Silently fail - don't show error to user
    }

    return (
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Weekly AI Summary</h3>
                    <p className="text-purple-100 text-sm flex items-center gap-1">
                        <Calendar size={14} />
                        Last 7 days
                    </p>
                </div>
            </div>

            <p className="text-purple-50 leading-relaxed mb-4">
                {data.summary}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                <div>
                    <p className="text-purple-200 text-xs mb-1">Income</p>
                    <p className="font-semibold flex items-center gap-1">
                        <TrendingUp size={14} />
                        ৳{data.stats.income.toFixed(0)}
                    </p>
                </div>
                <div>
                    <p className="text-purple-200 text-xs mb-1">Expenses</p>
                    <p className="font-semibold flex items-center gap-1">
                        <TrendingDown size={14} />
                        ৳{data.stats.expenses.toFixed(0)}
                    </p>
                </div>
                <div>
                    <p className="text-purple-200 text-xs mb-1">Net</p>
                    <p className={`font-semibold ${data.stats.net >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                        ৳{data.stats.net.toFixed(0)}
                    </p>
                </div>
            </div>
        </div>
    );
};
