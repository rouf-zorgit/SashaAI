import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getUserGoals, createGoal, updateGoal, deleteGoal, type SavingsGoal } from '../lib/db/budgets';
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react';
import { AddProgressDialog } from '../components/AddProgressDialog';

const Goals: React.FC = () => {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [progressGoal, setProgressGoal] = useState<SavingsGoal | null>(null);

    useEffect(() => {
        if (user) {
            loadGoals();
        }
    }, [user]);

    const loadGoals = async () => {
        if (!user) return;
        try {
            const data = await getUserGoals(user.id);
            setGoals(data);
        } catch (error) {
            console.error('Error loading goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await deleteGoal(id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleAddProgress = async (goal: SavingsGoal, amount: number) => {
        try {
            const newAmount = goal.current_amount + amount;
            const updated = await updateGoal(goal.id, {
                current_amount: newAmount,
                is_completed: newAmount >= goal.target_amount
            });
            setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    if (!user) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Savings Goals</h2>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Goal
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Target size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No savings goals yet</p>
                    <p className="text-sm text-gray-400 mt-2">Set a goal to start saving!</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(goal => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        const daysLeft = goal.deadline
                            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : null;

                        return (
                            <div key={goal.id} className={`bg-white p-6 rounded-lg shadow ${goal.is_completed ? 'border-2 border-green-500' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold">{goal.name}</h3>
                                        {goal.category && <p className="text-sm text-gray-500">{goal.category}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-2 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-center mb-4">
                                    <div className="relative w-32 h-32">
                                        <svg className="transform -rotate-90 w-32 h-32">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="#e5e7eb"
                                                strokeWidth="8"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke={goal.is_completed ? '#10b981' : '#3b82f6'}
                                                strokeWidth="8"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 56}`}
                                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold">{Math.min(progress, 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Current</span>
                                        <span className="font-semibold">{goal.currency} {goal.current_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Target</span>
                                        <span className="font-semibold">{goal.currency} {goal.target_amount.toFixed(2)}</span>
                                    </div>
                                    {daysLeft !== null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Deadline</span>
                                            <span className={daysLeft < 0 ? 'text-red-600' : 'text-gray-700'}>
                                                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {goal.is_completed ? (
                                    <div className="text-center text-green-600 font-semibold">
                                        🎉 Goal Completed!
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setProgressGoal(goal)}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={18} />
                                        Add Progress
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showAddDialog && (
                <AddGoalDialog
                    onClose={() => setShowAddDialog(false)}
                    onAdd={async (goal: any) => {
                        const newGoal = await createGoal({ ...goal, user_id: user.id });
                        setGoals(prev => [newGoal, ...prev]);
                        setShowAddDialog(false);
                    }}
                />
            )}

            {progressGoal && (
                <AddProgressDialog
                    goalName={progressGoal.name}
                    currentAmount={progressGoal.current_amount}
                    targetAmount={progressGoal.target_amount}
                    currency={progressGoal.currency}
                    isOpen={true}
                    onClose={() => setProgressGoal(null)}
                    onAdd={(amount) => {
                        handleAddProgress(progressGoal, amount);
                        setProgressGoal(null);
                    }}
                />
            )}
        </div>
    );
};

function AddGoalDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (goal: any) => void }) {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            name,
            target_amount: parseFloat(targetAmount),
            current_amount: 0,
            currency: 'BDT',
            deadline: deadline || undefined,
            category: category || undefined,
            is_completed: false
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Add Savings Goal</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Goal Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Emergency Fund, Vacation"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Amount (BDT)</label>
                        <input
                            type="number"
                            value={targetAmount}
                            onChange={e => setTargetAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="50000"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category (Optional)</label>
                        <input
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Travel, Education"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deadline (Optional)</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
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
                            Add Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Goals;
