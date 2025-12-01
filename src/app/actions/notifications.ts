'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            data,
            is_read: false
        })

    if (error) {
        console.error('Error creating notification:', error)
    }
}

export async function markNotificationRead(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    revalidatePath('/history') // Notifications are shown here currently
}

export async function markAllNotificationsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    revalidatePath('/history')
}

export async function checkLowBalance(walletId: string) {
    const supabase = await createClient()

    // Get wallet
    const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single()

    if (!wallet) return

    // Threshold: 10% of limit, or 1000 if no limit
    const limit = wallet.monthly_limit || 10000
    const threshold = limit * 0.1

    if (wallet.balance < threshold) {
        // Check if we already notified recently (to avoid spam) - simplified for MVP
        // In a real app, we'd check the last notification time for this wallet/type

        await createNotification(
            wallet.user_id,
            'warning',
            'Low Balance Warning',
            `Your ${wallet.name} balance is low (${wallet.currency} ${wallet.balance}).`,
            { walletId: wallet.id }
        )
    }
}
