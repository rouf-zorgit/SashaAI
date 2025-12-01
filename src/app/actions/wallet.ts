'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkLowBalance } from '@/app/actions/notifications'
import { invalidateUserCache } from '@/lib/cache/server-cache'
import {
    createWalletSchema,
    updateWalletSchema,
    deleteWalletSchema,
    transferFundsSchema,
    validateSchema,
    uuidSchema,
    nonNegativeNumberSchema
} from '@/lib/validation'

export type Wallet = {
    id: string
    user_id: string
    name: string
    type: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'other'
    balance: number
    currency: string
    is_default: boolean
    is_locked: boolean
    monthly_limit?: number
    created_at: string
    updated_at: string
}

export async function getWallets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching wallets:', error)
        return []
    }

    return data as Wallet[]
}

export async function createWallet(input: unknown) {
    try {
        // 1. Validate input
        const validation = validateSchema(createWalletSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }
        const data = validation.data

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // 3. If setting as default, unset other defaults first
        if (data.is_default) {
            await supabase
                .from('wallets')
                .update({ is_default: false })
                .eq('user_id', user.id)
        }

        // 4. Create wallet
        const { error } = await supabase
            .from('wallets')
            .insert({
                user_id: user.id, // ✅ Use authenticated user ID
                name: data.name,
                type: data.type,
                balance: data.balance,
                currency: data.currency,
                is_default: data.is_default || false,
            })

        if (error) {
            console.error('Error creating wallet:', error)
            return { error: 'Failed to create wallet' }
        }

        revalidatePath('/profile')
        invalidateUserCache(user.id)
        return { success: true }

    } catch (error: any) {
        console.error('Create wallet error:', error)
        return { error: 'Failed to create wallet' }
    }
}

export async function updateWallet(id: string, input: unknown) {
    try {
        // 1. Validate input
        const validation = validateSchema(updateWalletSchema, { id, ...input as any })
        if (!validation.success) {
            return { error: validation.error }
        }
        const data = validation.data

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // 3. Verify wallet ownership
        const { data: existingWallet, error: fetchError } = await supabase
            .from('wallets')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id) // ✅ Verify ownership
            .single()

        if (fetchError || !existingWallet) {
            return { error: 'Wallet not found or access denied' }
        }

        // 4. Update wallet
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.type !== undefined) updateData.type = data.type
        if (data.balance !== undefined) updateData.balance = data.balance
        if (data.is_locked !== undefined) updateData.is_locked = data.is_locked

        const { error } = await supabase
            .from('wallets')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id) // ✅ Double-check ownership

        if (error) {
            console.error('Error updating wallet:', error)
            return { error: 'Failed to update wallet' }
        }

        revalidatePath('/profile')
        invalidateUserCache(user.id)
        return { success: true }

    } catch (error: any) {
        console.error('Update wallet error:', error)
        return { error: 'Failed to update wallet' }
    }
}

