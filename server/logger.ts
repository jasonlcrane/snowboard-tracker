/**
 * Simple structured logger utility
 * Replaces console.log with structured output including timestamps and levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
    }

    info(message: string, meta?: any) {
        console.log(this.formatMessage('info', message, meta));
    }

    warn(message: string, meta?: any) {
        console.warn(this.formatMessage('warn', message, meta));
    }

    error(message: string, meta?: any) {
        console.error(this.formatMessage('error', message, meta));
    }

    debug(message: string, meta?: any) {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
}

export const logger = new Logger();
