import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import type { Transaction } from '../types/supabase';
import { clsx } from 'clsx';

interface TransactionItemProps {
    transaction: Transaction;
    onClick?: () => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
    transaction,
    onClick,
    onEdit,
    onDelete
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isIncome = transaction.type === 'income';
    const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onEdit?.(transaction);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onDelete?.(transaction);
    };

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

                {(onEdit || onDelete) && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={handleMenuClick}
                            className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                {onEdit && (
                                    <button
                                        onClick={handleEdit}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Edit2 size={16} />
                                        Edit Transaction
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                        Delete Transaction
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionItem;
