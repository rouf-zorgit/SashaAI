import React from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';
import type { Transaction } from '../types/supabase';
import { clsx } from 'clsx';

interface TransactionItemProps {
    transaction: Transaction;
    onClick?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
    const isIncome = transaction.type === 'income';
    const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                )}>
                    {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>

                <div>
                    <h3 className="font-medium text-gray-900">{transaction.category}</h3>
                    <p className="text-sm text-gray-500">{transaction.description || 'No description'}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className={clsx(
                        'font-semibold',
                        isIncome ? 'text-green-600' : 'text-gray-900'
                    )}>
                        {isIncome ? '+' : '-'}{transaction.currency} {Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{date}</p>
                </div>
                <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>
    );
};

export default TransactionItem;
