'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const file = formData.get('avatar') as File

    if (!file) {
        return { error: 'No file provided' }
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        return { error: 'Image must be less than 2MB' }
    }

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `avatar-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Delete old avatar if exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()

        if (profile?.avatar_url) {
            const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
            await supabase.storage.from('avatars').remove([oldPath])
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { error: `Upload failed: ${uploadError.message}` }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return { error: `Profile update failed: ${updateError.message}` }
        }

        revalidatePath('/profile')
        return { success: true, url: publicUrl }

    } catch (error: any) {
        console.error('Avatar upload error:', error)
        return { error: error.message || 'Upload failed' }
    }
}
