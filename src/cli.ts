/**
 * Project Sentinel - CLI Entry Point
 *
 * Main CLI setup using commander with comprehensive security features.
 *
 * Security features:
 * - Input validation for all numeric options
 * - Bounds checking for all parameters
 * - Safe error handling
 * - Sanitized error messages
 */

import { Command, program } from 'commander';
import { handleMonitor } from './commands/monitor.js';
import { handleSnapshot } from './commands/snapshot.js';
import { handleExport } from './commands/export.js';
import { logger } from './utils/logger.js';
import { MonitorOptions, SnapshotOptions } from './models/metrics.js';
import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  DEFAULT_MONITOR_INTERVAL,
  DEFAULT_CPU_THRESHOLD,
  DEFAULT_MEMORY_THRESHOLD,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_SAMPLES,
  DEFAULT_EXPORT_INTERVAL,
  SECURITY_CONSTRAINTS
} from './utils/constants.js';

/**
 * Main CLI setup using commander
 *
 * SECURITY:
 * - All numeric inputs are validated
 * - String inputs are sanitized
 * - Command handlers receive validated data
 */
export function setupCLI(): void {
  // Program configuration with metadata
  program
    .name(APP_NAME.toLowerCase().replace(/\s+/g, '-'))
    .version(APP_VERSION, '-v, --version', 'Display version information')
    .description(APP_DESCRIPTION)
    .helpOption('-h, --help', 'Display help for command')
    .addHelpCommand('help', 'Display help for command');

  // Global error handler
  program.on('--help', function () {
    console.log('\nExamples:');
    console.log('  $ sentinel monitor');
    console.log('  $ sentinel monitor --interval 500 --duration 60');
    console.log('  $ sentinel snapshot --verbose');
    console.log('  $ sentinel snapshot --format json');
    console.log('  $ sentinel export metrics.json');
    console.log('  $ sentinel export performance.csv -f csv -n 100\n');
  });

  // ========================================================================
  // Monitor Command
  // ========================================================================
  program
    .command('monitor')
    .description('Start real-time system monitoring')
    .option(
      '-i, --interval <ms>',
      'Refresh interval in milliseconds',
      validateNumberInRange(DEFAULT_MONITOR_INTERVAL.toString(), 100, 60000)
    )
    .option(
      '-d, --duration <sec>',
      'Auto-stop after duration (seconds)',
      validateNumberInRange(null, 1, 3600)
    )
    .option('-q, --quiet', 'Suppress colored output')
    .option(
      '--cpu <pct>',
      'CPU warning threshold (%)',
      validateNumberInRange(DEFAULT_CPU_THRESHOLD.toString(), 0, 100)
    )
    .option(
      '--mem <pct>',
      'Memory warning threshold (%)',
      validateNumberInRange(DEFAULT_MEMORY_THRESHOLD.toString(), 0, 100)
    )
    .action((opts) => {
      // SECURITY: Build and validate options object
      const options: MonitorOptions = {
        interval: parseInt(opts.interval, 10) || DEFAULT_MONITOR_INTERVAL,
        duration: opts.duration !== null
          ? parseInt(opts.duration as string, 10)
          : null,
        cpuThreshold: parseInt(opts.cpu, 10) || DEFAULT_CPU_THRESHOLD,
        memoryThreshold: parseInt(opts.mem, 10) || DEFAULT_MEMORY_THRESHOLD,
        coloredOutput: !opts.quiet
      };

      // Final validation
      if (options.interval < 100 || options.interval > 60000) {
        logger.error('Error: Interval must be between 100 and 60000 milliseconds');
        process.exit(1);
      }

      if (options.duration != null && typeof options.duration === 'number' && (options.duration < 1 || options.duration > 3600)) {
        logger.error('Error: Duration must be between 1 and 3600 seconds');
        process.exit(1);
      }

      if (options.cpuThreshold < 0 || options.cpuThreshold > 100) {
        logger.error('Error: CPU threshold must be between 0 and 100');
        process.exit(1);
      }

      if (options.memoryThreshold < 0 || options.memoryThreshold > 100) {
        logger.error('Error: Memory threshold must be between 0 and 100');
        process.exit(1);
      }

      handleMonitor(options);
    });

  // ========================================================================
  // Snapshot Command
  // ========================================================================
  program
    .command('snapshot')
    .description('Capture a single metrics snapshot')
    .option('-v, --verbose', 'Include detailed metrics')
    .option(
      '-f, --format <fmt>',
      'Output format (text/json)',
      validateFormatOption
    )
    .action((opts) => {
      // SECURITY: Validate and sanitize format
      const format = opts.format?.toString().toLowerCase() || 'text';
      if (!['text', 'json'].includes(format)) {
        logger.error('Error: Format must be "text" or "json"');
        process.exit(1);
      }

      const options: SnapshotOptions = {
        verbose: opts.verbose || false,
        format: format as 'text' | 'json'
      };

      handleSnapshot(options);
    });

  // ========================================================================
  // Export Command
  // ========================================================================
  program
    .command('export <output-file>')
    .description('Export metrics to file')
    .requiredOption(
      '-o, --output <file>',
      'Output file path (required)'
    )
    .option(
      '-f, --format <fmt>',
      'Export format (json/csv/html)',
      validateExportFormat
    )
    .option(
      '-n, --samples <n>',
      'Number of samples to collect',
      validateNumberInRange(DEFAULT_EXPORT_SAMPLES.toString(), 1, SECURITY_CONSTRAINTS.maxSamples)
    )
    .option(
      '-i, --interval <ms>',
      'Interval between samples in milliseconds',
      validateNumberInRange(DEFAULT_EXPORT_INTERVAL.toString(), 100, 300000)
    )
    .option('-a, --append', 'Append to existing file')
    .action((outputFile, opts) => {
      // SECURITY: Validate output file path
      if (!outputFile || typeof outputFile !== 'string' || outputFile.trim() === '') {
        logger.error('Error: Output file path is required');
        process.exit(1);
      }

      // SECURITY: Basic path validation (full validation in FileExporter)
      if (outputFile.includes('..') || outputFile.includes('\0')) {
        logger.error('Error: Invalid output file path');
        process.exit(1);
      }

      // Parse and validate options
      const format = opts.format?.toString().toLowerCase() || DEFAULT_EXPORT_FORMAT;
      if (!['json', 'csv', 'html'].includes(format)) {
        logger.error('Error: Format must be "json", "csv", or "html"');
        process.exit(1);
      }

      const samples = parseInt(opts.samples as string, 10) || DEFAULT_EXPORT_SAMPLES;
      if (samples < 1 || samples > SECURITY_CONSTRAINTS.maxSamples) {
        logger.error(
          `Error: Samples must be between 1 and ${SECURITY_CONSTRAINTS.maxSamples}`
        );
        process.exit(1);
      }

      const interval = parseInt(opts.interval as string, 10) || DEFAULT_EXPORT_INTERVAL;
      if (interval < 100 || interval > 300000) {
        logger.error('Error: Interval must be between 100 and 300000 milliseconds');
        process.exit(1);
      }

      handleExport(outputFile, {
        format: format,
        samples: samples,
        interval: interval,
        append: opts.append || false
      });
    });

  // Parse CLI arguments
  program.parse(process.argv);
}

