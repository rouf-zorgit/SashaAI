'use server'

import { createClient } from '@/lib/supabase/server'

export type FundingSource = 'income' | 'gift' | 'loan' | 'transfer' | 'manual'

export interface InsufficientFundsError {
    code: 'insufficient_funds'
    wallet: {
        id: string
        name: string
        balance: number
        type: string
    }
    transaction: {
        amount: number
        description: string
    }
    shortfall: number
}

/**
 * Check if wallet has sufficient balance for a transaction
 * Returns null if sufficient, or InsufficientFundsError if not
 */
export async function checkWalletBalance(
    walletId: string,
    amount: number,
    description: string
): Promise<InsufficientFundsError | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Get wallet details
    const { data: wallet, error } = await supabase
        .from('wallets')
        .select('id, name, balance, type')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .single()

    if (error || !wallet) {
        throw new Error('Wallet not found')
    }

    // Check if this wallet type can go negative
    const canBeNegative = wallet.type === 'credit' || wallet.type === 'loan'

    // If wallet can be negative (credit card), allow it
    if (canBeNegative) {
        return null
    }

    // Check if balance is sufficient
    const newBalance = Number(wallet.balance) - amount

    if (newBalance < 0) {
        return {
            code: 'insufficient_funds',
            wallet: {
                id: wallet.id,
                name: wallet.name,
                balance: Number(wallet.balance),
                type: wallet.type
            },
            transaction: {
                amount,
                description
            },
            shortfall: Math.abs(newBalance)
        }
    }

    return null
}

/**
 * Handle funding source selection and create necessary transactions
 */
export async function handleFundingSource(
    source: FundingSource,
    walletId: string,
    amount: number,
    description: string,
    metadata?: {
        sourceWalletId?: string  // For transfers
        loanDetails?: {
            lender: string
            interestRate?: number
            dueDate?: string
        }
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const timestamp = new Date().toISOString()

    switch (source) {
        case 'income':
        case 'gift': {
            // Create income transaction
            const incomeType = source === 'gift' ? 'Gift/Bonus' : 'Income'

            const { data: incomeTx, error: incomeError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    wallet_id: walletId,
                    amount: amount,
                    base_amount: amount,
                    category: 'income',
                    type: 'income',
                    description: `${incomeType} - ${description}`,
                    date: timestamp,
                    created_at: timestamp
                })
                .select()
                .single()

            if (incomeError) {
                console.error('Income transaction error:', incomeError)
                throw new Error('Failed to create income transaction')
            }

            // Update wallet balance
            const { error: balanceError } = await supabase.rpc('adjust_wallet_balance', {
                wallet_uuid: walletId,
                amount_change: amount
            })

            if (balanceError) {
                console.error('Balance update error:', balanceError)
            }

            return { success: true, transaction: incomeTx }
        }

        case 'loan': {
            // Create loan record
            const { data: loan, error: loanError } = await supabase
                .from('loans')
                .insert({
                    user_id: user.id,
                    wallet_id: walletId,
                    lender_name: metadata?.loanDetails?.lender || 'Friend/Family',
                    principal_amount: amount,
                    remaining_amount: amount,
                    interest_rate: metadata?.loanDetails?.interestRate || 0,
                    due_date: metadata?.loanDetails?.dueDate || null,
                    status: 'active',
                    created_at: timestamp
                })
                .select()
                .single()

            if (loanError) {
                console.error('Loan creation error:', loanError)
                throw new Error('Failed to create loan record')
            }

            // Create income transaction for loan received
            const { data: loanTx, error: loanTxError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    wallet_id: walletId,
                    amount: amount,
                    base_amount: amount,
                    category: 'loan',
                    type: 'income',
                    description: `Loan from ${metadata?.loanDetails?.lender || 'Friend/Family'} - ${description}`,
                    date: timestamp,
                    created_at: timestamp
                })
                .select()
                .single()

            if (loanTxError) {
                console.error('Loan transaction error:', loanTxError)
                throw new Error('Failed to create loan transaction')
            }

            // Update wallet balance
            await supabase.rpc('adjust_wallet_balance', {
                wallet_uuid: walletId,
                amount_change: amount
            })

            return { success: true, transaction: loanTx, loan }
        }

        case 'transfer': {
            if (!metadata?.sourceWalletId) {
                throw new Error('Source wallet required for transfer')
            }

            // Check source wallet has funds
            const { data: sourceWallet, error: sourceError } = await supabase
                .from('wallets')
                .select('balance, name')
                .eq('id', metadata.sourceWalletId)
                .eq('user_id', user.id)
                .single()

            if (sourceError || !sourceWallet) {
                throw new Error('Source wallet not found')
            }

            if (Number(sourceWallet.balance) < amount) {
                throw new Error(`Insufficient balance in ${sourceWallet.name}`)
            }

            // Create transfer record
            const { data: transfer, error: transferError } = await supabase
                .from('wallet_transfers')
                .insert({
                    user_id: user.id,
                    from_wallet_id: metadata.sourceWalletId,
                    to_wallet_id: walletId,
                    amount: amount,
                    description: `Transfer for: ${description}`,
                    created_at: timestamp
                })
                .select()
                .single()

            if (transferError) {
                console.error('Transfer error:', transferError)
                throw new Error('Failed to create transfer')
            }

            // Update both wallet balances
            await supabase.rpc('adjust_wallet_balance', {
                wallet_uuid: metadata.sourceWalletId,
                amount_change: -amount
            })

            await supabase.rpc('adjust_wallet_balance', {
                wallet_uuid: walletId,
                amount_change: amount
            })

            return { success: true, transfer }
        }

        case 'manual': {
            // User will handle it manually - just allow the transaction
            return { success: true, manual: true }
        }

        default:
            throw new Error('Invalid funding source')
    }
}