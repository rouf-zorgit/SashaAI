"use client"

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Notification } from '@/types/database'
import { formatTimeAgo } from '@/lib/utils/date'
import {
    AlertTriangle,
    TrendingUp,
    Target,
    FileText,
    CheckCircle2,
    Info,
    DollarSign,
    Calendar,
    PiggyBank,
    Zap,
    Bell
} from 'lucide-react'

interface NotificationCardProps {
    notification: Notification
    onMarkRead: () => void
}

// Notification type configuration with Sasha's professional tone
const notificationConfig = {
    // 🔴 Critical - The Strict Auditor
    budget_exceeded: {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-l-red-500',
        badge: 'Critical',
        badgeVariant: 'destructive' as const
    },
    overdraft: {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-l-red-600',
        badge: 'Urgent',
        badgeVariant: 'destructive' as const
    },
    goal_at_risk: {
        icon: Target,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-l-red-500',
        badge: 'Action Required',
        badgeVariant: 'destructive' as const
    },

    // 🟡 Warning - The Forecaster
    budget_warning: {
        icon: TrendingUp,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-l-yellow-600',
        badge: 'Warning',
        badgeVariant: 'secondary' as const
    },
    unusual_spending: {
        icon: Zap,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-l-yellow-500',
        badge: 'Unusual Activity',
        badgeVariant: 'secondary' as const
    },
    upcoming_bill: {
        icon: Calendar,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-l-yellow-600',
        badge: 'Upcoming',
        badgeVariant: 'secondary' as const
    },

    // 🟢 Success - The Goal Keeper
    goal_reached: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-l-green-500',
        badge: 'Achievement',
        badgeVariant: 'default' as const
    },
    deposit_received: {
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-l-green-600',
        badge: 'Income',
        badgeVariant: 'default' as const
    },
    goal_transfer: {
        icon: PiggyBank,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-l-green-500',
        badge: 'Goal Progress',
        badgeVariant: 'default' as const
    },

    // 🔵 Info - The Audit
    weekly_summary: {
        icon: FileText,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-l-blue-500',
        badge: 'Weekly Audit',
        badgeVariant: 'outline' as const
    },
    monthly_report: {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-l-blue-600',
        badge: 'Monthly Report',
        badgeVariant: 'outline' as const
    },
    insight: {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-l-blue-500',
        badge: 'Insight',
        badgeVariant: 'outline' as const
    },

    // Default fallback
    default: {
        icon: Bell,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        borderColor: 'border-l-gray-500',
        badge: 'Notification',
        badgeVariant: 'outline' as const
    }
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
    // Get configuration for this notification type
    const config = notificationConfig[notification.type as keyof typeof notificationConfig] || notificationConfig.default
    const Icon = config.icon

    // Determine if unread - handle both is_read and read properties
    const isUnread = !(notification.is_read || (notification as any).read)

    return (
        <Card
            className={`
                p-4 transition-all duration-200 hover:shadow-md
                ${isUnread ? `${config.bgColor} border-l-4 ${config.borderColor}` : 'opacity-70 hover:opacity-90'}
            `}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`mt-1 ${config.color}`}>
                    <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header with Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-semibold text-base leading-tight ${isUnread ? 'font-bold' : ''}`}>
                            {notification.title}
                        </h3>
                        <Badge variant={config.badgeVariant} className="shrink-0 text-xs">
                            {config.badge}
                        </Badge>
                    </div>

                    {/* Message */}
                    {notification.message && (
                        <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                            {notification.message}
                        </p>
                    )}

                    {/* Footer with timestamp and action */}
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                        </p>

                        {isUnread && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onMarkRead}
                                className="h-7 text-xs hover:bg-background/50"
                            >
                                Mark as read
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
