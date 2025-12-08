type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    level: LogLevel
    message: string
    context?: Record<string, unknown>
    timestamp: string
}

class Logger {
    private static instance: Logger

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
        }
    }

    private print(entry: LogEntry) {
        const { level, message, context, timestamp } = entry
        const style = {
            info: 'color: #3b82f6',
            warn: 'color: #eab308',
            error: 'color: #ef4444',
            debug: 'color: #8b5cf6',
        }[level]

        if (process.env.NODE_ENV === 'development' || level === 'error') {
            console[level](`%c[${timestamp}] [${level.toUpperCase()}] ${message}`, style, context || '')
        }

        // In production, we could send this to a service like Sentry
        if (level === 'error' && process.env.NODE_ENV === 'production') {
            // Placeholder for Sentry/LogRocket integration
        }
    }

    public info(message: string, context?: Record<string, unknown>) {
        this.print(this.formatMessage('info', message, context))
    }

    public warn(message: string, context?: Record<string, unknown>) {
        this.print(this.formatMessage('warn', message, context))
    }

    public error(message: string, context?: Record<string, unknown>) {
        this.print(this.formatMessage('error', message, context))
    }

    public debug(message: string, context?: Record<string, unknown>) {
        this.print(this.formatMessage('debug', message, context))
    }
}

export const logger = Logger.getInstance()

export const logError = (error: unknown, context?: string) => {
    logger.error(context ? `${context}:` : 'An error occurred:', { error })
}
