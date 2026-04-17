/**
 * Project Sentinel - Data Models and Interfaces
 *
 * Defines the core data structures for system metrics collection,
 * reporting, and export operations.
 */

/**
 * CPU metrics data structure
 * Captures processor utilization and hardware information
 */
export interface CpuMetrics {
  /** Overall CPU usage percentage (0-100) */
  usage: number;

  /** Total number of CPU cores */
  cores: number;

  /** Number of currently active cores (usage > 0) */
  activeCores: number;

  /** Current CPU frequency in MHz */
  frequency: number;

  /** Maximum CPU frequency in MHz */
  maxFrequency: number;

  /** Temperature in Celsius (if available) */
  temperature?: number;

  /** Load average over 1 minute (Unix only) */
  loadAverage1?: number;

  /** Load average over 5 minutes (Unix only) */
  loadAverage5?: number;

  /** Load average over 15 minutes (Unix only) */
  loadAverage15?: number;
}

/**
 * Memory metrics data structure
 * Captures RAM and swap space utilization
 */
export interface MemoryMetrics {
  /** Total physical memory in bytes */
  total: number;

  /** Used memory in bytes */
  used: number;

  /** Free memory in bytes */
  free: number;

  /** Available memory (free + buffers/cache) in bytes */
  available: number;

  /** Memory usage percentage (0-100) */
  percentage: number;

  /** Swap space total in bytes */
  swapTotal: number;

  /** Swap space used in bytes */
  swapUsed: number;

  /** Swap space free in bytes */
  swapFree: number;

  /** Swap usage percentage (0-100) */
  swapPercentage: number;
}

/**
 * Disk I/O metrics data structure
 * Captures disk read/write statistics
 */
export interface DiskMetrics {
  /** Total disk size in bytes */
  total: number;

  /** Used disk space in bytes */
  used: number;

  /** Free disk space in bytes */
  free: number;

  /** Disk usage percentage (0-100) */
  percentage: number;

  /** Read speed in bytes per second */
  readSpeed?: number;

  /** Write speed in bytes per second */
  writeSpeed?: number;
}

/**
 * Network metrics data structure
 * Captures network interface statistics
 */
export interface NetworkMetrics {
  /** Bytes received */
  receivedBytes: number;

  /** Bytes transmitted */
  transmittedBytes: number;

  /** Received speed in bytes per second */
  receivedSpeed?: number;

  /** Transmitted speed in bytes per second */
  transmittedSpeed?: number;
}

/**
 * Host system information
 * Captures static system metadata
 */
export interface HostInfo {
  /** Uptime in seconds */
  uptime: number;

  /** Hostname */
  hostname: string;

  /** Operating system platform */
  platform: 'win32' | 'darwin' | 'linux';

  /** Operating system release/version */
  release: string;

  /** CPU architecture */
  arch: string;

  /** Node.js version */
  nodeVersion: string;
}

/**
 * Complete system metrics snapshot
 * Represents a single point-in-time measurement
 */
export interface SystemMetrics {
  /** ISO 8601 timestamp of measurement */
  timestamp: string;

  /** CPU metrics */
  cpu: CpuMetrics;

  /** Memory metrics */
  memory: MemoryMetrics;

  /** Disk metrics (optional) */
  disk?: DiskMetrics;

  /** Network metrics (optional) */
  network?: NetworkMetrics;

  /** Host system information */
  host: HostInfo;
}

/**
 * Historical metrics collection
 * Aggregates multiple snapshots with statistics
 */
export interface MetricsHistory {
  /** Array of historical snapshots */
  snapshots: SystemMetrics[];

  /** Collection start time (ISO 8601) */
  startTime: string;

  /** Collection end time (ISO 8601) */
  endTime: string;

  /** Total collection duration in milliseconds */
  durationMs: number;

  /** Average CPU usage across all samples */
  averageCpuUsage: number;

  /** Maximum CPU usage recorded */
  maxCpuUsage: number;

  /** Minimum CPU usage recorded */
  minCpuUsage: number;

  /** Average memory percentage across all samples */
  averageMemoryPercentage: number;

  /** Maximum memory percentage recorded */
  maxMemoryPercentage: number;

  /** Minimum memory percentage recorded */
  minMemoryPercentage: number;
}

/**
 * Export format enumeration
 */
export type ExportFormat = 'json' | 'csv' | 'html';

/**
 * Export configuration options
 */
export interface ExportOptions {
  /** Output file path (must pass security validation) */
  outputPath: string;

  /** Export format */
  format: ExportFormat;

  /** Whether to append to existing file */
  append?: boolean;

  /** Number of samples to collect */
  samples?: number;

  /** Interval between samples in milliseconds */
  interval?: number;
}

/**
 * Monitor configuration options
 */
export interface MonitorOptions {
  /** Refresh interval in milliseconds */
  interval: number;

  /** Duration to run in seconds (null for indefinite) */
  duration?: number | null;

  /** CPU warning threshold percentage */
  cpuThreshold: number;

  /** Memory warning threshold percentage */
  memoryThreshold: number;

  /** Enable/disable colored output */
  coloredOutput: boolean;
}

/**
 * Snapshot command options
 */
export interface SnapshotOptions {
  /** Include detailed metrics */
  verbose: boolean;

  /** Output format (text or json) */
  format: 'text' | 'json';
}

/**
 * Security constraints for the application
 * All operations must respect these limits
 */
export interface SecurityConstraints {
  /** Maximum number of samples allowed in a single operation */
  maxSamples: number;

  /** Maximum memory footprint in bytes (500MB) */
  maxMemoryBytes: number;

  /** Maximum file size for exports in bytes (100MB) */
  maxFileSizeBytes: number;

  /** Maximum path length for file operations */
  maxPathLength: number;

  /** Characters forbidden in file paths */
  forbiddenPathChars: string[];
}

/**
 * Default security constraints
 * These values enforce memory and resource limits
 */
export const DEFAULT_SECURITY_CONSTRAINTS: SecurityConstraints = {
  maxSamples: 10000,
  maxMemoryBytes: 500 * 1024 * 1024, // 500MB
  maxFileSizeBytes: 100 * 1024 * 1024, // 100MB
  maxPathLength: 260, // Windows max path length
  forbiddenPathChars: ['\0', '\n', '\r']
};
