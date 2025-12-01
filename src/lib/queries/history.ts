import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'

export async function getTransactionsWithFilters(
    userId: string,
    filters: {
        type?: 'income' | 'expense'
        category?: string
        search?: string
        startDate?: string
        endDate?: string
        limit?: number
        offset?: number
        walletId?: string
    }
) {
    const supabase = createClient()

    let query = supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, type, currency)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (filters.type) {
        query = query.eq('type', filters.type)
    }

    if (filters.category) {
        query = query.eq('category', filters.category)
    }

    if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
    }

    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
    }

    if (filters.walletId) {
        query = query.eq('wallet_id', filters.walletId)
    }

    if (filters.limit) {
        query = query.limit(filters.limit)
    }

    if (filters.offset) {
        query = query.range(
            filters.offset,
            filters.offset + (filters.limit || 50) - 1
        )
    }

    const { data, error } = await query

    if (error) {
        console.error('Transaction query error:', error)
        throw error
    }

    const result = data?.map((t: any) => ({
        ...t,
        date: t.date || t.created_at
    })) || []

    return result
}

export async function getNotifications(userId: string, onlyUnread = false): Promise<Notification[]> {
    const supabase = createClient()

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (onlyUnread) {
        query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
}

export async function markNotificationRead(notificationId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) throw error
}

export async function markAllNotificationsRead(userId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

    if (error) throw error
}
