"use client"

import { Card } from '@/components/ui/card'
import { formatTransactionDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'

interface Transaction {
    id: string
    amount: number
    category: string
    description: string
    type: 'income' | 'expense'
    date: string
}

interface TransactionRowProps {
    transaction: Transaction
    currency: string
}

const categoryIcons: Record<string, string> = {
    groceries: '🛒',
    transport: '🚗',
    entertainment: '🎬',
    bills: '📄',
    shopping: '🛍️',
    food: '🍔',
    dining: '🍽️',
    health: '🏥',
    salary: '💰',
    freelance: '💼',
    investment: '📈',
    gift: '🎁',
    other: '📌'
}

export function TransactionRow({ transaction, currency }: TransactionRowProps) {
    const icon = categoryIcons[transaction.category] || '📌'
    const isIncome = transaction.type === 'income'

    return (
        <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <p className="font-medium capitalize">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatTransactionDate(transaction.date)}
                    </p>
                </div>
            </div>
        </Card>
    )
}
