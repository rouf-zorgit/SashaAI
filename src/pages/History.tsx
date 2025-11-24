import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, X } from 'lucide-react';
import { getUserTransactions, subscribeToTransactions, softDeleteTransaction } from '../lib/db/transactions';
import { useAuthStore } from '../store/authStore';
import type { Transaction } from '../types/supabase';
import TransactionItem from '../components/TransactionItem';
import EditTransactionModal from '../components/EditTransactionModal';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import FilterPanel, { type FilterState } from '../components/FilterPanel';

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

    // Filter state
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        dateRange: { start: '', end: '' },
        categories: [],
        amountRange: { min: 0, max: 100000 },
        merchant: ''
    });

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

    // Get unique categories for filter
    const availableCategories = Array.from(new Set(transactions.map(t => t.category)));

    // Apply all filters
    const filteredTransactions = transactions.filter(t => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());

        // Date range filter
        const matchesDateRange =
            (!filters.dateRange.start || new Date(t.created_at) >= new Date(filters.dateRange.start)) &&
            (!filters.dateRange.end || new Date(t.created_at) <= new Date(filters.dateRange.end));

        // Category filter
        const matchesCategory = filters.categories.length === 0 || filters.categories.includes(t.category);

        // Amount range filter
        const amount = Math.abs(t.amount);
        const matchesAmount = amount >= filters.amountRange.min && amount <= filters.amountRange.max;

        // Merchant filter
        const matchesMerchant = filters.merchant === '' ||
            (t.description?.toLowerCase() || '').includes(filters.merchant.toLowerCase());

        return matchesSearch && matchesDateRange && matchesCategory && matchesAmount && matchesMerchant;
    });

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

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
        // Persist to localStorage
        localStorage.setItem('transactionFilters', JSON.stringify(newFilters));
    };

    const clearAllFilters = () => {
        const emptyFilters: FilterState = {
            dateRange: { start: '', end: '' },
            categories: [],
            amountRange: { min: 0, max: 100000 },
            merchant: ''
        };
        setFilters(emptyFilters);
        setSearchTerm('');
        localStorage.removeItem('transactionFilters');
    };

    // Load filters from localStorage on mount
    useEffect(() => {
        const savedFilters = localStorage.getItem('transactionFilters');
        if (savedFilters) {
            setFilters(JSON.parse(savedFilters));
        }
    }, []);

    // Check if any filters are active
    const hasActiveFilters =
        filters.dateRange.start !== '' ||
        filters.dateRange.end !== '' ||
        filters.categories.length > 0 ||
        filters.amountRange.min > 0 ||
        filters.amountRange.max < 100000 ||
        filters.merchant !== '';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Download size={20} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={() => setShowFilterPanel(true)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium ${hasActiveFilters
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={20} />
                        <span className="hidden sm:inline">Filter</span>
                        {hasActiveFilters && (
                            <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {filters.categories.length + (filters.dateRange.start ? 1 : 0) + (filters.merchant ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                    {filters.categories.map(cat => (
                        <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {cat}
                        </span>
                    ))}
                    {filters.dateRange.start && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            From: {new Date(filters.dateRange.start).toLocaleDateString()}
                        </span>
                    )}
                    {filters.merchant && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            Merchant: {filters.merchant}
                        </span>
                    )}
                    <button
                        onClick={clearAllFilters}
                        className="ml-auto flex items-center gap-1 px-3 py-1 text-sm text-blue-700 hover:text-blue-900"
                    >
                        <X size={16} />
                        Clear All
                    </button>
                </div>
            )}

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

            {/* Results Count */}
            {!loading && (
                <div className="text-sm text-gray-500">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
            )}

            {/* Transactions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading transactions...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {transactions.length === 0 ? 'No transactions found.' : 'No transactions match your filters.'}
                    </div>
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

            {/* Filter Panel */}
            <FilterPanel
                isOpen={showFilterPanel}
                onClose={() => setShowFilterPanel(false)}
                onApply={handleApplyFilters}
                currentFilters={filters}
                availableCategories={availableCategories}
            />
        </div>
    );
};

export default History;
