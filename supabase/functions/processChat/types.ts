// ============================================================================
// TYPE DEFINITIONS FOR PROCESSCHAT
// ============================================================================

export interface ChatRequest {
    userId: string;
    sessionId?: string;
    message: string;
    recentMessages: Message[];
    recentTransactions: Transaction[];
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    category: string;
    merchant_name?: string;
    description?: string;
    created_at: string;
    type: 'income' | 'expense' | 'adjustment';
    currency: string;
    base_amount: number;
}

export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    monthly_salary?: number;
    income_monthly?: number;
    created_at: string;
    updated_at: string;
}

export interface MemoryEvent {
    id: string;
    user_id: string;
    kind: string;
    data: Record<string, any>;
    salience: number;
    created_at: string;
}

export interface UserPreferences {
    user_id: string;
    preferred_currency?: string;
    notification_enabled?: boolean;
    theme?: string;
}

export interface RecurringPayment {
    id: string;
    user_id: string;
    merchant_name: string;
    amount: number;
    frequency: string;
    next_due_date?: string;
    is_active: boolean;
}

export interface SpendingPattern {
    id: string;
    user_id: string;
    pattern_type: string;
    trigger_day?: string;
    trigger_category?: string;
    avg_amount?: number;
    frequency?: string;
    confidence?: number;
}

export interface ClassificationResult {
    intent: string;
    confidence: number;
    entities?: {
        amount?: number;
        merchant?: string;
        category?: string;
    };
    memory_update?: any;
}

export interface ChatResponse {
    mode: 'conversation' | 'transaction';
    reply: string;
    intent: string;
    confidence: number;
    transaction?: {
        amount: number;
        category: string;
        merchant?: string;
        currency?: string;
        type?: string;
        occurred_at?: string;
        description?: string;
    };
}

export interface EpisodicEvent {
    user_id: string;
    event_type: string;
    event_data: Record<string, any>;
    occurred_at: string;
    importance: number;
    tags: string[];
    summary: string;
}

export interface EmotionDetection {
    emotion: string;
    intensity: number;
}

export interface ConversationContext {
    user_id: string;
    session_id: string;
    context_type: string;
    key: string;
    value: string;
    expires_at: string;
}
