import { supabase } from './supabase';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface Transaction {
    amount: number;
    category: string;
    type: string;
    created_at: string;
}

export interface ChatRequest {
    userId: string;
    sessionId?: string; // STM: Session ID for context tracking
    message: string;
    recentMessages: ChatMessage[];
    recentTransactions: Transaction[];
}

export interface TransactionData {
    amount: number;
    currency: string;
    type: 'income' | 'expense';
    category: string;
    merchant?: string;
    description: string;
    occurred_at: string;
    isRecurringSuspect: boolean;
    duplicateSuspect: boolean;
    duplicateReason?: string;
    recurringReason?: string;
}

export interface ChatResponse {
    mode: 'conversation' | 'transaction';
    reply: string;
    intent: 'create' | 'edit' | 'delete' | 'undo' | 'confirm' | 'reject' | 'none' | 'ghost';
    confidence: number;
    transaction?: TransactionData;
    chart?: {
        type: 'pie' | 'bar';
        title: string;
        data: Array<{ name: string; value: number }>;
    };
}

export interface ReceiptRequest {
    userId: string;
    imageBase64: string;
}

export interface ReceiptResponse {
    success: boolean;
    error?: string;
    transaction?: {
        merchant: string;
        amount: number;
        currency: string;
        category: string;
        date: string;
        items?: string[];
    };
}

export async function processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
        console.log('Calling processChat Edge Function with:', request);
        
        const { data, error } = await supabase.functions.invoke('processChat', {
            body: request
        });

        if (error) {
            console.error('Edge Function error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('Edge Function response:', data);

        // Validate response structure
        if (!data || typeof data.mode !== 'string' || typeof data.reply !== 'string') {
            console.error('Invalid response format. Received:', data);
            throw new Error('Invalid response format');
        }

        return data as ChatResponse;
    } catch (error) {
        console.error('AI processing error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        // Return friendly fallback
        return {
            mode: 'conversation',
            reply: "Something went wrong on my side. Could you try again in a moment?",
            intent: 'none',
            confidence: 0
        };
    }
}

export async function processReceipt(request: ReceiptRequest): Promise<ReceiptResponse> {
    try {
        console.log('Invoking processReceipt Edge Function...');
        const { data, error } = await supabase.functions.invoke('processReceipt', {
            body: request
        });

        if (error) {
            console.error('Receipt processing error:', error);
            return {
                success: false,
                error: error.message || 'Failed to process receipt. Please try again.'
            };
        }

        console.log('Receipt processing successful:', data);
        return data as ReceiptResponse;
    } catch (error) {
        console.error('Receipt OCR error:', error);
        return {
            success: false,
            error: 'Failed to process receipt. Please try again.'
        };
    }
}
