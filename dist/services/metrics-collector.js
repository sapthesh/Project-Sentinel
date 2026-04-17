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
import si from 'systeminformation';
import { DEFAULT_SECURITY_CONSTRAINTS } from '../models/metrics.js';
import { logger } from '../utils/logger.js';
/**
 * Metrics Collector class
 *
 * Collects CPU, memory, and system information from the host machine.
 * Implements memory limits and safe error handling.
 */
export class MetricsCollector {
    cachedHostInfo = null;
    cpuInitialized = false;
    /**
     * Create metrics collector instance
     * SECURITY: Enforces sample count limits
     */
    constructor() {
        // Pre-warm systeminformation cache
        void this.initializeCpu();
    }
    /**
     * Initialize CPU metrics (requires initial warmup for accuracy)
     * SECURITY: Uses try-catch to handle permission errors gracefully
     */
    async initializeCpu() {
        try {
            if (!this.cpuInitialized) {
                // Initial call to warm up CPU measurements
                await si.currentLoad();
                this.cpuInitialized = true;
                logger.debug('CPU metrics initialized');
            }
        }
        catch (error) {
            logger.debug('CPU initialization skipped (may need permissions):', error);
            this.cpuInitialized = true; // Mark as initialized to prevent retry loops
        }
    }
    /**
     * Collect a single metrics snapshot
     *
     * @returns Promise resolving to SystemMetrics object
     * SECURITY: Validates and bounds all numeric values
     */
    async collect() {
        try {
            // Warm up CPU if needed
            await this.initializeCpu();
            // Collect metrics in parallel where possible
            const [cpuData, memoryData, hostData, diskData, networkData] = await Promise.all([
                this.collectCpuMetrics(),
                this.collectMemoryMetrics(),
                this.collectHostInfo(),
                this.collectDiskMetrics(),
                this.collectNetworkMetrics()
            ]);
            return {
                timestamp: new Date().toISOString(),
                cpu: cpuData,
                memory: memoryData,
                host: hostData,
                disk: diskData,
                network: networkData
            };
        }
        catch (error) {
            logger.errorObject(error);
            throw new Error('Failed to collect system metrics');
        }
    }
    /**
     * Collect CPU metrics
     * SECURITY: Bounds all values to valid ranges
     */
    async collectCpuMetrics() {
        try {
            const [current, cpuInfo] = await Promise.all([
                si.currentLoad(),
                si.cpu()
            ]);
            // SECURITY: Validate and bound values
            const safeUsage = this.boundPercentage(current.currentLoad);
            const safeFrequency = this.boundNumber(cpuInfo.speed || 0, 0, 10000);
            const safeMaxFrequency = this.boundNumber(cpuInfo.speedMax || safeFrequency, 0, 10000);
            return {
                usage: safeUsage,
                cores: cpuInfo.cores || 1,
                activeCores: Math.min(Math.floor((safeUsage / 100) * (cpuInfo.cores || 1)), cpuInfo.cores || 1),
                frequency: safeFrequency,
                maxFrequency: safeMaxFrequency,
                temperature: cpuInfo.temperature
                    ? this.boundNumber(cpuInfo.temperature, -50, 200)
                    : undefined,
                loadAverage1: current.currentLoadUser,
                loadAverage5: Array.isArray(current.avgLoad) ? current.avgLoad[0] ?? undefined : undefined,
                loadAverage15: Array.isArray(current.avgLoad) ? current.avgLoad[1] ?? undefined : undefined
            };
        }
        catch (error) {
            logger.debug('Error collecting CPU metrics:', error);
            // Return safe defaults on error
            return {
                usage: 0,
                cores: 1,
                activeCores: 0,
                frequency: 0,
                maxFrequency: 0
            };
        }
    }
    /**
     * Collect memory metrics
     * SECURITY: Validates all memory values
     */
    async collectMemoryMetrics() {
        try {
            const mem = await si.mem();
            // SECURITY: Validate values are non-negative
            const total = Math.max(0, mem.total || 0);
            const used = Math.min(Math.max(0, mem.used || 0), total);
            const free = Math.max(0, mem.free || 0);
            const available = Math.max(0, mem.available || free);
            // SECURITY: Bound percentage to valid range
            const percentage = this.boundPercentage(total > 0 ? (used / total) * 100 : 0);
            const swapTotal = Math.max(0, mem.swaptotal || 0);
            const swapUsed = Math.min(Math.max(0, mem.swapused || 0), swapTotal);
            const swapFree = Math.max(0, mem.swapfree || 0);
            const swapPercentage = swapTotal > 0
                ? this.boundPercentage((swapUsed / swapTotal) * 100)
                : 0;
            return {
                total,
                used,
                free,
                available,
                percentage,
                swapTotal,
                swapUsed,
                swapFree,
                swapPercentage
            };
        }
        catch (error) {
            logger.debug('Error collecting memory metrics:', error);
            // Return safe defaults on error
            return {
                total: 0,
                used: 0,
                free: 0,
                available: 0,
                percentage: 0,
                swapTotal: 0,
                swapUsed: 0,
                swapFree: 0,
                swapPercentage: 0
            };
        }
    }
    /**
     * Collect host information
     * SECURITY: Sanitizes hostname and version strings
     */
    async collectHostInfo() {
        try {
            const osInfo = await si.osInfo();
            return {
                uptime: Math.max(0, osInfo.uptime || 0),
                hostname: this.sanitizeHostname(osInfo.hostname || 'unknown'),
                platform: this.validatePlatform(osInfo.platform),
                release: osInfo.osrelease || osInfo.distro?.release || 'unknown',
                arch: osInfo.arch || 'unknown',
                nodeVersion: process.version
            };
        }
        catch (error) {
            logger.debug('Error collecting host info:', error);
            return {
                uptime: 0,
                hostname: 'unknown',
                platform: 'linux',
                release: 'unknown',
                arch: 'unknown',
                nodeVersion: process.version
            };
        }
    }
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
    async collectSamples(count, interval) {
        // SECURITY: Validate sample count against security constraints
        if (count <= 0) {
            throw new Error('Sample count must be a positive number');
        }
        if (count > DEFAULT_SECURITY_CONSTRAINTS.maxSamples) {
            throw new Error(`Sample count exceeds maximum allowed (${DEFAULT_SECURITY_CONSTRAINTS.maxSamples})`);
        }
        // SECURITY: Validate interval
        if (interval <= 0 || interval > 300000) {
            throw new Error('Interval must be between 1 and 300000 milliseconds');
        }
        const startTime = new Date();
        const snapshots = [];
        try {
            for (let i = 0; i < count; i++) {
                // SECURITY: Check memory usage before each sample
                const memoryUsage = process.memoryUsage();
                const heapUsed = memoryUsage.heapUsed + memoryUsage.external;
                if (heapUsed > DEFAULT_SECURITY_CONSTRAINTS.maxMemoryBytes) {
                    throw new Error('Memory limit reached. Aborting sample collection.');
                }
                // Collect sample
                const snapshot = await this.collect();
                snapshots.push(snapshot);
                // Wait for interval (except after last sample)
                if (i < count - 1) {
                    await this.sleep(interval);
                }
            }
        }
        catch (error) {
            logger.errorObject(error);
            throw new Error('Sample collection interrupted');
        }
        const endTime = new Date();
        // Calculate statistics
        return this.calculateHistory(snapshots, startTime, endTime);
    }
    /**
     * Calculate statistics from collected snapshots
     */
    calculateHistory(snapshots, startTime, endTime) {
        const cpuValues = snapshots.map(s => s.cpu.usage);
        const memoryValues = snapshots.map(s => s.memory.percentage);
        return {
            snapshots,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMs: endTime.getTime() - startTime.getTime(),
            averageCpuUsage: this.calculateAverage(cpuValues),
            maxCpuUsage: Math.max(...cpuValues, 0),
            minCpuUsage: Math.min(...cpuValues, 100),
            averageMemoryPercentage: this.calculateAverage(memoryValues),
            maxMemoryPercentage: Math.max(...memoryValues, 0),
            minMemoryPercentage: Math.min(...memoryValues, 100)
        };
    }
    /**
     * Get cached or fresh host information
     */
    async getHostInfo() {
        if (this.cachedHostInfo) {
            return this.cachedHostInfo;
        }
        this.cachedHostInfo = await this.collectHostInfo();
        return this.cachedHostInfo;
    }
    /**
     * Clear cached host info (for testing)
     */
    clearCache() {
        this.cachedHostInfo = null;
    }
    /**
     * Utility: Bound a percentage value to 0-100
     * SECURITY: Ensures all percentage values are valid
     */
    boundPercentage(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 0;
        }
        return Math.min(Math.max(value, 0), 100);
    }
    /**
     * Utility: Bound a number to min-max range
     * SECURITY: Prevents numeric overflow attacks
     */
    boundNumber(value, min, max) {
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
            return min;
        }
        return Math.min(Math.max(value, min), max);
    }
    /**
     * Utility: Sanitize hostname
     * SECURITY: Removes potentially dangerous characters
     */
    sanitizeHostname(hostname) {
        // Remove null bytes and control characters
        return hostname
            .replace(/[\x00-\x1f\x7f]/g, '')
            .substring(0, 255);
    }
    /**
     * Utility: Validate platform value
     * SECURITY: Ensures platform is from whitelist
     */
    validatePlatform(platform) {
        const validPlatforms = [
            'win32',
            'darwin',
            'linux'
        ];
        if (typeof platform === 'string' &&
            validPlatforms.includes(platform)) {
            return platform;
        }
        return 'linux'; // Default fallback
    }
    /**
     * Utility: Calculate average of number array
     */
    calculateAverage(values) {
        if (values.length === 0)
            return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }
    /**
     * Utility: Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Collect disk metrics
     */
    async collectDiskMetrics() {
        try {
            const fsSize = await si.fsSize();
            const firstDrive = fsSize.find(d => d.type && !d.mount.includes('proc') && !d.mount.includes('sys')) || fsSize[0];
            if (!firstDrive) {
                return {
                    total: 0,
                    used: 0,
                    free: 0,
                    percentage: 0
                };
            }
            const total = Math.max(0, firstDrive.size || 0);
            const used = Math.max(0, firstDrive.used || 0);
            const free = Math.max(0, firstDrive.available || 0);
            const percentage = total > 0 ? this.boundPercentage((used / total) * 100) : 0;
            return {
                total,
                used,
                free,
                percentage
            };
        }
        catch (error) {
            logger.debug('Error collecting disk metrics:', error);
            return {
                total: 0,
                used: 0,
                free: 0,
                percentage: 0
            };
        }
    }
    /**
     * Collect network metrics
     */
    async collectNetworkMetrics() {
        try {
            const netStats = await si.networkStats();
            const firstInterface = netStats.find(i => i.mac && i.mac !== '00:00:00:00:00:00') || netStats[0];
            if (!firstInterface) {
                return {
                    receivedBytes: 0,
                    transmittedBytes: 0
                };
            }
            return {
                receivedBytes: Math.max(0, firstInterface.rx_bytes || 0),
                transmittedBytes: Math.max(0, firstInterface.tx_bytes || 0)
            };
        }
        catch (error) {
            logger.debug('Error collecting network metrics:', error);
            return {
                receivedBytes: 0,
                transmittedBytes: 0
            };
        }
    }
}
export default MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map