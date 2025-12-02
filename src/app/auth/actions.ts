'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createProfileIfNotExists, updateProfile } from '@/lib/db/profiles'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if profile is complete
    if (data.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, currency')
            .eq('id', data.user.id)
            .single()

        // If profile is incomplete, redirect to onboarding
        if (!profile || !profile.full_name || !profile.currency) {
            revalidatePath('/', 'layout')
            redirect('/onboarding')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/chat')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Create profile immediately if user is created
    if (data.user) {
        try {
            await createProfileIfNotExists(supabase, data.user.id, email, fullName)
        } catch (profileError: any) {
            console.error('Profile creation error:', profileError)
            // Continue even if profile creation fails (trigger might handle it)
        }

        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verify profile was created
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile verification failed:', profileError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function completeOnboarding(data: {
    full_name: string
    country: string
    monthly_salary: number
    current_balance?: number
    savings_amount?: number
    total_loans?: number
    currency: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Onboarding error: User not found')
        return { error: 'User not found' }
    }

    console.log('Received onboarding data:', JSON.stringify(data, null, 2))
    console.log('Updating profile for user:', user.id)

    // Update profile
    const { error: profileError, data: profileData } = await supabase
        .from('profiles')
        .update({
            full_name: data.full_name,
            country: data.country,
            monthly_salary: data.monthly_salary,
            savings_amount: data.savings_amount || 0,
            total_loans: data.total_loans || 0,
            currency: data.currency,
            onboarding_completed: true
        })
        .eq('id', user.id)
        .select()

    if (profileError) {
        console.error('Failed to update profile:', profileError)
        return { error: 'Failed to save profile data: ' + profileError.message }
    }
    console.log('Profile updated successfully:', profileData)

    // Always create default wallet for new users
    console.log('Creating default wallet with balance:', data.current_balance || 0)
    const { error: walletError, data: walletData } = await supabase
        .from('wallets')
        .insert({
            user_id: user.id,
            name: 'Cash in Hand',
            type: 'cash', // Default type, user can change later
            balance: data.current_balance || 0,
            currency: data.currency,
            is_default: true
        })
        .select()

    if (walletError) {
        console.error('Failed to create default wallet:', walletError)
        // Don't fail onboarding if wallet creation fails, just log it
    } else {
        console.log('Default wallet created:', walletData)
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
