'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    created_at: string
    is_read: boolean
}

interface NotificationListProps {
    userId: string
}

export function NotificationList({ userId }: NotificationListProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNotifications = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (data) {
                setNotifications(data as Notification[])
            }
            setLoading(false)
        }

        fetchNotifications()
    }, [userId])

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    if (loading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
    }

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col max-h-[400px]">
            <div className="p-3 border-b font-medium text-sm">Notifications</div>
            <ScrollArea className="flex-1">
                <div className="divide-y">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-muted/20' : ''}`}
                        >
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5">{getIcon(notification.type)}</div>
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground pt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
