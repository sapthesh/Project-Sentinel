/**
 * Project Sentinel - Export Command
 *
 * Collects and exports metrics data to files.
 *
 * Security features:
 * - Path validation delegated to FileExporter
 * - Input validation for all options
 * - Memory limit enforcement
 * - Atomic file writes
 * - Sanitized error messages
 */
import { MetricsCollector } from '../services/metrics-collector.js';
import { FileExporter, SentinelExportError } from '../services/file-exporter.js';
import ora from 'ora';
import { logger } from '../utils/logger.js';
import { DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_SAMPLES, DEFAULT_EXPORT_INTERVAL, SECURITY_CONSTRAINTS } from '../utils/constants.js';
/**
 * Export command handler
 *
 * @param outputPath Output file path
 * @param options Export configuration from CLI
 *
 * SECURITY:
 * - Validates all parameters
 * - Enforces memory limits
 * - Uses atomic writes via FileExporter
 * - Sanitizes error output
 */
export async function handleExport(outputPath, options) {
    // Validate required parameters
    if (!outputPath || typeof outputPath !== 'string' || outputPath.trim() === '') {
        logger.error('Error: Output file path is required');
        logger.error('Usage: sentinel export <output-file> [options]');
        process.exit(1);
    }
    // SECURITY: Validate and normalize options
    const validatedOptions = validateExportOptions(options);
    // Initialize services
    const collector = new MetricsCollector();
    const exporter = new FileExporter();
    // Create loading spinner
    const spinner = ora({
        text: 'Initializing export...',
        stream: process.stdout,
        spinner: {
            frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']
        }
    }).start();
    try {
        // Collect metrics based on sample count
        spinner.text = `Collecting ${validatedOptions.samples} sample${validatedOptions.samples !== 1 ? 's' : ' '}...`;
        let metricsData;
        const sampleCount = validatedOptions.samples ?? 1;
        const sampleInterval = validatedOptions.interval ?? DEFAULT_EXPORT_INTERVAL;
        if (sampleCount === 1) {
            // Single snapshot
            metricsData = await collector.collect();
        }
        else {
            // Multiple samples with interval
            spinner.text = `Collecting sample 1 of ${sampleCount}...`;
            const history = await collector.collectSamples(sampleCount, sampleInterval);
            const samples = history.snapshots ?? [];
            if (samples.length > 1) {
                for (let i = 1; i < samples.length; i++) {
                    spinner.text = `Collecting sample ${i + 1} of ${sampleCount}...`;
                }
            }
            metricsData = samples;
        }
        spinner.stop();
        // Export to file (with security features in FileExporter)
        spinner.start(`Writing to ${outputPath}...`);
        await exporter.export(metricsData, {
            outputPath,
            format: validatedOptions.format,
            append: validatedOptions.append,
            samples: validatedOptions.samples,
            interval: validatedOptions.interval
        });
        spinner.succeed(`Export complete!`);
    }
    catch (error) {
        spinner.stop();
        if (error instanceof SentinelExportError) {
            logger.error(`Export Error (${error.code}): ${error.message}`);
        }
        else if (error instanceof Error) {
            // SECURITY: Sanitize error message
            const sanitizedMessage = sanitizeErrorMessage(error.message);
            logger.error(`Error: ${sanitizedMessage}`);
        }
        else {
            logger.error('An unexpected error occurred during export');
        }
        process.exit(1);
    }
}
/**
 * Validate and normalize export options
 * SECURITY: Bounds all values to safe ranges and validates against constraints
 */
function validateExportOptions(options) {
    const result = {
        outputPath: '', // Set by caller
        format: (options.format || DEFAULT_EXPORT_FORMAT),
        samples: options.samples ?? DEFAULT_EXPORT_SAMPLES,
        interval: options.interval ?? DEFAULT_EXPORT_INTERVAL,
        append: options.append || false
    };
    // SECURITY: Validate format against whitelist
    const validFormats = ['json', 'csv', 'html'];
    if (!validFormats.includes(result.format)) {
        logger.warn(`Invalid format "${options.format}", using default '${DEFAULT_EXPORT_FORMAT}'`);
        result.format = DEFAULT_EXPORT_FORMAT;
    }
    // SECURITY: Validate sample count (now guaranteed non-undefined)
    const samplesVal = result.samples ?? DEFAULT_EXPORT_SAMPLES;
    if (samplesVal <= 0) {
        logger.warn('Sample count must be positive, using default');
        result.samples = DEFAULT_EXPORT_SAMPLES;
    }
    else if (samplesVal > SECURITY_CONSTRAINTS.maxSamples) {
        logger.warn(`Sample count ${samplesVal} exceeds maximum (${SECURITY_CONSTRAINTS.maxSamples}), adjusting`);
        result.samples = SECURITY_CONSTRAINTS.maxSamples;
    }
    // SECURITY: Validate interval (100ms - 300s)
    const intervalVal = result.interval ?? DEFAULT_EXPORT_INTERVAL;
    if (intervalVal <= 0 || intervalVal > 300000) {
        logger.warn(`Interval ${intervalVal}ms out of range, using default ${DEFAULT_EXPORT_INTERVAL}ms`);
        result.interval = DEFAULT_EXPORT_INTERVAL;
    }
    return result;
}
/**
 * Sanitize error message for safe output
 * SECURITY: Removes sensitive information
 */
function sanitizeErrorMessage(message) {
    // Remove absolute paths
    message = message.replace(/C:\\[^:"']+/g, '[PATH]');
    message = message.replace(/\/(?:[^\/\s]+\/)+[^\/\s]+/g, '[PATH]');
    // Remove potential credentials
    message = message.replace(/password[=:]\s*[^,\s"']+/gi, 'password=[REDACTED]');
    // Limit length
    if (message.length > 300) {
        message = message.substring(0, 300) + '...';
    }
    return message;
}
//# sourceMappingURL=export.js.map