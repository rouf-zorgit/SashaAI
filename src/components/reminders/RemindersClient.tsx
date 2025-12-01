"use client"

import { useState } from 'react'
import Link from 'next/link'
import { markReminderPaid, deleteReminder, createReminder, getUserReminders } from '@/lib/queries/reminders'
import { ReminderCard } from '@/components/reminders/ReminderCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus } from 'lucide-react'
import { Reminder } from '@/types/database'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface RemindersClientProps {
    initialReminders: Reminder[]
    user: User
    currency: string
}

export function RemindersClient({ initialReminders, user, currency }: RemindersClientProps) {
    const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        due_date: '',
        is_recurring: false
    })
    const router = useRouter()

    const refreshReminders = async () => {
        try {
            const data = await getUserReminders(user.id)
            setReminders(data)
            router.refresh()
        } catch (error) {
            console.error('Error refreshing reminders:', error)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createReminder(user.id, {
                title: formData.title,
                amount: parseFloat(formData.amount),
                due_date: formData.due_date,
                is_recurring: formData.is_recurring
            })
            toast.success('Reminder created!')
            setShowAddDialog(false)
            setFormData({ title: '', amount: '', due_date: '', is_recurring: false })
            refreshReminders()
        } catch (error) {
            console.error('Error creating reminder:', error)
            toast.error('Failed to create reminder')
        }
    }

    const handleMarkPaid = async (id: string) => {
        try {
            await markReminderPaid(id)
            toast.success('Marked as paid!')
            refreshReminders()
        } catch (error) {
            console.error('Error marking paid:', error)
            toast.error('Failed to mark as paid')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this reminder?')) return

        try {
            await deleteReminder(id)
            toast.success('Reminder deleted')
            setReminders(reminders.filter(r => r.id !== id))
            router.refresh()
        } catch (error) {
            console.error('Error deleting reminder:', error)
            toast.error('Failed to delete reminder')
        }
    }

    const overdue = reminders.filter(r => !r.is_paid && new Date(r.due_date) < new Date())
    const upcoming = reminders.filter(r => !r.is_paid && new Date(r.due_date) >= new Date())
    const paid = reminders.filter(r => r.is_paid)

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/profile">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Reminders</h1>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reminder
                    </Button>
                </div>

                {overdue.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3 text-red-600">Overdue ({overdue.length}) ⚠️</h2>
                        <div className="space-y-3">
                            {overdue.map(reminder => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    currency={currency}
                                    onMarkPaid={() => handleMarkPaid(reminder.id)}
                                    onDelete={() => handleDelete(reminder.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {upcoming.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
                        <div className="space-y-3">
                            {upcoming.map(reminder => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    currency={currency}
                                    onMarkPaid={() => handleMarkPaid(reminder.id)}
                                    onDelete={() => handleDelete(reminder.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {paid.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Paid ({paid.length}) ✓</h2>
                        <div className="space-y-3">
                            {paid.map(reminder => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    currency={currency}
                                    onMarkPaid={() => handleMarkPaid(reminder.id)}
                                    onDelete={() => handleDelete(reminder.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {reminders.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No reminders yet. Add your first bill reminder!</p>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Reminder
                        </Button>
                    </div>
                )}

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Reminder</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Rent Payment"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="due_date">Due Date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Reminder</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
