'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ErrorMessages } from '@/lib/error-messages'
import { invalidateUserCache } from '@/lib/cache/server-cache'
import {
    deleteTransactionSchema,
    updateTransactionSchema,
    validateSchema,
    uuidSchema,
    positiveNumberSchema,
    categorySchema,
    dateSchema
} from '@/lib/validation'

export async function deleteTransaction(transactionId: string) {
    try {
        // 1. Validate input
        const validation = validateSchema(deleteTransactionSchema, { id: transactionId })
        if (!validation.success) {
            return { success: false, error: validation.error }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: ErrorMessages.auth.notAuthenticated }
        }

        // 3. Soft delete with ownership verification
        const { data, error } = await supabase
            .from('transactions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', transactionId)
            .eq('user_id', user.id) // ✅ Verify ownership
            .select()
            .single()

        if (error) {
            console.error('Delete transaction error:', error)
            return { success: false, error: ErrorMessages.transaction.deleteFailed }
        }

        if (!data) {
            return { success: false, error: ErrorMessages.transaction.notFound }
        }

        invalidateUserCache(user.id)
        revalidatePath('/history')

        return { success: true, data }

    } catch (error: any) {
        console.error('Delete transaction error:', error)
        return { success: false, error: ErrorMessages.transaction.deleteFailed }
    }
}

export async function updateTransaction(transactionId: string, updates: {
    amount: number
    category: string
    type: 'income' | 'expense'
    description: string
    date: string
}) {
    try {
        // 1. Validate input
        const validation = validateSchema(updateTransactionSchema, {
            id: transactionId,
            ...updates
        })
        if (!validation.success) {
            return { success: false, error: validation.error }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: ErrorMessages.auth.notAuthenticated }
        }

        // 3. Update with ownership verification
        const { data, error } = await supabase
            .from('transactions')
            .update({
                amount: updates.amount,
                base_amount: updates.amount,
                category: updates.category,
                type: updates.type,
                description: updates.description,
                date: updates.date,
            })
            .eq('id', transactionId)
            .eq('user_id', user.id) // ✅ Verify ownership
            .select()
            .single()

        if (error) {
            console.error('Update transaction error:', error)
            return { success: false, error: ErrorMessages.transaction.updateFailed }
        }

        if (!data) {
            return { success: false, error: ErrorMessages.transaction.notFound }
        }

        invalidateUserCache(user.id)
        revalidatePath('/history')

        return { success: true, data }

    } catch (error: any) {
        console.error('Update transaction error:', error)
        return { success: false, error: ErrorMessages.transaction.updateFailed }
    }
}

export async function restoreTransaction(transactionId: string) {
    try {
        // 1. Validate input
        const validation = validateSchema(uuidSchema, transactionId)
        if (!validation.success) {
            return { success: false, error: 'Invalid transaction ID format' }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: ErrorMessages.auth.notAuthenticated }
        }

        // 3. Restore with ownership verification
        const { data, error } = await supabase
            .from('transactions')
            .update({ deleted_at: null })
            .eq('id', transactionId)
            .eq('user_id', user.id) // ✅ Verify ownership
            .select()
            .single()

        if (error) {
            console.error('Restore transaction error:', error)
            return { success: false, error: 'Failed to restore transaction' }
        }

        invalidateUserCache(user.id)
        revalidatePath('/history')

        return { success: true, data }

    } catch (error: any) {
        console.error('Restore transaction error:', error)
        return { success: false, error: 'Failed to restore transaction' }
    }
}

