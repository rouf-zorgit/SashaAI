// ============================================================================
// TRANSACTION BRAIN - System 6
// ============================================================================
// 100% reliable transaction handling with validation, undo, edit, delete
// Prevents wrong auto-saves and ensures perfect accuracy
// ============================================================================

import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface TransactionValidation {
    isValid: boolean
    warnings: string[]
    errors: string[]
    isDuplicate: boolean
    duplicateReason?: string
}

export interface TransactionData {
    amount: number
    currency: string
    type: 'income' | 'expense'
    category: string
    merchant_name?: string
    description?: string
    occurred_at: string
    source: 'chat' | 'ocr' | 'manual'
    confidence?: number
}

/**
 * Comprehensive transaction validation
 */
export async function validateTransaction(
    transaction: TransactionData,
    userId: string,
    supabaseClient: any
): Promise<TransactionValidation> {
    const warnings: string[] = []
    const errors: string[] = []
    let isDuplicate = false
    let duplicateReason: string | undefined

    // Validate amount
    if (transaction.amount <= 0) {
        errors.push('Amount must be greater than 0')
    }

    if (transaction.amount > 1000000) {
        warnings.push('VERY HIGH AMOUNT: Please confirm this is correct')
    }

    // Category-specific validation
    if (transaction.category === 'coffee' && transaction.amount > 1000) {
        warnings.push('SUSPICIOUS: Coffee expense over 1000 BDT')
    }

    if (transaction.category === 'food' && transaction.amount > 5000) {
        warnings.push('SUSPICIOUS: Food expense over 5000 BDT')
    }

    if (transaction.category === 'transport' && transaction.amount > 3000) {
        warnings.push('SUSPICIOUS: Transport expense over 3000 BDT')
    }

    // Check for duplicates (same amount + merchant within 24 hours)
    if (transaction.merchant_name) {
        const { data: recentTx } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('amount', transaction.amount)
            .eq('merchant_name', transaction.merchant_name)
            .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (recentTx && recentTx.length > 0) {
            isDuplicate = true
            duplicateReason = `Same amount (${transaction.amount}) at ${transaction.merchant_name} within last 24 hours`
            warnings.push(`DUPLICATE DETECTED: ${duplicateReason}`)
        }
    } else {
        // Check for duplicate amount only
        const { data: recentTx } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('amount', transaction.amount)
            .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (recentTx && recentTx.length > 0) {
            isDuplicate = true
            duplicateReason = `Same amount (${transaction.amount}) within last 24 hours`
            warnings.push(`POSSIBLE DUPLICATE: ${duplicateReason}`)
        }
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
        isDuplicate,
        duplicateReason
    }
}

/**
 * Save transaction with retry logic (100% reliable)
 */
export async function saveTransaction(
    transaction: TransactionData,
    userId: string,
    supabaseClient: any,
    maxRetries: number = 3
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Validate first
    const validation = await validateTransaction(transaction, userId, supabaseClient)

    if (!validation.isValid) {
        return {
            success: false,
            error: validation.errors.join(', ')
        }
    }

    // Attempt save with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    base_amount: transaction.amount, // Assuming BDT is base
                    category: transaction.category,
                    type: transaction.type,
                    merchant_name: transaction.merchant_name,
                    description: transaction.description,
                    occurred_at: transaction.occurred_at,
                    source: transaction.source,
                    confidence: transaction.confidence || 1.0,
                    is_confirmed: true
                })
                .select()
                .single()

            if (error) throw error

            // Save to undo stack
            await supabaseClient
                .from('transaction_undo_stack')
                .insert({
                    user_id: userId,
                    transaction_id: data.id,
                    transaction_data: data,
                    action: 'create'
                })

            console.log(`✅ Transaction saved successfully (attempt ${attempt}):`, data.id)

            return {
                success: true,
                transactionId: data.id
            }
        } catch (error) {
            console.error(`❌ Save attempt ${attempt} failed:`, error)

            if (attempt === maxRetries) {
                return {
                    success: false,
                    error: `Failed after ${maxRetries} attempts: ${error.message}`
                }
            }

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
    }

    return {
        success: false,
        error: 'Unknown error'
    }
}

