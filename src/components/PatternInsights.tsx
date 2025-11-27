import { useState, useEffect } from 'react';
import { getUserPatterns, type SpendingPattern } from '../lib/db/sasha';
import { AlertTriangle, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { getSashaPatternComment } from '../lib/sasha-utils';

export function PatternInsights({ userId }: { userId: string }) {
    const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadPatterns = async () => {
            if (!userId) return;
            const data = await getUserPatterns(userId);
            if (mounted) {
                setPatterns(data);
                setLoading(false);
            }
        };
        loadPatterns();
        return () => { mounted = false; };
    }, [userId]);



    if (loading) return null;
    if (patterns.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'weekend_spike': return <Calendar className="text-purple-500" />;
            case 'payday_splurge': return <TrendingUp className="text-green-500" />;
            case 'impulse_category': return <ShoppingBag className="text-red-500" />;
            default: return <AlertTriangle className="text-orange-500" />;
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />
                Sasha's Insights
            </h3>
            <div className="space-y-4">
                {patterns.map(pattern => (
                    <div key={pattern.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="mt-1">{getIcon(pattern.pattern_type)}</div>
                        <div>
                            <h4 className="font-bold text-gray-800 capitalize">
                                {pattern.pattern_type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 italic">
                                "{getSashaPatternComment(pattern as any)}"
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Frequency: {pattern.frequency}</span>
                                <span>Avg: {pattern.avg_amount?.toFixed(0)} BDT</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
