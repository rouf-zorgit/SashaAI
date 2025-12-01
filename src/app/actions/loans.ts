'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkLowBalance } from '@/app/actions/notifications'

export type Loan = {
    id: string
    user_id: string
    provider: string
    total_amount: number
    remaining_amount: number
    interest_rate: number
    monthly_payment: number
    start_date: string
    currency: string
    wallet_id?: string | null
    created_at: string
    updated_at: string
}

export type LoanPayment = {
    id: string
    loan_id: string
    user_id: string
    amount: number
    payment_date: string
    wallet_id?: string | null
    created_at: string
}

export async function getLoans() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching loans:', error)
        return []
    }

    return data as Loan[]
}

export async function createLoan(data: {
    provider: string
    total_amount: number
    interest_rate: number
    monthly_payment: number
    start_date: string
    currency: string
    wallet_id?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'User not found' }

    const { error } = await supabase
        .from('loans')
        .insert({
            user_id: user.id,
            provider: data.provider,
            total_amount: data.total_amount,
            remaining_amount: data.total_amount, // Initially, remaining = total
            interest_rate: data.interest_rate,
            monthly_payment: data.monthly_payment,
            start_date: data.start_date,
            currency: data.currency,
            wallet_id: data.wallet_id || null
        })

    if (error) {
        console.error('Error creating loan:', error)
        return { error: 'Failed to create loan' }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function updateLoan(id: string, data: {
    provider?: string
    interest_rate?: number
    monthly_payment?: number
    wallet_id?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'User not found' }

    const { error } = await supabase
        .from('loans')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating loan:', error)
        return { error: 'Failed to update loan' }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function deleteLoan(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'User not found' }

    // Delete associated payments first
    await supabase
        .from('loan_payments')
        .delete()
        .eq('loan_id', id)

    const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting loan:', error)
        return { error: 'Failed to delete loan' }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function recordPayment(data: {
    loan_id: string
    amount: number
    payment_date: string
    wallet_id?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'User not found' }

    // Get current loan
    const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('remaining_amount')
        .eq('id', data.loan_id)
        .eq('user_id', user.id)
        .single()

    if (loanError || !loan) {
        return { error: 'Loan not found' }
    }

    if (data.amount > loan.remaining_amount) {
        return { error: 'Payment amount exceeds remaining balance' }
    }

    // Record payment
    const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
            loan_id: data.loan_id,
            user_id: user.id,
            amount: data.amount,
            payment_date: data.payment_date,
            wallet_id: data.wallet_id || null
        })

    if (paymentError) {
        console.error('Error recording payment:', paymentError)
        return { error: 'Failed to record payment' }
    }

    // Update remaining amount
    const newRemaining = loan.remaining_amount - data.amount
    const { error: updateError } = await supabase
        .from('loans')
        .update({ remaining_amount: newRemaining })
        .eq('id', data.loan_id)

    if (updateError) {
        console.error('Error updating loan balance:', updateError)
        return { error: 'Failed to update loan balance' }
    }

    // Deduct from wallet if selected
    if (data.wallet_id) {
        const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', data.wallet_id)
            .single()

        if (wallet) {
            await supabase
                .from('wallets')
                .update({ balance: wallet.balance - data.amount })
                .eq('id', data.wallet_id)

            await checkLowBalance(data.wallet_id)
        }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function getLoanPayments(loanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })

    if (error) {
        console.error('Error fetching loan payments:', error)
        return []
    }

    return data as LoanPayment[]
}
