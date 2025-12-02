"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { deleteGoal, updateGoalProgress, getUserGoals } from '@/lib/queries/goals'
import { GoalCard } from '@/components/goals/GoalCard'
import { AddGoalDialog } from '@/components/goals/AddGoalDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { Goal } from '@/types/database'
import { toast } from 'sonner'
import Link from 'next/link'

interface GoalsClientProps {
    initialGoals: Goal[]
    userId: string
}

export function GoalsClient({ initialGoals, userId }: GoalsClientProps) {
    const router = useRouter()
    const { profile } = useAuthStore()
    const [goals, setGoals] = useState<Goal[]>(initialGoals)
    const [showAddDialog, setShowAddDialog] = useState(false)

    const refreshGoals = async () => {
        try {
            const data = await getUserGoals(userId)
            setGoals(data)
            router.refresh() // Refresh server components too
        } catch (error) {
            console.error('Error refreshing goals:', error)
        }
    }

    const handleDelete = async (goalId: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return

        try {
            await deleteGoal(goalId)
            setGoals(goals.filter(g => g.id !== goalId))
            toast.success('Goal deleted')
            router.refresh()
        } catch (error) {
            console.error('Error deleting goal:', error)
            toast.error('Failed to delete goal')
        }
    }

    const handleUpdate = async (goalId: string) => {
        const goal = goals.find(g => g.id === goalId)
        if (!goal) return

        const newAmount = prompt(`Current progress: $${goal.current_amount}\nEnter new amount:`, goal.current_amount.toString())
        if (!newAmount) return

        try {
            await updateGoalProgress(goalId, parseFloat(newAmount))
            await refreshGoals()
            toast.success('Progress updated!')
        } catch (error) {
            console.error('Error updating goal:', error)
            toast.error('Failed to update progress')
        }
    }

    const activeGoals = goals.filter(g => !g.is_completed)
    const completedGoals = goals.filter(g => g.is_completed)

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
                        <h1 className="text-3xl font-bold">Goals</h1>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                    </Button>
                </div>

                {activeGoals.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Active Goals ({activeGoals.length})</h2>
                        <div className="space-y-3">
                            {activeGoals.map(goal => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    currency={profile?.currency || 'USD'}
                                    onUpdate={() => handleUpdate(goal.id)}
                                    onDelete={() => handleDelete(goal.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {completedGoals.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Completed Goals ({completedGoals.length})</h2>
                        <div className="space-y-3">
                            {completedGoals.map(goal => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    currency={profile?.currency || 'USD'}
                                    onUpdate={() => handleUpdate(goal.id)}
                                    onDelete={() => handleDelete(goal.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {goals.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No goals yet. Create your first goal!</p>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Goal
                        </Button>
                    </div>
                )}

                <AddGoalDialog
                    isOpen={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    userId={userId}
                    onSuccess={refreshGoals}
                />
            </div>
        </div>
    )
}