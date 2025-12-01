import { createClient } from '@/lib/supabase/server'

export type UserContext = {
    profile: {
        full_name: string | null
        country: string | null
        currency: string | null
        monthly_salary: number | null
        primary_goal: string | null
    }
    wallets: any[]
    recent_transactions: any[]
    loans: any[]
}

// Get user context without caching (Next.js will handle caching via fetch)
export const getUserContext = async (userId: string) => {
    const supabase = await createClient()

    // Call the Postgres function
    const { data, error } = await supabase
        .rpc('get_user_context', { p_user_id: userId })

    if (error) {
        console.error('Error fetching user context:', error)
        return null
    }

    return data as UserContext
}
