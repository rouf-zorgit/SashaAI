import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTransactionDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { Trash2, Pencil } from 'lucide-react'
import { softDeleteTransaction, undoDeleteTransaction } from '@/lib/queries/transactions'
import { toast } from 'sonner'

interface Transaction {
    id: string
    user_id: string // Added
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
    onEdit?: () => void
    currentUserId?: string // Added for debugging
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


export function TransactionRow({ transaction, currency, onDelete, onEdit, currentUserId }: TransactionRowProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const icon = categoryIcons[transaction.category] || '📌'
    const isIncome = transaction.type === 'income'

    // Debug check
    const isOwner = currentUserId ? transaction.user_id === currentUserId : true;

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            console.log('🗑️ Attempting delete for:', transaction.id);
            await softDeleteTransaction(transaction.id)

            toast.success('Transaction deleted', {
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        await undoDeleteTransaction(transaction.id)
                        toast.success('Transaction restored')
                        window.location.reload()
                    }
                }
            })

            if (onDelete) onDelete()
        } catch (error: any) {
            console.error('Error deleting transaction:', error)
            toast.error(`Delete failed: ${error.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="p-4 hover:bg-accent/50 transition-colors group relative">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize truncate">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>

                        {/* DEBUG INFO - Only visible if ID mismatch or explicitly enabled */}
                        {currentUserId && !isOwner && (
                            <div className="text-xs text-red-500 mt-1 font-mono bg-red-50 p-1 rounded">
                                ⚠️ Ownership Mismatch!
                                <br />Tx User: {transaction.user_id}
                                <br />You: {currentUserId}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTransactionDate(transaction.date)}
                        </p>
                    </div>

                    <div className="flex gap-1 opacity-100 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary"
                            onClick={onEdit}
                            title="Edit transaction"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete transaction"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
