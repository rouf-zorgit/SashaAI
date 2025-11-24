import { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext';

export interface Stats {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBalance: number;
}

export function useStats(): Stats {
    const { transactions } = useTransactions();

    return useMemo(() => {
        // Filter confirmed and non-deleted transactions
        const confirmedTransactions = transactions.filter(
            t => t.is_confirmed && !t.deleted_at
        );

        // Calculate all-time totals
        const totalIncome = confirmedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = confirmedTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate this month's totals
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisMonthTransactions = confirmedTransactions.filter(t => {
            const transactionDate = new Date(t.created_at);
            return transactionDate >= firstDayOfMonth;
        });

        const monthlyIncome = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyExpenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            monthlyIncome,
            monthlyExpenses,
            monthlyBalance: monthlyIncome - monthlyExpenses
        };
    }, [transactions]);
}
