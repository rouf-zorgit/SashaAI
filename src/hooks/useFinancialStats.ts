import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Transaction } from '../types/supabase';

export interface FinancialStats {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: Transaction[];
    monthlyIncome: number;
    monthlyExpenses: number;
}

export function useFinancialStats() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<FinancialStats>({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        recentTransactions: [],
        monthlyIncome: 0,
        monthlyExpenses: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // Fetch all non-deleted transactions
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .is('deleted_at', null) // ✅ FIX: Exclude deleted transactions
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const transactions = data as Transaction[];

                // Calculate current month start
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                // Filter current month transactions
                const currentMonthTransactions = transactions.filter(t =>
                    new Date(t.created_at) >= monthStart
                );

                // ✅ FIX: Use Math.abs() for expenses (they're stored as negative)
                const income = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

                const expenses = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

                const monthlyIncome = currentMonthTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

                const monthlyExpenses = currentMonthTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

                setStats({
                    totalBalance: income - expenses,
                    totalIncome: income,
                    totalExpenses: expenses,
                    monthlyIncome,
                    monthlyExpenses,
                    recentTransactions: transactions.slice(0, 10),
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Realtime subscription
        const channel = supabase
            .channel('transactions_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchStats(); // Re-fetch on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { stats, loading };
}
