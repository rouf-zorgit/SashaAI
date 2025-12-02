"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { createGoal } from '@/lib/queries/goals'
import { toast } from 'sonner'

interface AddGoalDialogProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    onSuccess: () => void
}

export function AddGoalDialog({ isOpen, onClose, userId, onSuccess }: AddGoalDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        target_amount: '',
        deadline: '',
        category: 'general'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate user ID first
        if (!userId || userId === '') {
            console.error('❌ No user ID available')
            toast.error('Authentication error - please refresh the page')
            return
        }

        console.log('👤 User ID:', userId)

        // Validate inputs
        if (!formData.title.trim()) {
            toast.error('Please enter a goal title')
            return
        }

        if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
            toast.error('Please enter a valid target amount')
            return
        }

        setLoading(true)

        try {
            const result = await createGoal(userId, {
                title: formData.title.trim(),
                target_amount: parseFloat(formData.target_amount),
                deadline: formData.deadline || undefined,
                category: formData.category
            })

            console.log('Goal created successfully:', result)
            toast.success('Goal created successfully!')

            // Reset form
            setFormData({ title: '', target_amount: '', deadline: '', category: 'general' })

            // Call success callback
            onSuccess()

            // Close dialog
            onClose()
        } catch (error: any) {
            console.error('Error creating goal:', error)
            toast.error(error.message || 'Failed to create goal')
        } finally {
            // Always reset loading state
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Goal Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Buy a car"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="amount">Target Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.target_amount}
                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                            placeholder="10000"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Goal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}