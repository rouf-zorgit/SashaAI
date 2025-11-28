import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTransactionDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { Trash2 } from 'lucide-react'
import { softDeleteTransaction, undoDeleteTransaction } from '@/lib/queries/transactions'
import { toast } from 'sonner'

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
    onDelete?: () => void
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

export function TransactionRow({ transaction, currency, onDelete }: TransactionRowProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const icon = categoryIcons[transaction.category] || '📌'
    const isIncome = transaction.type === 'income'

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await softDeleteTransaction(transaction.id)

            toast.success('Transaction deleted', {
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        await undoDeleteTransaction(transaction.id)
                        toast.success('Transaction restored')
                        // Ideally we'd trigger a refresh here, but for now the row is gone
                        // The parent component should handle the refresh via onDelete
                        // But since undo happens after delete, the row might be gone.
                        // We might need a more complex state management for this.
                        // For MVP, we'll just restore it in DB. The user will see it on refresh.
                        // Or we can reload the page.
                        window.location.reload()
                    }
                }
            })

            if (onDelete) onDelete()
        } catch (error) {
            console.error('Error deleting transaction:', error)
            toast.error('Failed to delete transaction')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="p-4 hover:bg-accent/50 transition-colors group relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <p className="font-medium capitalize">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    </div>
                </div>
                <div className="text-right mr-8">
                    <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatTransactionDate(transaction.date)}
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    )
}
