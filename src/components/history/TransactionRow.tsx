import { useState, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTransactionDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { Trash2, Pencil } from 'lucide-react'
import { deleteTransaction, restoreTransaction } from '@/app/actions/transactions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Transaction {
    id: string
    user_id: string
    amount: number
    category: string
    description: string
    type: 'income' | 'expense'
    date: string
    wallet_id?: string | null
    wallet?: {
        id: string
        name: string
        type: string
        currency: string
    } | null
}

interface TransactionRowProps {
    transaction: Transaction
    currency: string
    onDelete?: () => void
    onEdit?: () => void
    currentUserId?: string
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

export const TransactionRow = memo(function TransactionRow({
    transaction,
    currency,
    onDelete,
    onEdit,
    currentUserId
}: TransactionRowProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const icon = categoryIcons[transaction.category] || '📌'
    const isIncome = transaction.type === 'income'

    const handleDelete = async () => {
        setIsDeleting(true)

        try {
            const result = await deleteTransaction(transaction.id)

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete')
            }

            // Force immediate hard reload
            window.location.href = window.location.href

        } catch (error: any) {
            toast.error(error.message || 'Failed to delete transaction')
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

                        {transaction.wallet && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    {transaction.wallet.name}
                                </span>
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
})