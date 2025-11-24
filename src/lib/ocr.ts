import { supabase } from './supabase';

export interface OCRRequest {
    userId: string;
    imageBase64: string;
}

export interface OCRTransaction {
    amount: number;
    currency: string;
    merchant: string;
    category: string;
    date: string;
    items?: string[];
}

export interface OCRResponse {
    success: boolean;
    transaction?: OCRTransaction;
    error?: string;
}

export async function processReceipt(request: OCRRequest): Promise<OCRResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('processReceipt', {
            body: request
        });

        if (error) {
            console.error('OCR Edge Function error:', error);
            throw error;
        }

        return data as OCRResponse;
    } catch (error) {
        console.error('OCR processing error:', error);

        return {
            success: false,
            error: 'Failed to process receipt. Please try again.'
        };
    }
}

export function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove the data:image/...;base64, prefix
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
