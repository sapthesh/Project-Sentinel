/**
 * Project Sentinel - Metrics Collector Service
 *
 * Core service for collecting system performance metrics using systeminformation.
 *
 * Security features:
 * - Memory limits enforced (max 10000 samples)
 * - Input validation for sample counts
 * - Safe error handling without info disclosure
 */
import { SystemMetrics, MetricsHistory, HostInfo } from '../models/metrics.js';
/**
 * Metrics Collector class
 *
 * Collects CPU, memory, and system information from the host machine.
 * Implements memory limits and safe error handling.
 */
export declare class MetricsCollector {
    private cachedHostInfo;
    private cpuInitialized;
    /**
     * Create metrics collector instance
     * SECURITY: Enforces sample count limits
     */
    constructor();
    /**
     * Initialize CPU metrics (requires initial warmup for accuracy)
     * SECURITY: Uses try-catch to handle permission errors gracefully
     */
    private initializeCpu;
    /**
     * Collect a single metrics snapshot
     *
     * @returns Promise resolving to SystemMetrics object
     * SECURITY: Validates and bounds all numeric values
     */
    collect(): Promise<SystemMetrics>;
    /**
     * Collect CPU metrics
     * SECURITY: Bounds all values to valid ranges
     */
    private collectCpuMetrics;
    /**
     * Collect memory metrics
     * SECURITY: Validates all memory values
     */
    private collectMemoryMetrics;
    /**
     * Collect host information
     * SECURITY: Sanitizes hostname and version strings
     */
    private collectHostInfo;
    /**
     * Collect multiple samples over time
     *
     * @param count Number of samples to collect
     * @param interval Interval between samples in milliseconds
     * @returns Promise resolving to MetricsHistory
     *
     * SECURITY:
     * - Enforces maximum sample limit (10000)
     * - Validates input parameters
     * - Monitors memory usage
     * - Sanitizes error messages
     */
    collectSamples(count: number, interval: number): Promise<MetricsHistory>;
    /**
     * Calculate statistics from collected snapshots
     */
    private calculateHistory;
    /**
     * Get cached or fresh host information
     */
    getHostInfo(): Promise<HostInfo>;
    /**
     * Clear cached host info (for testing)
     */
    clearCache(): void;
    /**
     * Utility: Bound a percentage value to 0-100
     * SECURITY: Ensures all percentage values are valid
     */
    private boundPercentage;
    /**
     * Utility: Bound a number to min-max range
     * SECURITY: Prevents numeric overflow attacks
     */
    private boundNumber;
    /**
     * Utility: Sanitize hostname
     * SECURITY: Removes potentially dangerous characters
     */
    private sanitizeHostname;
    /**
     * Utility: Validate platform value
     * SECURITY: Ensures platform is from whitelist
     */
    private validatePlatform;
    /**
     * Utility: Calculate average of number array
     */
    private calculateAverage;
    /**
     * Utility: Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Collect disk metrics
     */
    private collectDiskMetrics;
    /**
     * Collect network metrics
     */
    private collectNetworkMetrics;
}
export default MetricsCollector;
//# sourceMappingURL=metrics-collector.d.ts.map