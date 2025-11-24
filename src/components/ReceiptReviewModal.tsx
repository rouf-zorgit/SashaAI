import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface ReceiptData {
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    category: string;
    items?: string[];
}

interface ReceiptReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ReceiptData) => Promise<void>;
    initialData: ReceiptData;
    imageUrl: string;
}

const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialData,
    imageUrl
}) => {
    const [data, setData] = useState<ReceiptData>(initialData);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onConfirm(data);
            onClose();
        } catch (error) {
            console.error('Error saving receipt:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-gray-100 p-4 flex items-center justify-center relative">
                    <img
                        src={imageUrl}
                        alt="Receipt"
                        className="max-w-full max-h-[40vh] md:max-h-full object-contain rounded-lg shadow-sm"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 md:hidden p-2 bg-white/80 rounded-full shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Section */}
                <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Review Receipt</h2>
                        <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                            <input
                                type="text"
                                value={data.merchant}
                                onChange={e => setData({ ...data, merchant: e.target.value })}
                                className="input w-full"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={e => setData({ ...data, amount: parseFloat(e.target.value) })}
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                    value={data.currency}
                                    onChange={e => setData({ ...data, currency: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="BDT">BDT</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={e => setData({ ...data, date: e.target.value })}
                                className="input w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={data.category}
                                onChange={e => setData({ ...data, category: e.target.value })}
                                className="input w-full"
                            >
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Bills">Bills</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Health">Health</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="pt-4 mt-auto">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Confirm & Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReceiptReviewModal;