export async function deleteWallet(id: string) {
    try {
        // 1. Validate input
        const validation = validateSchema(deleteWalletSchema, { id })
        if (!validation.success) {
            return { error: validation.error }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // 3. Check if it's the last wallet
        const { count } = await supabase
            .from('wallets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (count !== null && count <= 1) {
            return { error: 'Cannot delete the last wallet' }
        }

        // 4. Check for active loans (business logic)
        const { data: loans } = await supabase
            .from('loans')
            .select('id')
            .eq('wallet_id', id)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)

        if (loans && loans.length > 0) {
            return { error: 'Cannot delete wallet with active loans' }
        }

        // 5. Delete wallet with ownership verification
        const { error } = await supabase
            .from('wallets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id) // ✅ Verify ownership

        if (error) {
            console.error('Error deleting wallet:', error)
            return { error: 'Failed to delete wallet. It may have associated transactions.' }
        }

        revalidatePath('/profile')
        invalidateUserCache(user.id)
        return { success: true }

    } catch (error: any) {
        console.error('Delete wallet error:', error)
        return { error: 'Failed to delete wallet' }
    }
}

export async function adjustWalletBalance(id: string, newBalance: number, reason: string) {
    try {
        // 1. Validate inputs
        const idValidation = validateSchema(uuidSchema, id)
        if (!idValidation.success) {
            return { error: 'Invalid wallet ID format' }
        }

        const balanceValidation = validateSchema(nonNegativeNumberSchema, newBalance)
        if (!balanceValidation.success) {
            return { error: 'Balance cannot be negative' }
        }

        if (!reason || reason.length > 500) {
            return { error: 'Reason must be between 1 and 500 characters' }
        }

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // 3. Get current balance with ownership verification
        const { data: wallet, error: fetchError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', id)
            .eq('user_id', user.id) // ✅ Verify ownership
            .single()

        if (fetchError || !wallet) {
            return { error: 'Wallet not found or access denied' }
        }

        const oldBalance = wallet.balance

        // 4. Update wallet balance
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', id)
            .eq('user_id', user.id) // ✅ Double-check ownership

        if (updateError) {
            console.error('Error updating wallet balance:', updateError)
            return { error: 'Failed to update balance' }
        }

        // 5. Record adjustment
        const { error: logError } = await supabase
            .from('wallet_adjustments')
            .insert({
                user_id: user.id,
                wallet_id: id,
                old_balance: oldBalance,
                new_balance: newBalance,
                reason: reason
            })

        if (logError) {
            console.error('Error logging adjustment:', logError)
        }

        revalidatePath('/profile')
        invalidateUserCache(user.id)
        return { success: true }

    } catch (error: any) {
        console.error('Adjust wallet balance error:', error)
        return { error: 'Failed to adjust balance' }
    }
}

export async function transferFunds(input: unknown) {
    try {
        // 1. Validate input
        const validation = validateSchema(transferFundsSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }
        const data = validation.data

        // 2. Authenticate
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // 3. Get source wallet with ownership verification
        const { data: sourceWallet, error: sourceError } = await supabase
            .from('wallets')
            .select('balance, name, currency, is_locked')
            .eq('id', data.from_wallet_id)
            .eq('user_id', user.id) // ✅ Verify ownership
            .single()

        if (sourceError || !sourceWallet) {
            return { error: 'Source wallet not found or access denied' }
        }

        if (sourceWallet.is_locked) {
            return { error: 'Source wallet is locked' }
        }

        // 4. Business logic: Check balance
        if (sourceWallet.balance < data.amount) {
            return { error: `Insufficient funds in ${sourceWallet.name}. Available: ${sourceWallet.balance}` }
        }

        // 5. Get destination wallet with ownership verification
        const { data: destWallet, error: destError } = await supabase
            .from('wallets')
            .select('name, currency, is_locked')
            .eq('id', data.to_wallet_id)
            .eq('user_id', user.id) // ✅ Verify ownership
            .single()

        if (destError || !destWallet) {
            return { error: 'Destination wallet not found or access denied' }
        }

        if (destWallet.is_locked) {
            return { error: 'Destination wallet is locked' }
        }

        // 6. Perform transfer
        const newSourceBalance = sourceWallet.balance - data.amount

        // Update source wallet
        const { error: sourceUpdateError } = await supabase
            .from('wallets')
            .update({ balance: newSourceBalance })
            .eq('id', data.from_wallet_id)
            .eq('user_id', user.id)

        if (sourceUpdateError) {
            console.error('Error updating source wallet:', sourceUpdateError)
            return { error: 'Failed to update source wallet' }
        }

        // Update destination wallet
        const { error: destUpdateError } = await supabase
            .from('wallets')
            .update({ balance: supabase.rpc('increment', { x: data.amount }) })
            .eq('id', data.to_wallet_id)
            .eq('user_id', user.id)

        if (destUpdateError) {
            console.error('Error updating destination wallet:', destUpdateError)
            // Rollback source wallet
            await supabase
                .from('wallets')
                .update({ balance: sourceWallet.balance })
                .eq('id', data.from_wallet_id)
                .eq('user_id', user.id)
            return { error: 'Failed to update destination wallet' }
        }

        // 7. Record transfer
        const { error: transferError } = await supabase
            .from('wallet_transfers')
            .insert({
                user_id: user.id,
                from_wallet_id: data.from_wallet_id,
                to_wallet_id: data.to_wallet_id,
                amount: data.amount,
                description: data.description || `Transfer from ${sourceWallet.name} to ${destWallet.name}`,
            })

        if (transferError) {
            console.error('Error recording transfer:', transferError)
        }

        // 8. Check for low balance
        await checkLowBalance(data.from_wallet_id)

        revalidatePath('/profile')
        invalidateUserCache(user.id)
        return { success: true }

    } catch (error: any) {
        console.error('Transfer funds error:', error)
        return { error: 'Failed to transfer funds' }
    }
}
