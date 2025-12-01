import * as Sentry from 'npm:@sentry/deno'

export const initSentry = () => {
    const dsn = Deno.env.get('SENTRY_DSN')
    if (!dsn) {
        console.warn('⚠️ SENTRY_DSN not set, error tracking disabled')
        return
    }

    Sentry.init({
        dsn,
        // Adds request headers and IP for users
        sendDefaultPii: true,
        // Set environment
        environment: Deno.env.get('ENVIRONMENT') || 'production',
        // Sample rate for performance monitoring
        tracesSampleRate: 0.1,
    })

    console.log('✅ Sentry initialized')
}

export const captureException = (error: Error, context?: Record<string, any>) => {
    const dsn = Deno.env.get('SENTRY_DSN')
    if (!dsn) return

    Sentry.captureException(error, {
        extra: context
    })
}
