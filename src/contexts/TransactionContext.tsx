/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getUserTransactions, subscribeToTransactions } from '../lib/db/transactions';
import type { Transaction } from '../types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    refresh: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        try {
            const data = await getUserTransactions(user.id);
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchTransactions();

        // Subscribe to realtime changes
        const channel: RealtimeChannel = subscribeToTransactions(user.id, () => {
            fetchTransactions();
        });

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    return (
        <TransactionContext.Provider value={{ transactions, loading, refresh: fetchTransactions }}>
            {children}
        </TransactionContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
}
