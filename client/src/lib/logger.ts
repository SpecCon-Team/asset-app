/**
 * Centralized logging utility
 * Only logs in development environment to avoid exposing internals in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  debug(...args: any[]): void {
    if (isDevelopment) {
      console.log(this.prefix, ...args);
    }
  }

  info(...args: any[]): void {
    if (isDevelopment) {
      console.info(this.prefix, ...args);
    }
  }

  warn(...args: any[]): void {
    console.warn(this.prefix, ...args);
  }

  error(...args: any[]): void {
    console.error(this.prefix, ...args);
    // In production, you would send errors to a monitoring service
    // this.sendToMonitoring('error', args);
  }

  /**
   * Always logs, even in production (for critical issues)
   */
  critical(...args: any[]): void {
    console.error('[CRITICAL]', this.prefix, ...args);
    // Send to monitoring service in production
    // this.sendToMonitoring('critical', args);
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(childPrefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${childPrefix}` : childPrefix;
    return new Logger(newPrefix);
  }

  /**
   * Placeholder for sending logs to monitoring service
   * Implement with services like Sentry, LogRocket, etc.
   */
  private sendToMonitoring(level: LogLevel, data: any[]): void {
    // TODO: Implement monitoring service integration
    // Example:
    // if (import.meta.env.PROD) {
    //   Sentry.captureMessage(JSON.stringify(data), level);
    // }
  }
}

// Create default logger instance
export const logger = new Logger();

// Export named loggers for specific features
export const authLogger = new Logger('Auth');
export const apiLogger = new Logger('API');
export const workflowLogger = new Logger('Workflow');
export const ticketLogger = new Logger('Ticket');
export const assetLogger = new Logger('Asset');

export default logger;
