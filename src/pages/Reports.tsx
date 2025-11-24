import React, { useMemo, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinancialStats } from '../hooks/useFinancialStats';
import TransactionItem from '../components/TransactionItem';
import { supabase } from '../lib/supabase';
import { CashFlowChart } from '../components/CashFlowChart';
import { PatternInsights } from '../components/PatternInsights';
import { WeeklySummary } from '../components/WeeklySummary';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Reports: React.FC = () => {
    const { stats, loading } = useFinancialStats();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null);
        });
    }, []);

    // Prepare data for charts
    const incomeVsExpenseData = useMemo(() => [
        { name: 'Income', value: stats.totalIncome },
        { name: 'Expenses', value: stats.totalExpenses },
    ], [stats.totalIncome, stats.totalExpenses]);

    const categoryData = useMemo(() => {
        const categoryMap = new Map<string, number>();

        stats.recentTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const current = categoryMap.get(t.category) || 0;
                // ✅ FIX: Use Math.abs() since expenses are stored as negative
                categoryMap.set(t.category, current + Math.abs(Number(t.amount)));
            });

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 categories
    }, [stats.recentTransactions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading reports...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>

            {/* Weekly AI Summary */}
            {userId && <WeeklySummary userId={userId} />}

            {/* Intelligence Section */}
            {userId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CashFlowChart userId={userId} />
                    <PatternInsights userId={userId} />
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Balance</p>
                            <h3 className="text-3xl font-bold mt-2">৳{stats.totalBalance.toFixed(2)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Income</p>
                            <h3 className="text-3xl font-bold mt-2">৳{stats.totalIncome.toFixed(2)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                            <h3 className="text-3xl font-bold mt-2">৳{stats.totalExpenses.toFixed(2)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expense Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeVsExpenseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Spending by Category Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">
                            No expense data available
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {stats.recentTransactions.length > 0 ? (
                        stats.recentTransactions.slice(0, 5).map((transaction) => (
                            <TransactionItem key={transaction.id} transaction={transaction} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400">No transactions yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
