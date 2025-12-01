'use server'
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const currency = formData.get('currency') as string
    const monthly_salary = formData.get('monthly_salary') as string
    const new_password = formData.get('new_password') as string
    const confirm_password = formData.get('confirm_password') as string

    // Validate passwords if provided
    if (new_password || confirm_password) {
        if (new_password !== confirm_password) {
            return { error: 'Passwords do not match' }
        }
        if (new_password.length < 6) {
            return { error: 'Password must be at least 6 characters' }
        }
    }

    // Update profile data
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: full_name.trim(),
            currency,
            monthly_salary: monthly_salary ? parseFloat(monthly_salary) : null,
        })
        .eq('id', user.id)

    if (profileError) {
        console.error('Profile update error:', profileError)
        return { error: profileError.message }
    }

    // Update email if changed
    if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
            email: email,
        })
        if (emailError) {
            console.error('Email update error:', emailError)
            return { error: `Email update failed: ${emailError.message}` }
        }
    }

    // Update password if provided
    if (new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
            password: new_password,
        })
        if (passwordError) {
            console.error('Password update error:', passwordError)
            return { error: `Password update failed: ${passwordError.message}` }
        }
    }

    revalidatePath('/profile')

    // Return appropriate success message
    if (email !== user.email) {
        return { success: true, message: 'Profile updated! Please check your email to confirm the new address.' }
    }

    return { success: true, message: 'Profile updated successfully!' }
}
