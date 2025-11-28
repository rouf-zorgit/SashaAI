"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Reminder } from '@/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDaysUntil } from '@/lib/utils/date'
import { Trash2, Check, Bell } from 'lucide-react'

interface ReminderCardProps {
    reminder: Reminder
    currency: string
    onMarkPaid: () => void
    onDelete: () => void
}

export function ReminderCard({ reminder, currency, onMarkPaid, onDelete }: ReminderCardProps) {
    const daysUntil = formatDaysUntil(reminder.due_date)
    const isOverdue = daysUntil.includes('overdue')
    const isDueSoon = daysUntil.includes('today') || daysUntil.includes('tomorrow') || daysUntil.includes('in 1') || daysUntil.includes('in 2')
    const isPaid = reminder.is_paid

    const cardColor = isPaid
        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        : isOverdue
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            : isDueSoon
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                : ''

    return (
        <Card className={`p-4 ${cardColor}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Bell className="h-4 w-4" />
                        <h3 className="font-semibold">{reminder.title}</h3>
                        {reminder.is_recurring && <Badge variant="outline">🔄 Recurring</Badge>}
                        {isPaid && <Badge className="bg-green-600">✓ Paid</Badge>}
                    </div>
                    <p className="text-2xl font-bold mb-2">{formatCurrency(reminder.amount, currency)}</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {daysUntil}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isPaid && (
                        <Button size="sm" onClick={onMarkPaid}>
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
