"use client"

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Notification } from '@/types/database'
import { formatTimeAgo } from '@/lib/utils/date'
import { Bell, AlertTriangle, Trophy, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationCardProps {
    notification: Notification
    onMarkRead: () => void
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
    const icons = {
        reminder: Bell,
        alert: AlertTriangle,
        milestone: Trophy,
        transaction: Receipt
    }

    const Icon = icons[notification.type] || Bell

    return (
        <Card className={`p-4 ${!notification.is_read ? 'bg-accent/10 border-l-4 border-l-primary' : 'opacity-60'}`}>
            <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                    <h3 className={`font-semibold ${!notification.is_read ? 'font-bold' : ''}`}>
                        {notification.title}
                    </h3>
                    {notification.message && (
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(notification.created_at)}
                    </p>
                </div>
                {!notification.is_read && (
                    <Button size="sm" variant="ghost" onClick={onMarkRead}>
                        Mark ✓
                    </Button>
                )}
            </div>
        </Card>
    )
}
