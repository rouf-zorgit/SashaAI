interface RateLimitConfig {
    interval: number // Window size in milliseconds
    limit: number // Max requests per window
}

const trackers = new Map<string, { count: number; expiresAt: number }>()

export function rateLimit(identifier: string, config: RateLimitConfig = { interval: 60000, limit: 10 }) {
    const now = Date.now()
    const tracker = trackers.get(identifier) || { count: 0, expiresAt: now + config.interval }

    if (now > tracker.expiresAt) {
        tracker.count = 0
        tracker.expiresAt = now + config.interval
    }

    tracker.count++
    trackers.set(identifier, tracker)

    const resetIn = Math.ceil((tracker.expiresAt - now) / 1000) // seconds

    return {
        success: tracker.count <= config.limit,
        limit: config.limit,
        remaining: Math.max(0, config.limit - tracker.count),
        reset: tracker.expiresAt,
        resetIn, // seconds until reset
    }
}

// Predefined rate limit configurations
export const RateLimits = {
    chat: { interval: 60 * 1000, limit: 10 }, // 10 per minute
    chatHourly: { interval: 60 * 60 * 1000, limit: 100 }, // 100 per hour
    receipt: { interval: 24 * 60 * 60 * 1000, limit: 20 }, // 20 per day
    transaction: { interval: 60 * 60 * 1000, limit: 100 }, // 100 per hour
    api: { interval: 15 * 60 * 1000, limit: 100 }, // 100 per 15 minutes
}

// Helper to get user-friendly error message
export function getRateLimitError(type: keyof typeof RateLimits, resetIn: number): string {
    const messages = {
        chat: `Too many messages. Please wait ${resetIn} seconds. (Limit: 10 per minute)`,
        chatHourly: `Hourly message limit reached. Please wait ${Math.ceil(resetIn / 60)} minutes. (Limit: 100 per hour)`,
        receipt: `Daily upload limit reached (20). Resets in ${Math.ceil(resetIn / 3600)} hours.`,
        transaction: `Too many transactions. Please wait ${Math.ceil(resetIn / 60)} minutes. (Limit: 100 per hour)`,
        api: `Too many requests. Please wait ${Math.ceil(resetIn / 60)} minutes. (Limit: 100 per 15 minutes)`,
    }
    return messages[type] || `Rate limit exceeded. Please wait ${resetIn} seconds.`
}

// Get remaining quota for display
export function getRemainingQuota(identifier: string, config: RateLimitConfig): { remaining: number; limit: number } {
    const now = Date.now()
    const tracker = trackers.get(identifier)

    if (!tracker || now > tracker.expiresAt) {
        return { remaining: config.limit, limit: config.limit }
    }

    return {
        remaining: Math.max(0, config.limit - tracker.count),
        limit: config.limit
    }
}
