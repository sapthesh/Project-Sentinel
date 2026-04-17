/**
 * Project Sentinel - Monitor Command
 *
 * Implements real-time monitoring with live terminal updates.
 *
 * Security features:
 * - Input validation for all options
 * - Graceful shutdown handling
 * - Memory monitoring during operation
 * - Safe error handling
 */

import { MetricsCollector } from '../services/metrics-collector.js';
import { ReportGenerator } from '../services/report-generator.js';
import ora from 'ora';
import chalk from 'chalk';
import { MonitorOptions, SystemMetrics } from '../models/metrics.js';
import { logger } from '../utils/logger.js';
import {
  DEFAULT_MONITOR_INTERVAL,
  DEFAULT_MONITOR_DURATION,
  DEFAULT_CPU_THRESHOLD,
  DEFAULT_MEMORY_THRESHOLD,
  STATUS_ICONS,
  SECURITY_CONSTRAINTS
} from '../utils/constants.js';

// Global flag for shutdown
let shouldStop = false;

/**
 * Clear terminal screen using ANSI escape codes
 */
function clearScreen(): void {
  process.stdout.write('\x1Bc'); // Clear screen and move cursor to home
}

/**
 * Monitor command handler
 *
 * @param options Monitor configuration from CLI
 *
 * SECURITY:
 * - Validates all input parameters
 * - Monitors memory usage
 * - Handles graceful shutdown
 */
export async function handleMonitor(options: MonitorOptions): Promise<void> {
  // SECURITY: Validate options
  const validatedOptions = validateMonitorOptions(options);

  // Initialize services
  const collector = new MetricsCollector();
  const generator = new ReportGenerator();

  // Create loading spinner
  const spinner = ora({
    text: 'Initializing Sentinel monitor...',
    stream: process.stdout,
    spinner: {
      frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']
    }
  }).start();

  try {
    // Collect initial metrics
    spinner.text = 'Collecting initial metrics...';
    const initialMetrics = await collector.collect();
    spinner.stop();

    // Display initial report
    displayInitialReport(initialMetrics, validatedOptions);

    // Setup cleanup handlers
    const cleanup = setupCleanup(validatedOptions.duration ?? null);

    // Start monitoring loop
    await startMonitoringLoop(
      collector,
      generator,
      validatedOptions,
      cleanup
    );
  } catch (error) {
    spinner.stop();
    logger.errorObject(error);
    process.exit(1);
  }
}

/**
 * Validate and normalize monitor options
 * SECURITY: Bounds all values to safe ranges
 */
function validateMonitorOptions(options: MonitorOptions): MonitorOptions {
  const result: MonitorOptions = {
    interval: options.interval,
    duration: options.duration,
    cpuThreshold: options.cpuThreshold,
    memoryThreshold: options.memoryThreshold,
    coloredOutput: options.coloredOutput
  };

  // Validate interval (100ms - 60s)
  if (result.interval < 100 || result.interval > 60000) {
    logger.warn(
      `Interval ${result.interval}ms out of range, using default ${DEFAULT_MONITOR_INTERVAL}ms`
    );
    result.interval = DEFAULT_MONITOR_INTERVAL;
  }

  // Validate duration (1s - 1 hour)
  if (result.duration != null && typeof result.duration === 'number') {
    if (result.duration < 1 || result.duration > 3600) {
      logger.warn(
        `Duration ${result.duration}s out of range, using default (indefinite)`
      );
      result.duration = DEFAULT_MONITOR_DURATION;
    }
  }

  // Validate thresholds (0-100%)
  if (result.cpuThreshold < 0 || result.cpuThreshold > 100) {
    logger.warn(
      `CPU threshold ${result.cpuThreshold}% out of range, using default ${DEFAULT_CPU_THRESHOLD}%`
    );
    result.cpuThreshold = DEFAULT_CPU_THRESHOLD;
  }

  if (result.memoryThreshold < 0 || result.memoryThreshold > 100) {
    logger.warn(
      `Memory threshold ${result.memoryThreshold}% out of range, using default ${DEFAULT_MEMORY_THRESHOLD}%`
    );
    result.memoryThreshold = DEFAULT_MEMORY_THRESHOLD;
  }

  return result;
}

/**
 * Display initial report with system information
 */
function displayInitialReport(metrics: SystemMetrics, options: MonitorOptions): void {
  logger.clear();

  console.log(chalk.cyan(`\n${STATUS_ICONS.loading} Sentinel Monitor Started\n`));
  console.log(`Host: ${metrics.host.hostname}`);
  console.log(`Platform: ${metrics.host.platform} ${metrics.host.release}`);
  console.log(`Update Interval: ${options.interval}ms`);
  if (options.duration !== null) {
    console.log(`Duration: ${options.duration}s`);
  }
  console.log(`CPU Threshold: ${options.cpuThreshold}%`);
  console.log(`Memory Threshold: ${options.memoryThreshold}%`);
  console.log(chalk.dim('\nPress Ctrl+C to stop\n'));
  console.log();

  // Display first metrics
  const display = new ReportGenerator().generateMonitorDisplay(
    metrics,
    {
      cpuThreshold: options.cpuThreshold,
      memoryThreshold: options.memoryThreshold
    }
  );
  console.log(display);
}

