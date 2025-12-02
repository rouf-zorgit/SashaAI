export interface Goal {
    id: string
    user_id: string
    title: string
    target_amount: number
    current_amount: number
    deadline: string | null
    category: string | null
    is_completed: boolean | null
    created_at: string
    updated_at: string
}

export interface Notification {
    id: string
    user_id: string
    type: 'reminder' | 'alert' | 'milestone' | 'transaction'
    title: string
    message: string | null
    related_id: string | null
    is_read: boolean
    created_at: string
}

export interface Reminder {
    id: string
    user_id: string
    title: string
    amount: number
    due_date: string
    is_recurring: boolean
    is_paid: boolean
    created_at: string
}