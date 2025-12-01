/**
 * Server-Side Cache Utility
 * Implements in-memory caching with TTL for database queries
 * Phase 1, Task 1.9: Server-Side Caching
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

class ServerCache {
    private cache: Map<string, CacheEntry<any>> = new Map()
    private readonly DEFAULT_TTL = 30000 // 30 seconds

    /**
     * Get cached data if exists and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) return null

        const now = Date.now()
        const isExpired = now - entry.timestamp > entry.ttl

        if (isExpired) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    /**
     * Set cache entry with optional TTL
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.DEFAULT_TTL
        })
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key)
    }

    /**
     * Invalidate all cache keys matching pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern)
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key)
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }

    /**
     * Clean up expired entries (run periodically)
     */
    cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key)
            }
        }
    }
}

// Singleton instance
export const serverCache = new ServerCache()

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        serverCache.cleanup()
    }, 5 * 60 * 1000)
}

/**
 * Cache key generators
 */
export const CacheKeys = {
    userContext: (userId: string) => `user:context:${userId}`,
    userWallets: (userId: string) => `user:wallets:${userId}`,
    userProfile: (userId: string) => `user:profile:${userId}`,
    userTransactions: (userId: string, page: number = 1) => `user:transactions:${userId}:${page}`,
    walletTransactions: (walletId: string, page: number = 1) => `wallet:transactions:${walletId}:${page}`,
}

/**
 * Cache invalidation helpers
 */
export const invalidateUserCache = (userId: string) => {
    serverCache.invalidatePattern(`user:.*:${userId}`)
}

export const invalidateWalletCache = (walletId: string) => {
    serverCache.invalidatePattern(`wallet:.*:${walletId}`)
}
