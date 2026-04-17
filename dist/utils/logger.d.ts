/**
 * Project Sentinel - Logging Utility
 *
 * Provides consistent, security-conscious logging across the application.
 * Sanitizes error messages to prevent information disclosure.
 */
/**
 * Log message interface
 */
export interface LogMessage {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    sanitized?: boolean;
}
/**
 * Logger utility class for consistent output
 *
 * Security features:
 * - Sanitizes error messages to prevent info disclosure
 * - Does not log sensitive system paths or credentials
 * - Rate-limits debug output in production
 */
export declare class Logger {
    private debugEnabled;
    private logLevel;
    private rateLimitCounter;
    private lastRateLimitReset;
    /**
     * Create logger instance
     *
     * @param debug Enable debug mode (false by default)
     * @param logLevel Minimum log level (defaults to INFO)
     */
    constructor(debug?: boolean, logLevel?: number);
    /**
     * Set debug mode dynamically
     */
    setDebug(enabled: boolean): void;
    /**
     * Set log level dynamically
     */
    setLogLevel(level: number): void;
    /**
     * Log debug message (only in debug mode)
     * Rate-limited to prevent log spam
     */
    debug(message: string, ...args: unknown[]): void;
    /**
     * Log info message
     * Primary output for normal operations
     */
    info(message: string): void;
    /**
     * Log success message
     * Used for operation completion notifications
     */
    success(message: string): void;
    /**
     * Log warning message
     * Used for non-critical issues and threshold warnings
     */
    warn(message: string): void;
    /**
     * Log error message
     * Writes to stderr with sanitized content
     *
     * SECURITY: Sanitizes error messages to prevent:
     * - Absolute path disclosure
     * - Stack trace exposure (unless debug mode)
     * - Sensitive system information
     */
    error(message: string): void;
    /**
     * Log a structured error object
     * SECURITY: Sanitizes error details before logging
     */
    errorObject(error: Error | unknown): void;
    /**
     * Sanitize message to prevent information disclosure
     * SECURITY: Removes or masks sensitive information
     */
    private sanitizeMessage;
    /**
     * Rate limit debug messages to prevent log spam
     */
    private rateLimitCheck;
    /**
     * Print a separator line
     */
    separator(char?: string, length?: number): void;
    /**
     * Print a formatted header
     */
    header(title: string): void;
    /**
     * Print a progress update
     */
    progress(current: number, total: number, message: string): void;
    /**
     * Clear terminal screen
     */
    clear(): void;
}
/**
 * Default logger instance (non-debug mode)
 */
export declare const logger: Logger;
/**
 * Debug logger instance
 */
export declare const debugLogger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map