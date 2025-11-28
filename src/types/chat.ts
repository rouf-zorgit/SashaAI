export interface Message {
    id: string
    user_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    intent?: string | null
    confidence?: number | null
    metadata?: any
    created_at: string
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface Transaction {
    amount: number
    category: string
    type: 'income' | 'expense'
    description: string
}
