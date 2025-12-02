"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { markNotificationRead, markAllNotificationsRead, getTransactionsWithFilters } from '@/lib/queries/history'
import { TransactionRow } from '@/components/history/TransactionRow'
import { NotificationCard } from '@/components/history/NotificationCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { TransactionSkeleton } from '@/components/ui/skeleton'
import { ErrorMessages } from '@/lib/error-messages'
import type { User } from '@supabase/supabase-js'

// Lazy load the EditTransactionDialog (only loads when opened)
const EditTransactionDialog = dynamic(
    () => import('./EditTransactionDialog').then(mod => ({ default: mod.EditTransactionDialog })),
    { ssr: false }
)

interface HistoryClientProps {
    initialTransactions: any[]
    initialNotifications: any[]
    user: User
    currency: string
    wallets: any[]
}

export function HistoryClient({ initialTransactions, initialNotifications, user, currency, wallets }: HistoryClientProps) {
    const [transactions, setTransactions] = useState<any[]>(initialTransactions)
    const [notifications, setNotifications] = useState<any[]>(initialNotifications)
    const [search, setSearch] = useState('')
    const [walletFilter, setWalletFilter] = useState<string>('all')
    const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const isFirstMount = useRef(true) // Track first mount
    const router = useRouter()
    const searchParams = useSearchParams()
    const typeFilter = searchParams.get('type') // 'income' or 'expense'

    const refreshData = async () => {
        setIsLoading(true)
        try {
            const txns = await getTransactionsWithFilters(user.id, {
                limit: 50,
                type: typeFilter as 'income' | 'expense' | undefined,
                search,
                walletId: walletFilter !== 'all' ? walletFilter : undefined
            })
            setTransactions(txns)
        } catch (error) {
            toast.error(ErrorMessages.transaction.saveFailed)
        } finally {
            setIsLoading(false)
        }
    }

    // Refresh data when wallet filter, search, or type filter changes
    // DISABLED: Using only server-side data for now to avoid client-side query issues
    // TODO: Fix client-side Supabase query auth
    /*
    useEffect(() => {
        // Skip on first mount - use server data
        if (isFirstMount.current) {
            isFirstMount.current = false
            console.log('⏭️ Skipping initial refresh, using server data')
            return
        }
        
        console.log('🔍 Filter changed, refreshing data...', { walletFilter, search, typeFilter })
        refreshData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletFilter, search, typeFilter])
    */

    const handleEdit = (transaction: any) => {
        console.log('✏️ Opening edit dialog for:', transaction.id);
        setEditingTransaction(transaction);
        setIsEditDialogOpen(true);
    }

    const handleEditSuccess = () => {
        console.log('✅ Edit success callback');
        // Force page reload to show updated data
        window.location.reload();
    }

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id)
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
            router.refresh()
        } catch (error) {
            toast.error('Failed to mark notification as read. Please try again')
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead(user.id)
            setNotifications(notifications.map(n => ({ ...n, is_read: true })))
            toast.success('All notifications marked as read')
            router.refresh()
        } catch (error) {
            console.error('Error marking all read:', error)
            toast.error('Failed to mark all as read')
        }
    }

    const filteredTransactions = transactions.filter(t => {
        // Apply type filter from URL
        if (typeFilter && t.type !== typeFilter) return false

        // Apply search filter
        if (search && !(
            (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
            (t.category && t.category.toLowerCase().includes(search.toLowerCase()))
        )) return false

        // Apply wallet filter
        if (walletFilter !== 'all' && t.wallet_id !== walletFilter) return false

        return true
    })

    const unreadCount = notifications.filter(n => !n.is_read).length

    const clearFilters = () => {
        setSearch('')
        setWalletFilter('all')
        router.push('/history')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">History</h1>

                <Tabs defaultValue="transactions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transactions">
                            💰 Transactions
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Wallet Filter Dropdown */}
                            <select
                                value={walletFilter}
                                onChange={(e) => {
                                    console.log('💳 Wallet filter changed to:', e.target.value)
                                    setWalletFilter(e.target.value)
                                }}
                                className="px-3 py-2 pr-8 border rounded-md bg-background text-sm min-w-[150px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat"
                            >
                                <option value="all">All Wallets</option>
                                {wallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                    </option>
                                ))}
                            </select>

                            {(typeFilter || search || walletFilter !== 'all') && (
                                <Button variant="outline" onClick={clearFilters}>
                                    <X className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {typeFilter && (
                            <div className="text-sm text-muted-foreground">
                                Showing {typeFilter} transactions
                            </div>
                        )}

                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TransactionSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {filteredTransactions.map(transaction => (
                                    <TransactionRow
                                        key={transaction.id}
                                        transaction={transaction}
                                        currency={currency}
                                        onDelete={refreshData}
                                        onEdit={() => handleEdit(transaction)}
                                        currentUserId={user.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">
                                    {search ? 'No transactions found matching your search' : 'No transactions yet. Start by chatting with Sasha!'}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4">
                        {unreadCount > 0 && (
                            <Button onClick={handleMarkAllRead} variant="outline">
                                Mark All as Read
                            </Button>
                        )}

                        {notifications.length > 0 ? (
                            <div className="space-y-2">
                                {notifications.map(notification => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onMarkRead={() => handleMarkRead(notification.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No notifications</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <EditTransactionDialog
                transaction={editingTransaction}
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={handleEditSuccess}
            />
        </div>
    )
}