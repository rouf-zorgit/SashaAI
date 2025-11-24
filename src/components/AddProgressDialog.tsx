import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddProgressDialogProps {
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    currency: string;
    isOpen: boolean;
    onClose: () => void;
    onAdd: (amount: number) => void;
}

export const AddProgressDialog: React.FC<AddProgressDialogProps> = ({
    goalName,
    currentAmount,
    targetAmount,
    currency,
    isOpen,
    onClose,
    onAdd
}) => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        if (numAmount > (targetAmount - currentAmount) * 2) {
            setError('Amount seems too large. Please verify.');
            return;
        }

        onAdd(numAmount);
        setAmount('');
        onClose();
    };

    if (!isOpen) return null;

    const remaining = targetAmount - currentAmount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Add Progress</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900 font-medium">{goalName}</p>
                    <div className="flex justify-between mt-2 text-sm">
                        <span className="text-blue-700">Current:</span>
                        <span className="font-semibold text-blue-900">{currency} {currentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                        <span className="text-blue-700">Remaining:</span>
                        <span className="font-semibold text-blue-900">{currency} {remaining.toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount to Add ({currency})
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            autoFocus
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Add Progress
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
