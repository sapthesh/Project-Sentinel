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
import { MonitorOptions } from '../models/metrics.js';
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
export declare function handleMonitor(options: MonitorOptions): Promise<void>;
//# sourceMappingURL=monitor.d.ts.map