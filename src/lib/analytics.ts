import { logger } from './logger'
import { SupabaseClient } from '@supabase/supabase-js'

export interface UsageMetric {
    function_name: string
    user_id?: string
    tokens_used?: number
    execution_time_ms?: number
    status?: 'success' | 'error'
    error_message?: string
    metadata?: any
}

export const logUsage = async (metric: UsageMetric, supabaseClient: SupabaseClient) => {
    try {
        const { error } = await supabaseClient
            .from('usage_metrics')
            .insert(metric)

        if (error) {
            logger.error('Failed to log usage metric', error)
        }
    } catch (err) {
        logger.error('Error logging usage metric', err)
    }
}
