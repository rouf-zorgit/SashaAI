import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTransactions } from '../contexts/TransactionContext';
import { getUserBudgets, createBudget, deleteBudget, type Budget } from '../lib/db/budgets';
import { Plus, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';

const Budgets: React.FC = () => {
    const { user } = useAuthStore();
    const { transactions } = useTransactions();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    useEffect(() => {
        if (user) {
            loadBudgets();
        }
    }, [user]);

    const loadBudgets = async () => {
        if (!user) return;
        try {
            const data = await getUserBudgets(user.id);
            setBudgets(data);
        } catch (error) {
            console.error('Error loading budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSpentAmount = (budget: Budget) => {
        const now = new Date();
        const startDate = new Date(budget.start_date);
        const endDate = budget.end_date ? new Date(budget.end_date) : now;

        return transactions
            .filter(t =>
                t.type === 'expense' &&
                t.category === budget.category &&
                new Date(t.created_at) >= startDate &&
                new Date(t.created_at) <= endDate
            )
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0); // ✅ FIX: Use Math.abs(amount)
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this budget?')) return;
        try {
            await deleteBudget(id);
            setBudgets(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    if (!user) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Budget Management</h2>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Budget
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading budgets...</div>
            ) : budgets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No budgets set</p>
                    <p className="text-sm text-gray-400 mt-2">Create a budget to track your spending</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map(budget => {
                        const spent = getSpentAmount(budget);
                        const percentage = (spent / budget.amount) * 100;
                        const isOverBudget = percentage > 100;
                        const isNearLimit = percentage >= budget.alert_threshold;

                        return (
                            <div key={budget.id} className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold">{budget.category}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Spent</span>
                                        <span className="font-semibold">
                                            ৳{spent.toFixed(2)} / ৳{budget.amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${isOverBudget ? 'bg-red-500' :
                                                isNearLimit ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% used</p>
                                </div>

                                {isOverBudget && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertTriangle size={16} />
                                        <span>Over budget by ৳{(spent - budget.amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {isNearLimit && !isOverBudget && (
                                    <div className="flex items-center gap-2 text-yellow-600 text-sm">
                                        <AlertTriangle size={16} />
                                        <span>Approaching limit</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showAddDialog && (
                <AddBudgetDialog
                    onClose={() => setShowAddDialog(false)}
                    onAdd={async (budget: any) => {
                        const newBudget = await createBudget({ ...budget, user_id: user.id });
                        setBudgets(prev => [newBudget, ...prev]);
                        setShowAddDialog(false);
                    }}
                />
            )}
        </div>
    );
};

function AddBudgetDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (budget: any) => void }) {
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily' | 'yearly'>('monthly');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            category,
            amount: parseFloat(amount),
            period,
            start_date: new Date().toISOString().split('T')[0],
            alert_threshold: 80,
            is_active: true
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Add Budget</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Groceries, Dining, Transport"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount (BDT)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="10000"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Period</label>
                        <select
                            value={period}
                            onChange={e => setPeriod(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Budget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Budgets;
