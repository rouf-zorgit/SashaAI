import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatTransactionDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date

    if (isToday(d)) {
        return 'Today'
    }
    if (isYesterday(d)) {
        return 'Yesterday'
    }
    return format(d, 'MMM dd, yyyy')
}

export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'h:mm a')
}

export function formatTimeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDaysUntil(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`
    }
    if (diffDays === 0) {
        return 'Due today'
    }
    if (diffDays === 1) {
        return 'Due tomorrow'
    }
    return `Due in ${diffDays} days`
}
