import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTransactions } from '../contexts/TransactionContext';
import { getUserReminders, createReminder, deleteReminder, markReminderPaid, type BillReminder } from '../lib/db/budgets';
import { createTransaction } from '../lib/db/transactions';
import { Bell, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

const Reminders: React.FC = () => {
    const { user } = useAuthStore();
    const { refresh: refreshTransactions } = useTransactions();
    const [reminders, setReminders] = useState<BillReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    useEffect(() => {
        if (user) {
            loadReminders();
        }
    }, [user]);

    const loadReminders = async () => {
        if (!user) return;
        try {
            const data = await getUserReminders(user.id);
            setReminders(data);
        } catch (error) {
            console.error('Error loading reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await deleteReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };

    const handleMarkPaid = async (reminder: BillReminder) => {
        try {
            // Create transaction
            if (reminder.amount) {
                await createTransaction({
                    user_id: user!.id,
                    amount: reminder.amount,
                    currency: reminder.currency || 'BDT',
                    type: 'expense',
                    category: 'Bills',
                    description: reminder.title,
                    is_confirmed: true,
                    base_amount: reminder.amount,
                });
                await refreshTransactions();
            }

            // Mark as paid
            const updated = await markReminderPaid(reminder.id);
            setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
        } catch (error) {
            console.error('Error marking reminder as paid:', error);
        }
    };

    if (!user) return null;

    const now = new Date();
    const overdue = reminders.filter(r => !r.is_paid && new Date(r.due_date) < now);
    const upcoming = reminders.filter(r => !r.is_paid && new Date(r.due_date) >= now);
    const paid = reminders.filter(r => r.is_paid);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Bill Reminders</h2>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Reminder
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading reminders...</div>
            ) : reminders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No bill reminders yet</p>
                    <p className="text-sm text-gray-400 mt-2">Add a reminder to never miss a payment!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Overdue */}
                    {overdue.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                                <AlertCircle size={20} />
                                Overdue ({overdue.length})
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {overdue.map(reminder => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onDelete={handleDelete}
                                        onMarkPaid={handleMarkPaid}
                                        isOverdue
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-blue-600 mb-3">
                                Upcoming ({upcoming.length})
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcoming.map(reminder => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onDelete={handleDelete}
                                        onMarkPaid={handleMarkPaid}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paid */}
                    {paid.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-green-600 mb-3">
                                Paid ({paid.length})
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paid.map(reminder => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onDelete={handleDelete}
                                        onMarkPaid={handleMarkPaid}
                                        isPaid
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showAddDialog && (
                <AddReminderDialog
                    onClose={() => setShowAddDialog(false)}
                    onAdd={async (reminder: any) => {
                        const newReminder = await createReminder({ ...reminder, user_id: user.id });
                        setReminders(prev => [newReminder, ...prev]);
                        setShowAddDialog(false);
                    }}
                />
            )}
        </div>
    );
};

function ReminderCard({
    reminder,
    onDelete,
    onMarkPaid,
    isOverdue = false,
    isPaid = false
}: {
    reminder: BillReminder;
    onDelete: (id: string) => void;
    onMarkPaid: (reminder: BillReminder) => void;
    isOverdue?: boolean;
    isPaid?: boolean;
}) {
    const dueDate = new Date(reminder.due_date);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <div className={`bg-white p-6 rounded-lg shadow ${isOverdue ? 'border-2 border-red-500' : isPaid ? 'border-2 border-green-500' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold">{reminder.title}</h3>
                    {reminder.amount && (
                        <p className="text-xl font-semibold text-blue-600 mt-1">
                            {reminder.currency} {reminder.amount.toFixed(2)}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => onDelete(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date</span>
                    <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {dueDate.toLocaleDateString()}
                    </span>
                </div>
                {!isPaid && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span className={isOverdue ? 'text-red-600' : 'text-gray-700'}>
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                        </span>
                    </div>
                )}
                {reminder.recurring && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Recurring</span>
                        <span className="text-gray-700 capitalize">{reminder.frequency}</span>
                    </div>
                )}
            </div>

            {!isPaid && (
                <button
                    onClick={() => onMarkPaid(reminder)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                    <Check size={18} />
                    Mark as Paid
                </button>
            )}
        </div>
    );
}

function AddReminderDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (reminder: any) => void }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            title,
            amount: amount ? parseFloat(amount) : undefined,
            currency: 'BDT',
            due_date: dueDate,
            recurring,
            frequency: recurring ? frequency : undefined,
            is_paid: false
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Add Bill Reminder</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Bill Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Rent, Internet, Electricity"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount (Optional)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="5000"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={recurring}
                                onChange={e => setRecurring(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm font-medium">Recurring Bill</span>
                        </label>
                    </div>
                    {recurring && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Frequency</label>
                            <select
                                value={frequency}
                                onChange={e => setFrequency(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}
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
                            Add Reminder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Reminders;
