import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Transaction } from '../types/supabase';

export interface FinancialStats {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: Transaction[];
}

export function useFinancialStats() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<FinancialStats>({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        recentTransactions: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const transactions = data as Transaction[];

                const income = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const expenses = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                setStats({
                    totalBalance: income - expenses,
                    totalIncome: income,
                    totalExpenses: expenses,
                    recentTransactions: transactions.slice(0, 5),
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