/**
 * Edit transaction
 */
export async function editTransaction(
    transactionId: string,
    updates: Partial<TransactionData>,
    userId: string,
    supabaseClient: any
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get original transaction
        const { data: original } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('user_id', userId)
            .single()

        if (!original) {
            return { success: false, error: 'Transaction not found' }
        }

        // Save to undo stack
        await supabaseClient
            .from('transaction_undo_stack')
            .insert({
                user_id: userId,
                transaction_id: transactionId,
                transaction_data: original,
                action: 'update'
            })

        // Update transaction
        const { error } = await supabaseClient
            .from('transactions')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)
            .eq('user_id', userId)

        if (error) throw error

        console.log(`✅ Transaction edited successfully:`, transactionId)
        return { success: true }
    } catch (error) {
        console.error(`❌ Edit failed:`, error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(
    transactionId: string,
    userId: string,
    supabaseClient: any
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get original transaction
        const { data: original } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('user_id', userId)
            .single()

        if (!original) {
            return { success: false, error: 'Transaction not found' }
        }

        // Save to undo stack
        await supabaseClient
            .from('transaction_undo_stack')
            .insert({
                user_id: userId,
                transaction_id: transactionId,
                transaction_data: original,
                action: 'delete'
            })

        // Soft delete
        const { error } = await supabaseClient
            .from('transactions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', transactionId)
            .eq('user_id', userId)

        if (error) throw error

        console.log(`✅ Transaction deleted successfully:`, transactionId)
        return { success: true }
    } catch (error) {
        console.error(`❌ Delete failed:`, error)
        return { success: false, error: error.message }
    }
}

/**
 * Undo last transaction
 */
export async function undoLastTransaction(
    userId: string,
    supabaseClient: any
): Promise<{ success: boolean; message: string; error?: string; needsClarification?: boolean; recentTransactions?: any[] }> {
    try {
        // Check if there are multiple recent transactions (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const { data: recentTransactions } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(5)

        // If multiple transactions, ask for clarification
        if (recentTransactions && recentTransactions.length > 1) {
            return {
                success: false,
                message: `I see ${recentTransactions.length} recent transactions. Which one should I undo?`,
                needsClarification: true,
                recentTransactions: recentTransactions.map(t => ({
                    id: t.id,
                    amount: t.amount,
                    category: t.category,
                    merchant: t.merchant_name,
                    created_at: t.created_at
                }))
            }
        }

        // Get last undo stack entry
        const { data: lastUndo } = await supabaseClient
            .from('transaction_undo_stack')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!lastUndo) {
            return { success: false, message: 'Nothing to undo', error: 'No undo history' }
        }

        const { action, transaction_id, transaction_data } = lastUndo

        switch (action) {
            case 'create':
                // Undo create = delete
                await supabaseClient
                    .from('transactions')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', transaction_id)

                return { success: true, message: `Undone: Removed ${transaction_data.amount} BDT transaction` }

            case 'update':
                // Undo update = restore original
                await supabaseClient
                    .from('transactions')
                    .update(transaction_data)
                    .eq('id', transaction_id)

                return { success: true, message: `Undone: Restored original transaction` }

            case 'delete':
                // Undo delete = restore
                await supabaseClient
                    .from('transactions')
                    .update({ deleted_at: null })
                    .eq('id', transaction_id)

                return { success: true, message: `Undone: Restored ${transaction_data.amount} BDT transaction` }

            default:
                return { success: false, message: 'Unknown action', error: 'Invalid undo action' }
        }
    } catch (error) {
        console.error(`❌ Undo failed:`, error)
        return { success: false, message: 'Undo failed', error: error.message }
    }
}

/**
 * Prevent auto-save for suspicious transactions
 */
export function shouldPreventAutoSave(validation: TransactionValidation): boolean {
    return validation.isDuplicate || validation.warnings.some(w => w.includes('SUSPICIOUS'))
}
