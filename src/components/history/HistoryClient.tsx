"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { markNotificationRead, markAllNotificationsRead, getTransactionsWithFilters } from '@/lib/queries/history'
import { TransactionRow } from '@/components/history/TransactionRow'
import { NotificationCard } from '@/components/history/NotificationCard'
import { EditTransactionDialog } from '@/components/history/EditTransactionDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface HistoryClientProps {
    initialTransactions: any[]
    initialNotifications: any[]
    user: User
    currency: string
}

export function HistoryClient({ initialTransactions, initialNotifications, user, currency }: HistoryClientProps) {
    const [transactions, setTransactions] = useState<any[]>(initialTransactions)
    const [notifications, setNotifications] = useState<any[]>(initialNotifications)
    const [search, setSearch] = useState('')
    const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const typeFilter = searchParams.get('type') // 'income' or 'expense'

    const refreshData = async () => {
        try {
            const txns = await getTransactionsWithFilters(user.id, { limit: 50 })
            setTransactions(txns)
            router.refresh()
        } catch (error) {
            console.error('Error refreshing data:', error)
        }
    }

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
            console.error('Error marking notification:', error)
            toast.error('Failed to mark as read')
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
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase())
        )) return false

        return true
    })

    const unreadCount = notifications.filter(n => !n.is_read).length

    const clearFilters = () => {
        setSearch('')
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
                            {(typeFilter || search) && (
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

                        {filteredTransactions.length > 0 ? (
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
                                    {search ? 'No transactions found' : 'No transactions yet'}
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
