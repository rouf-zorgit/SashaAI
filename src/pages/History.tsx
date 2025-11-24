import React, { useEffect, useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { getUserTransactions, subscribeToTransactions, softDeleteTransaction } from '../lib/db/transactions';
import { useAuthStore } from '../store/authStore';
import type { Transaction } from '../types/supabase';
import TransactionItem from '../components/TransactionItem';
import EditTransactionModal from '../components/EditTransactionModal';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const History: React.FC = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit modal state
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Delete dialog state
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                const data = await getUserTransactions(user.id);
                setTransactions(data || []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();

        const subscription = subscribeToTransactions(user.id, () => {
            fetchTransactions();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const filteredTransactions = transactions.filter(t =>
        (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };

    const handleDelete = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
    };

    const confirmDelete = async () => {
        if (!deletingTransaction) return;

        setDeleteLoading(true);
        try {
            await softDeleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
            // Transaction list will update automatically via subscription
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditSuccess = () => {
        // Transaction list will update automatically via subscription
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Download size={20} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Filter size={20} />
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading transactions...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No transactions found.</div>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingTransaction && (
                <EditTransactionModal
                    transaction={editingTransaction}
                    isOpen={true}
                    onClose={() => setEditingTransaction(null)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Delete Confirmation */}
            {deletingTransaction && (
                <DeleteConfirmationDialog
                    isOpen={true}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingTransaction(null)}
                    transactionAmount={deletingTransaction.amount}
                    transactionCategory={deletingTransaction.category}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
};

export default History;
