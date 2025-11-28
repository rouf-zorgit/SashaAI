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

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const fullName = formData.get('fullName') as string
    const currency = formData.get('currency') as string
    const country = formData.get('country') as string
    const monthlySalary = formData.get('monthlySalary') ? Number(formData.get('monthlySalary')) : null
    const primaryGoal = formData.get('primaryGoal') as string

    console.log('Onboarding data:', { fullName, currency, country, monthlySalary, primaryGoal, userId: user.id })

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            currency,
            country,
            monthly_salary: monthlySalary,
            primary_goal: primaryGoal,
            onboarding_completed: true
        })
        .eq('id', user.id)

    if (error) {
        console.error('Failed to update profile:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { error: 'Failed to complete onboarding. Please try again.' }
    }

    console.log('Profile updated successfully')
    revalidatePath('/', 'layout')
    redirect('/chat')
}