/**
 * Initialize the CLI application
 *
 * @returns Configured Commander program instance
 *
 * SECURITY: Handles global errors and process signals
 */
export async function init(): Promise<Command> {
  // Setup error handlers
  setupErrorHandlers();

  // Setup CLI commands
  setupCLI();

  // Check if help was requested
  if (program.args.length === 0) {
    program.outputHelp();
    process.exit(0);
  }

  return program;
}

/**
 * Setup global error handlers
 * SECURITY: Sanitizes error output
 */
function setupErrorHandlers(): void {
  // Unhandled promise rejection
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${sanitizeForLogging(promise?.toString() || 'unknown promise')}`);
    logger.error(`Reason: ${sanitizeForLogging(reason?.toString() || 'unknown')}`);
    process.exit(1);
  });

  // Uncaught exception
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:');
    logger.error(sanitizeForLogging(error.message));
    process.exit(1);
  });
}

/**
 * Validate number in range option
 * SECURITY: Bounds checking for all numeric options
 */
function validateNumberInRange(
  defaultValue: string | null,
  min: number,
  max: number
) {
  return (value: string): string | number => {
    const parsed = value !== undefined ? parseInt(value, 10) : defaultValue ? parseInt(defaultValue, 10) : null;

    if (parsed === null || isNaN(parsed)) {
      return defaultValue || min.toString();
    }

    if (parsed < min || parsed > max) {
      logger.warn(`Value ${parsed} out of range [${min}, ${max}], using ${defaultValue || min}`);
      return defaultValue || min;
    }

    return parsed;
  };
}

/**
 * Validate format option
 * SECURITY: Whitelist validation
 */
function validateFormatOption(value: string): string {
  const validFormats = ['text', 'json'];
  const lowerValue = value.toLowerCase();

  if (!validFormats.includes(lowerValue)) {
    logger.warn(`Invalid format "${value}", using "text"`);
    return 'text';
  }

  return lowerValue;
}

/**
 * Validate export format option
 * SECURITY: Whitelist validation
 */
function validateExportFormat(value: string): string {
  const validFormats = ['json', 'csv', 'html'];
  const lowerValue = value.toLowerCase();

  if (!validFormats.includes(lowerValue)) {
    logger.warn(`Invalid format "${value}", using "json"`);
    return 'json';
  }

  return lowerValue;
}

/**
 * Sanitize string for safe logging
 * SECURITY: Removes potentially harmful characters
 */
function sanitizeForLogging(str: string): string {
  if (!str) return '';

  // Remove null bytes and control characters
  str = str.replace(/[\x00-\x1f\x7f]/g, '');

  // Remove potential paths
  str = str.replace(/C:\\[^:"']+/g, '[PATH]');
  str = str.replace(/\/(?:[^\/\s]+\/)+[^\/\s]+/g, '[PATH]');

  // Limit length
  if (str.length > 500) {
    str = str.substring(0, 500) + '...';
  }

  return str;
}
