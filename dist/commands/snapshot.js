/**
 * Project Sentinel - Snapshot Command
 *
 * Captures and displays a single metrics snapshot.
 *
 * Security features:
 * - Input validation for format option
 * - Safe error handling
 * - Sanitized output
 */
import { MetricsCollector } from '../services/metrics-collector.js';
import { ReportGenerator } from '../services/report-generator.js';
import ora from 'ora';
import { logger } from '../utils/logger.js';
import { VALID_SNAPSHOT_FORMATS } from '../utils/constants.js';
/**
 * Snapshot command handler
 *
 * @param options Snapshot configuration from CLI
 *
 * SECURITY:
 * - Validates format option against whitelist
 * - Handles errors gracefully
 * - Sanitizes output data
 */
export async function handleSnapshot(options) {
    // SECURITY: Validate format option
    const validatedFormat = validateFormat(options.format);
    // Initialize services
    const collector = new MetricsCollector();
    const generator = new ReportGenerator();
    // Create loading spinner
    const spinner = ora({
        text: 'Capturing system snapshot...',
        stream: process.stdout,
        spinner: {
            frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']
        }
    }).start();
    try {
        // Collect metrics
        const metrics = await collector.collect();
        // Stop spinner and display results
        spinner.stop();
        // Generate and output report based on format
        if (validatedFormat === 'json') {
            const report = generator.generateJsonReport(metrics);
            console.log(report);
        }
        else {
            const report = generator.generateSnapshotReport(metrics, options.verbose);
            console.log(report);
        }
        logger.success(`Snapshot captured at ${metrics.timestamp}`);
    }
    catch (error) {
        spinner.stop();
        logger.errorObject(error);
        process.exit(1);
    }
}
/**
 * Validate format option against whitelist
 * SECURITY: Prevents injection attacks through format parameter
 */
function validateFormat(format) {
    const lowerFormat = format.toLowerCase();
    if (VALID_SNAPSHOT_FORMATS.includes(lowerFormat)) {
        return lowerFormat;
    }
    logger.warn(`Invalid format "${format}", using default 'text' format`);
    return 'text';
}
//# sourceMappingURL=snapshot.js.map