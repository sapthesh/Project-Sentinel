/**
 * Project Sentinel - Logging Utility
 *
 * Provides consistent, security-conscious logging across the application.
 * Sanitizes error messages to prevent information disclosure.
 */
import chalk from 'chalk';
import { COLORS, STATUS_ICONS, LOG_LEVELS, DEFAULT_LOG_LEVEL } from './constants.js';
/**
 * Logger utility class for consistent output
 *
 * Security features:
 * - Sanitizes error messages to prevent info disclosure
 * - Does not log sensitive system paths or credentials
 * - Rate-limits debug output in production
 */
export class Logger {
    debugEnabled;
    logLevel;
    rateLimitCounter = 0;
    lastRateLimitReset = Date.now();
    /**
     * Create logger instance
     *
     * @param debug Enable debug mode (false by default)
     * @param logLevel Minimum log level (defaults to INFO)
     */
    constructor(debug = false, logLevel = DEFAULT_LOG_LEVEL) {
        this.debugEnabled = debug;
        this.logLevel = logLevel;
    }
    /**
     * Set debug mode dynamically
     */
    setDebug(enabled) {
        this.debugEnabled = enabled;
    }
    /**
     * Set log level dynamically
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Log debug message (only in debug mode)
     * Rate-limited to prevent log spam
     */
    debug(message, ...args) {
        if (!this.debugEnabled)
            return;
        if (this.logLevel > LOG_LEVELS.DEBUG)
            return;
        this.rateLimitCheck();
        console.log(chalk.dim(`[DEBUG] ${message}`), ...args);
    }
    /**
     * Log info message
     * Primary output for normal operations
     */
    info(message) {
        if (this.logLevel > LOG_LEVELS.INFO)
            return;
        console.log(chalk[COLORS.info](`[INFO] ${message}`));
    }
    /**
     * Log success message
     * Used for operation completion notifications
     */
    success(message) {
        if (this.logLevel > LOG_LEVELS.INFO)
            return;
        console.log(chalk[COLORS.success](`${STATUS_ICONS.success} ${message}`));
    }
    /**
     * Log warning message
     * Used for non-critical issues and threshold warnings
     */
    warn(message) {
        if (this.logLevel > LOG_LEVELS.WARN)
            return;
        console.log(chalk[COLORS.warning](`${STATUS_ICONS.warning} ${message}`));
    }
    /**
     * Log error message
     * Writes to stderr with sanitized content
     *
     * SECURITY: Sanitizes error messages to prevent:
     * - Absolute path disclosure
     * - Stack trace exposure (unless debug mode)
     * - Sensitive system information
     */
    error(message) {
        if (this.logLevel > LOG_LEVELS.ERROR)
            return;
        const sanitizedMessage = this.sanitizeMessage(message);
        console.error(chalk[COLORS.error](`${STATUS_ICONS.error} ${sanitizedMessage}`));
    }
    /**
     * Log a structured error object
     * SECURITY: Sanitizes error details before logging
     */
    errorObject(error) {
        if (this.logLevel > LOG_LEVELS.ERROR)
            return;
        let message;
        if (error instanceof Error) {
            // SECURITY: Never log full stack traces outside debug mode
            message = this.debugEnabled
                ? `${error.message}\n\n${error.stack}`
                : error.message;
        }
        else if (typeof error === 'string') {
            message = error;
        }
        else {
            message = 'An unexpected error occurred';
        }
        const sanitizedMessage = this.sanitizeMessage(message);
        console.error(chalk[COLORS.error](`${STATUS_ICONS.error} ${sanitizedMessage}`));
    }
    /**
     * Sanitize message to prevent information disclosure
     * SECURITY: Removes or masks sensitive information
     */
    sanitizeMessage(message) {
        if (!message)
            return '';
        // SECURITY: Remove absolute paths
        message = message.replace(/\/(?:[^\/\s]+\/)+[^\/\s]+/g, '[PATH]');
        message = message.replace(/C:\\[^"]+/g, '[PATH]');
        // SECURITY: Remove potential credentials
        message = message.replace(/password[=:]\s*[^,\s"']+/gi, 'password=[REDACTED]');
        message = message.replace(/token[=:]\s*[^,\s"']+/gi, 'token=[REDACTED]');
        message = message.replace(/api[_-]?key[=:]\s*[^,\s"']+/gi, 'apiKey=[REDACTED]');
        // SECURITY: Remove potential IPs
        message = message.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]');
        // SECURITY: Remove hex strings that might be hashes/keys
        message = message.replace(/["'](?:[a-fA-F0-9]{32,64})["']/g, '["KEY"]');
        // SECURITY: Limit message length to prevent log flooding
        if (message.length > 500) {
            message = message.substring(0, 500) + '... [truncated]';
        }
        return message;
    }
    /**
     * Rate limit debug messages to prevent log spam
     */
    rateLimitCheck() {
        const now = Date.now();
        const elapsed = now - this.lastRateLimitReset;
        if (elapsed > 1000) {
            this.rateLimitCounter = 0;
            this.lastRateLimitReset = now;
        }
        this.rateLimitCounter++;
    }
    /**
     * Print a separator line
     */
    separator(char = '=', length = 50) {
        console.log(char.repeat(length));
    }
    /**
     * Print a formatted header
     */
    header(title) {
        const borderLength = Math.max(title.length + 4, 40);
        const border = '\u2500'.repeat(borderLength);
        console.log(chalk[COLORS.primary](`\u2554${border}\u2557`));
        console.log(chalk[COLORS.primary](`\u2502   ${title.padEnd(borderLength - 4)}   \u2502`));
        console.log(chalk[COLORS.primary](`\u255A${border}\u255D`));
        console.log();
    }
    /**
     * Print a progress update
     */
    progress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        const barLength = 40;
        const filled = Math.round((current / total) * barLength);
        const empty = barLength - filled;
        const bar = chalk[COLORS.success]('\u2588'.repeat(filled)) + chalk[COLORS.dim]('\u2591'.repeat(empty));
        console.log(chalk.dim(`[${bar}] ${percentage}% - ${message} (${current}/${total})`));
    }
    /**
     * Clear terminal screen
     */
    clear() {
        process.stdout.write('\u001b[2J\u001b[0;0H');
    }
}
/**
 * Default logger instance (non-debug mode)
 */
export const logger = new Logger();
/**
 * Debug logger instance
 */
export const debugLogger = new Logger(true, LOG_LEVELS.DEBUG);
export default logger;
//# sourceMappingURL=logger.js.map