export async function saveReceiptTransaction(data: {
    amount: number
    category: string
    description: string
    date: string
    receiptUrl: string
    walletId: string
    merchant: string
}) {
    try {
        // 1. Validate inputs
        const amountValidation = validateSchema(positiveNumberSchema, data.amount)
        if (!amountValidation.success) {
            return { error: 'Amount must be a positive number' }
        }

        const categoryValidation = validateSchema(categorySchema, data.category)
        if (!categoryValidation.success) {
            return { error: 'Invalid category' }
        }

        const walletIdValidation = validateSchema(uuidSchema, data.walletId)
        if (!walletIdValidation.success) {
            return { error: 'Invalid wallet ID format' }
        }

        const dateValidation = validateSchema(dateSchema, data.date)
        if (!dateValidation.success) {
            return { error: 'Invalid date format' }
        }

        if (!data.description || data.description.length > 500) {
            return { error: 'Description must be between 1 and 500 characters' }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: ErrorMessages.auth.notAuthenticated }
        }

        // 3. Verify wallet ownership and get balance
        console.log('🔍 Verifying wallet:', data.walletId, 'for user:', user.id)

        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance, name')  // ✅ FIXED: Removed is_active (doesn't exist)
            .eq('id', data.walletId)
            .eq('user_id', user.id) // ✅ Verify ownership
            .single()

        console.log('Wallet query result:', { wallet, walletError })

        if (walletError || !wallet) {
            console.error('❌ Wallet not found or error:', walletError)
            return { error: ErrorMessages.wallet.notFound }
        }

        // ✅ REMOVED: is_active check (column doesn't exist in table)
        // All wallets are considered active

        // 4. Business logic: Check balance
        const newBalance = Number(wallet.balance) - data.amount
        console.log('💰 Balance check:', { current: wallet.balance, amount: data.amount, new: newBalance })

        if (newBalance < 0) {
            console.error('❌ Insufficient balance')
            return { error: `Insufficient balance. Current: ${wallet.balance}, Required: ${data.amount}` }
        }

        // 5. Create transaction
        const { data: savedTx, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id, // ✅ Use authenticated user ID
                amount: data.amount,
                base_amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                type: 'expense',
                receipt_url: data.receiptUrl,
                wallet_id: data.walletId,
                created_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (txError) {
            console.error('Transaction save error:', txError)
            return { error: ErrorMessages.receipt.saveFailed }
        }

        // 6. Update wallet balance
        const { adjustWalletBalance } = await import('./wallet')
        const balanceResult = await adjustWalletBalance(
            data.walletId,
            newBalance,
            `Expense: ${data.merchant || 'Receipt'} (${data.category})`
        )

        if (balanceResult.error) {
            console.error('Wallet balance update error:', balanceResult.error)
            return {
                success: true,
                transaction: savedTx,
                warning: 'Transaction saved but wallet balance update failed'
            }
        }

        // ✅ FIXED: Track upload ONLY after successful save
        // This ensures quota only decreases for completed transactions
        await supabase
            .from('receipt_uploads')
            .insert({
                user_id: user.id,
                file_path: data.receiptUrl,  // ✅ FIXED: Schema uses file_path, not receipt_url
                uploaded_at: new Date().toISOString()
            })

        // ✅ ADD: Send chat message to confirm receipt saved
        const sessionId = crypto.randomUUID()
        const confirmationMessage = `✅ Receipt saved successfully!\n\n💰 **Amount:** ৳${data.amount.toFixed(2)}\n🏪 **Merchant:** ${data.merchant}\n📁 **Category:** ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}\n💳 **Wallet:** ${wallet.name}\n\nYour transaction has been recorded and your wallet balance has been updated to ৳${newBalance.toFixed(2)}.`

        await supabase.from('messages').insert([
            {
                user_id: user.id,
                session_id: sessionId,
                role: 'assistant',
                content: confirmationMessage,
                created_at: new Date().toISOString()
            }
        ])

        invalidateUserCache(user.id)
        revalidatePath('/history')
        revalidatePath('/profile')
        revalidatePath('/chat')  // ✅ Also revalidate chat to show new message

        return { success: true, transaction: savedTx }
    } catch (error: any) {
        console.error('Save receipt transaction error:', error)
        return { error: ErrorMessages.receipt.saveFailed }
    }
}