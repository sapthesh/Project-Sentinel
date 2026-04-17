#!/usr/bin/env node
/**
 * Project Sentinel - Main Entry Point
 *
 * Real-time system performance monitoring CLI tool
 *
 * @version 1.0.0
 * @author Project Sentinel Team
 *
 * Security Features Implemented:
 * - Path traversal prevention
 * - Input validation and bounds checking
 * - Atomic file writes
 * - Memory limits (max 10000 samples, 500MB)
 * - Sanitized error messages
 * - Safe template rendering
 */
import { init } from './cli.js';
import { logger } from './utils/logger.js';
import { APP_NAME, APP_VERSION } from './utils/constants.js';
/**
 * Main application entry point
 *
 * SECURITY:
 * - All user input is validated before processing
 * - Errors are sanitized before display
 * - Memory usage is monitored
 * - File operations use atomic writes
 */
async function main() {
    try {
        // Check for help flag first
        if (process.argv.includes('-h') || process.argv.includes('--help')) {
            await init();
            return;
        }
        // Check for version flag
        if (process.argv.includes('-v') || process.argv.includes('--version')) {
            console.log(`${APP_NAME} v${APP_VERSION}`);
            return;
        }
        // Initialize CLI
        await init();
    }
    catch (error) {
        // SECURITY: Sanitize error output
        if (error instanceof Error) {
            logger.error(`Fatal error: ${sanitizeErrorMessage(error.message)}`);
        }
        else {
            logger.error('A fatal error occurred');
        }
        process.exit(1);
    }
}
/**
 * Sanitize error message for safe output
 * SECURITY: Removes sensitive information
 */
function sanitizeErrorMessage(message) {
    // Remove absolute paths
    message = message.replace(/C:\\[^:"']+/g, '[PATH]');
    message = message.replace(/\/(?:[^\/\s]+\/)+[^\/\s]+/g, '[PATH]');
    // Remove credentials
    message = message.replace(/password[=:]\s*[^,\s"']+/gi, 'password=[REDACTED]');
    // Limit length
    if (message.length > 300) {
        message = message.substring(0, 300) + '...';
    }
    return message;
}
// Run the application
main();
//# sourceMappingURL=index.js.map