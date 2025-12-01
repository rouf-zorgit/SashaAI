type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    level: LogLevel
    message: string
    timestamp: string
    data?: any
}

class Logger {
    private log(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
        }

        // In production, only log errors and warnings
        // In development, log everything with colors
        if (process.env.NODE_ENV === 'development') {
            const color = {
                info: '\x1b[36m', // Cyan
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                debug: '\x1b[90m', // Gray
            }[level]

            console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`, data || '')
        } else if (level === 'error' || level === 'warn') {
            // Only log errors and warnings in production (for monitoring services)
            console.error(JSON.stringify(entry))
        }
        // Silently ignore info and debug logs in production
    }

    info(message: string, data?: any) {
        this.log('info', message, data)
    }

    warn(message: string, data?: any) {
        this.log('warn', message, data)
    }

    error(message: string, data?: any) {
        this.log('error', message, data)
    }

    debug(message: string, data?: any) {
        this.log('debug', message, data)
    }
}

export const logger = new Logger()