/**
 * Main monitoring loop with continuous updates
 *
 * @param collector MetricsCollector instance
 * @param generator ReportGenerator instance
 * @param options Monitor configuration
 * @param cleanup Cleanup handler function
 */
async function startMonitoringLoop(
  collector: MetricsCollector,
  generator: ReportGenerator,
  options: MonitorOptions,
  cleanup: () => Promise<void>
): Promise<void> {
  let startTime: number | null = null;
  let isRunning = true;
  const samplesCollected: SystemMetrics[] = [];

  // Setup signal handlers for this session
  const signalHandler = async (signal: string): Promise<void> => {
    if (shouldStop) return;
    shouldStop = true;
    isRunning = false;
    console.log(chalk.cyan(`\n${STATUS_ICONS.loading} Received ${signal}, shutting down...`));
    await displayFinalSummary(samplesCollected, options);
    process.exit(0);
  };

  process.on('SIGINT', () => signalHandler('SIGINT'));
  process.on('SIGTERM', () => signalHandler('SIGTERM'));

  try {
    while (isRunning && !shouldStop) {
      // Check memory limit
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed + memoryUsage.external;
      if (heapUsed > SECURITY_CONSTRAINTS.maxMemoryBytes) {
        console.warn('Memory limit approaching, stopping monitor');
        break;
      }

      // Check sample limit
      if (samplesCollected.length >= SECURITY_CONSTRAINTS.maxSamples) {
        console.warn('Sample limit reached, stopping monitor');
        break;
      }

      // Collect metrics
      const metrics = await collector.collect();
      samplesCollected.push(metrics);

      // Clear screen and redisplay
      clearScreen();
      console.log(generator.generateMonitorDisplay(metrics, {
        cpuThreshold: options.cpuThreshold,
        memoryThreshold: options.memoryThreshold
      }));

      // Track start time for duration check
      if (startTime === null) {
        startTime = Date.now();
      }

      // Check duration
      if (options.duration != null && typeof options.duration === 'number') {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= options.duration) {
          isRunning = false;
          break;
        }
      }

      // Wait for next interval with interruption support
      await sleepWithCancel(options.interval);
    }

    // Remove signal handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');

    // Display final summary
    if (!shouldStop) {
      await displayFinalSummary(samplesCollected, options);
    }
    await cleanup();
  } catch (error) {
    logger.errorObject(error);
    await cleanup();
  }
}

/**
 * Sleep that can be interrupted by shouldStop flag
 */
function sleepWithCancel(ms: number): Promise<void> {
  return new Promise(resolve => {
    const interval = Math.min(ms, 100); // Check every 100ms
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      if (shouldStop || elapsed >= ms) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
}

/**
 * Display final summary statistics
 */
async function displayFinalSummary(
  samples: SystemMetrics[],
  _options: MonitorOptions
): Promise<void> {
  logger.clear();

  if (samples.length === 0) {
    console.log(chalk.yellow('\nNo samples collected.\n'));
    return;
  }

  // Calculate statistics
  const cpuValues = samples.map(s => s.cpu.usage);
  const memoryValues = samples.map(s => s.memory.percentage);

  const avgCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
  const maxCpu = Math.max(...cpuValues);
  const minCpu = Math.min(...cpuValues);

  const avgMem = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
  const maxMem = Math.max(...memoryValues);
  const minMem = Math.min(...memoryValues);

  console.log(chalk.cyan('\n' + '='.repeat(44) + '\n'));
  console.log(chalk.bold('  Sentinel Monitor Summary\n'));
  console.log(`  Samples Collected: ${samples.length}`);
  console.log();
  console.log('  CPU Statistics:');
  console.log(`    Average: ${avgCpu.toFixed(1)}%`);
  console.log(`    Maximum: ${maxCpu.toFixed(1)}%`);
  console.log(`    Minimum: ${minCpu.toFixed(1)}%`);
  console.log();
  console.log('  Memory Statistics:');
  console.log(`    Average: ${avgMem.toFixed(1)}%`);
  console.log(`    Maximum: ${maxMem.toFixed(1)}%`);
  console.log(`    Minimum: ${minMem.toFixed(1)}%`);
  console.log(chalk.cyan('  ' + '='.repeat(44) + '\n'));
}

/**
 * Setup process cleanup handlers for graceful shutdown
 *
 * @param duration Optional duration for auto-stop
 * @returns Cleanup function
 */
function setupCleanup(_duration: number | null): () => Promise<void> {
  let cleanupCalled = false;

  const handleShutdown = async (signal: string): Promise<void> => {
    if (cleanupCalled) return;
    cleanupCalled = true;

    console.log(chalk.cyan(`\n${STATUS_ICONS.loading} Received ${signal}, shutting down...`));
  };

  // Add signal handlers
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Return cleanup function
  return async (): Promise<void> => {
    if (cleanupCalled) return;
    cleanupCalled = true;

    console.log(chalk.cyan(`\n${STATUS_ICONS.loading} Shutting down Sentinel monitor...`));

    // Remove handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');

    // Small delay for cleanup
    await sleep(100);

    console.log(chalk.green(`${STATUS_ICONS.success} Sentinel monitor stopped.\n`));
    process.exit(0);
  };
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
