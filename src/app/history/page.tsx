"use client"

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { getTransactionsWithFilters, getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/queries/history'
import { TransactionRow } from '@/components/history/TransactionRow'
import { NotificationCard } from '@/components/history/NotificationCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function HistoryPage() {
    const { user, profile } = useAuthStore()
    const [transactions, setTransactions] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadData = async () => {
        if (!user) return
        setLoading(true)
        try {
            const [txns, notifs] = await Promise.all([
                getTransactionsWithFilters(user.id, { limit: 50 }),
                getNotifications(user.id)
            ])
            setTransactions(txns)
            setNotifications(notifs)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load history')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id)
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (error) {
            console.error('Error marking notification:', error)
            toast.error('Failed to mark as read')
        }
    }

    const handleMarkAllRead = async () => {
        if (!user) return
        try {
            await markAllNotificationsRead(user.id)
            setNotifications(notifications.map(n => ({ ...n, is_read: true })))
            toast.success('All notifications marked as read')
        } catch (error) {
            console.error('Error marking all read:', error)
            toast.error('Failed to mark all as read')
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    )

    const unreadCount = notifications.filter(n => !n.is_read).length

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
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
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {filteredTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {filteredTransactions.map(transaction => (
                                    <TransactionRow
                                        key={transaction.id}
                                        transaction={transaction}
                                        currency={profile?.currency || 'USD'}
                                        onDelete={loadData}
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
        </div>
    )
}
