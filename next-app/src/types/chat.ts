export interface Message {
    id: string
    user_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
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
