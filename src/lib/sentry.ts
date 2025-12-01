import * as Sentry from '@sentry/nextjs'

export const initSentry = () => {
    const dsn = process.env.SENTRY_DSN
    if (!dsn) {
        console.warn('⚠️ SENTRY_DSN not set, error tracking disabled')
        return
    }

    // Sentry is initialized in instrumentation.ts for Next.js
    console.log('✅ Sentry initialized')
}

export const captureException = (error: Error, context?: Record<string, any>) => {
    const dsn = process.env.SENTRY_DSN
    if (!dsn) return

    Sentry.captureException(error, {
        extra: context
    })
}
