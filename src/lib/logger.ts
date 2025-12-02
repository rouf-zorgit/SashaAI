const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    info: (message: string, data?: any) => {
        if (isDev) {
            console.log(JSON.stringify({ level: 'info', message, data, timestamp: new Date().toISOString() }))
        }
    },
    warn: (message: string, data?: any) => {
        if (isDev) {
            console.warn(JSON.stringify({ level: 'warn', message, data, timestamp: new Date().toISOString() }))
        }
    },
    error: (message: string, error?: any) => {
        // Always log errors, even in production
        console.error(JSON.stringify({
            level: 'error',
            message,
            error: error?.message || error,
            stack: error?.stack,
            timestamp: new Date().toISOString()
        }))
    },
    time: (label: string) => {
        console.time(label)
    },
    timeEnd: (label: string) => {
        console.timeEnd(label)
    }
}
