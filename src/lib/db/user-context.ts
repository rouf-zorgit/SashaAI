/**
 * User Context Helper
 * Uses batched database function for optimal performance
 * Phase 1, Task 1.6 & 1.9: Batched Context + Caching
 */

import { createClient } from '@/lib/supabase/server'
import { serverCache, CacheKeys } from '@/lib/cache/server-cache'

export interface UserContext {
    profile: {
        id: string
        name: string
        email: string
        monthly_salary: number | null
        currency: string
        savings_goal: number | null
        created_at: string
    }
    wallets: Array<{
        id: string
        name: string
        type: string
        balance: number
        currency: string
        limit_amount: number | null
        is_active: boolean
        is_default: boolean
    }>
    recent_transactions: Array<{
        id: string
        amount: number
        category: string
        description: string | null
        date: string
        type: string
        merchant_name: string | null
        wallet_id: string | null
        created_at: string
    }>
    active_loans: Array<{
        id: string
        provider: string
        total_amount: number
        remaining_amount: number
        interest_rate: number | null
        end_date: string
        is_active: boolean
        created_at: string
    }>
    monthly_spending: Record<string, number>
    wallet_spending: Record<string, number>
    notifications: {
        unread: number
    }
}

/**
 * Get complete user context in a single optimized query
 * Uses caching to prevent repeated database hits
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
    // Check cache first
    const cacheKey = CacheKeys.userContext(userId)
    const cached = serverCache.get<UserContext>(cacheKey)

    if (cached) {
        return cached
    }

    try {
        const supabase = await createClient()

        // Call the batched Postgres function
        const { data, error } = await supabase
            .rpc('get_user_context', { p_user_id: userId })

        if (error) {
            console.error('Error fetching user context:', error)
            return null
        }

        if (!data) {
            return null
        }

        // Cache the result for 30 seconds
        serverCache.set(cacheKey, data, 30000)

        return data as UserContext
    } catch (error) {
        console.error('Exception fetching user context:', error)
        return null
    }
}

/**
 * Get user wallets (cached)
 */
export async function getUserWallets(userId: string) {
    const cacheKey = CacheKeys.userWallets(userId)
    const cached = serverCache.get(cacheKey)

    if (cached) return cached

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at')

    if (error) {
        console.error('Error fetching wallets:', error)
        return []
    }

    serverCache.set(cacheKey, data, 30000)
    return data
}

/**
 * Get user profile (cached)
 */
export async function getUserProfile(userId: string) {
    const cacheKey = CacheKeys.userProfile(userId)
    const cached = serverCache.get(cacheKey)

    if (cached) return cached

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    serverCache.set(cacheKey, data, 30000)
    return data
}

/**
 * Get paginated transactions
 */
export async function getPaginatedTransactions(
    userId: string,
    options: {
        limit?: number
        cursor?: string
        walletId?: string
        dateFrom?: string
        dateTo?: string
    } = {}
) {
    const { limit = 20, cursor, walletId, dateFrom, dateTo } = options

    const supabase = await createClient()
    let query = supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, type, currency)')
        .eq('user_id', userId)
        .is('deleted_at', null)

    // Apply filters
    if (walletId) {
        query = query.eq('wallet_id', walletId)
    }

    if (dateFrom) {
        query = query.gte('date', dateFrom)
    }

    if (dateTo) {
        query = query.lte('date', dateTo)
    }

    // Cursor-based pagination
    if (cursor) {
        query = query.lt('created_at', cursor)
    }

    query = query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit + 1) // Fetch one extra to check if there are more

    const { data, error } = await query

    if (error) {
        console.error('Error fetching transactions:', error)
        return {
            transactions: [],
            nextCursor: null,
            hasMore: false
        }
    }

    const hasMore = data.length > limit
    const transactions = hasMore ? data.slice(0, limit) : data
    const nextCursor = hasMore ? transactions[transactions.length - 1].created_at : null

    return {
        transactions,
        nextCursor,
        hasMore
    }
}
