"use client"

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Goal } from '@/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { Trash2, TrendingUp } from 'lucide-react'

interface GoalCardProps {
    goal: Goal
    currency: string
    onUpdate: () => void
    onDelete: () => void
}

export function GoalCard({ goal, currency, onUpdate, onDelete }: GoalCardProps) {
    const progress = (goal.current_amount / goal.target_amount) * 100
    const isCompleted = goal.is_completed || progress >= 100

    const progressColor = progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'

    return (
        <Card className={`p-4 ${isCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            🎯 {goal.title}
                            {isCompleted && <span className="text-sm text-green-600">✓ Completed</span>}
                        </h3>
                        {goal.category && <p className="text-sm text-muted-foreground capitalize">{goal.category}</p>}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                        <span className="font-medium">
                            {formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
                        </span>
                    </div>
                    <Progress value={progress} className={progressColor} />
                </div>

                {goal.deadline && (
                    <p className="text-sm text-muted-foreground">
                        Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                    </p>
                )}

                {!isCompleted && (
                    <Button onClick={onUpdate} className="w-full" size="sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Update Progress
                    </Button>
                )}
            </div>
        </Card>
    )
}