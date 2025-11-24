import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader2, Calendar, DollarSign, FileText } from 'lucide-react';

interface Receipt {
    id: string;
    storage_path: string;
    merchant: string | null;
    amount: number | null;
    currency: string | null;
    date: string | null;
    status: string;
    created_at: string;
}

const Receipts: React.FC = () => {
    const { user } = useAuthStore();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReceipts();
        }
    }, [user]);

    const fetchReceipts = async () => {
        try {
            const { data, error } = await supabase
                .from('receipts')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReceipts(data || []);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        const { data } = supabase.storage.from('receipts').getPublicUrl(path);
        return data.publicUrl;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Receipt Gallery</h1>

            {receipts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No receipts uploaded yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Upload receipts in the chat to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {receipts.map((receipt) => (
                        <div key={receipt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-[3/4] relative bg-gray-100">
                                <img
                                    src={getImageUrl(receipt.storage_path)}
                                    alt={receipt.merchant || 'Receipt'}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${receipt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        receipt.status === 'processed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {receipt.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 truncate pr-2">
                                        {receipt.merchant || 'Unknown Merchant'}
                                    </h3>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <DollarSign size={14} className="mr-1.5 text-gray-400" />
                                        <span>{receipt.currency} {receipt.amount}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar size={14} className="mr-1.5 text-gray-400" />
                                        <span>{new Date(receipt.date || receipt.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Receipts;
