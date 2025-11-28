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

    return {
        success: tracker.count <= config.limit,
        limit: config.limit,
        remaining: Math.max(0, config.limit - tracker.count),
        reset: tracker.expiresAt,
    }
}
