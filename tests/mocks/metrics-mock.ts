/**
 * Project Sentinel - Mock Data for Testing
 *
 * Provides mock system metrics data for unit and integration tests.
 * Ensures consistent test results without relying on actual system state.
 */

import {
  SystemMetrics,
  MetricsHistory,
  CpuMetrics,
  MemoryMetrics,
  HostInfo,
  DiskMetrics,
  NetworkMetrics
} from '../../src/models/metrics.js';

/**
 * Base timestamp for mock data
 * All mock timestamps are relative to this for reproducibility
 */
export const BASE_TIMESTAMP = '2026-04-16T14:30:00.000Z';

/**
 * Mock CPU metrics - Normal operating state
 */
export const mockCpuMetrics: CpuMetrics = {
  usage: 45.2,
  cores: 8,
  activeCores: 4,
  frequency: 2400,
  maxFrequency: 3800,
  temperature: 65.5
};

/**
 * Mock CPU metrics - High load state
 */
export const mockCpuMetricsHighLoad: CpuMetrics = {
  usage: 92.5,
  cores: 8,
  activeCores: 7,
  frequency: 3600,
  maxFrequency: 3800,
  temperature: 82.3
};

/**
 * Mock CPU metrics - Idle state
 */
export const mockCpuMetricsIdle: CpuMetrics = {
  usage: 2.1,
  cores: 8,
  activeCores: 0,
  frequency: 800,
  maxFrequency: 3800,
  temperature: 42.0
};

/**
 * Mock memory metrics - Normal operating state
 */
export const mockMemoryMetrics: MemoryMetrics = {
  total: 17179869184, // 16 GB
  used: 8589934592, // 8 GB
  free: 6291456000, // 6 GB
  available: 7516192768, // 7 GB
  percentage: 51.2,
  swapTotal: 4294967296, // 4 GB
  swapUsed: 536870912, // 512 MB
  swapFree: 3758096384, // 3.5 GB
  swapPercentage: 12.5
};

/**
 * Mock memory metrics - High memory usage
 */
export const mockMemoryMetricsHigh: MemoryMetrics = {
  total: 17179869184, // 16 GB
  used: 15461882240, // 14.4 GB
  free: 858993459, // 800 MB
  available: 1610612736, // 1.5 GB
  percentage: 89.5,
  swapTotal: 4294967296, // 4 GB
  swapUsed: 2147483648, // 2 GB
  swapFree: 2147483648, // 2 GB
  swapPercentage: 50.0
};

/**
 * Mock memory metrics - Low memory usage
 */
export const mockMemoryMetricsLow: MemoryMetrics = {
  total: 17179869184, // 16 GB
  used: 3435973836, // 3.2 GB
  free: 12884901888, // 12 GB
  available: 13743895347, // 12.8 GB
  percentage: 19.9,
  swapTotal: 4294967296, // 4 GB
  swapUsed: 0,
  swapFree: 4294967296, // 4 GB
  swapPercentage: 0
};

/**
 * Mock disk metrics
 */
export const mockDiskMetrics: DiskMetrics = {
  total: 500107862000, // 500 GB
  used: 150032358600, // 150 GB
  free: 350075503400, // 350 GB
  percentage: 30.0,
  readSpeed: 125000000, // 125 MB/s
  writeSpeed: 45000000 // 45 MB/s
};

/**
 * Mock network metrics
 */
export const mockNetworkMetrics: NetworkMetrics = {
  receivedBytes: 1073741824, // 1 GB
  transmittedBytes: 536870912, // 512 MB
  receivedSpeed: 45000000, // 45 MB/s
  transmittedSpeed: 12000000 // 12 MB/s
};

/**
 * Mock host information - Linux
 */
export const mockHostInfoLinux: HostInfo = {
  uptime: 617542, // ~7 days
  hostname: 'test-workstation',
  platform: 'linux',
  release: '5.15.0-generic',
  arch: 'x64',
  nodeVersion: 'v18.19.0'
};

/**
 * Mock host information - Windows
 */
export const mockHostInfoWindows: HostInfo = {
  uptime: 617542,
  hostname: 'DESKTOP-TEST',
  platform: 'win32',
  release: '10.0.22621',
  arch: 'x64',
  nodeVersion: 'v18.19.0'
};

/**
 * Mock host information - macOS
 */
export const mockHostInfoMacOS: HostInfo = {
  uptime: 617542,
  hostname: 'Test-MacBook-Pro',
  platform: 'darwin',
  release: '23.3.0',
  arch: 'arm64',
  nodeVersion: 'v18.19.0'
};

/**
 * Standard mock system metrics - Normal state (Linux)
 */
export const mockSystemMetrics: SystemMetrics = {
  timestamp: BASE_TIMESTAMP,
  cpu: mockCpuMetrics,
  memory: mockMemoryMetrics,
  disk: mockDiskMetrics,
  network: mockNetworkMetrics,
  host: mockHostInfoLinux
};

/**
 * Mock system metrics - High load state
 */
export const mockSystemMetricsHighLoad: SystemMetrics = {
  timestamp: BASE_TIMESTAMP,
  cpu: mockCpuMetricsHighLoad,
  memory: mockMemoryMetricsHigh,
  disk: mockDiskMetrics,
  network: mockNetworkMetrics,
  host: mockHostInfoLinux
};

/**
 * Mock system metrics - Windows platform
 */
export const mockSystemMetricsWindows: SystemMetrics = {
  timestamp: BASE_TIMESTAMP,
  cpu: mockCpuMetrics,
  memory: mockMemoryMetrics,
  host: mockHostInfoWindows
};

/**
 * Mock system metrics - macOS platform
 */
export const mockSystemMetricsMacOS: SystemMetrics = {
  timestamp: BASE_TIMESTAMP,
  cpu: mockCpuMetrics,
  memory: mockMemoryMetrics,
  host: mockHostInfoMacOS
};

/**
 * Mock system metrics without optional fields
 */
export const mockSystemMetricsMinimal: SystemMetrics = {
  timestamp: BASE_TIMESTAMP,
  cpu: {
    usage: 45.2,
    cores: 4,
    activeCores: 2,
    frequency: 2000,
    maxFrequency: 3000
  },
  memory: {
    total: 8589934592, // 8 GB
    used: 4294967296, // 4 GB
    free: 2147483648, // 2 GB
    available: 3221225472, // 3 GB
    percentage: 50.0,
    swapTotal: 2147483648, // 2 GB
    swapUsed: 107374182, // 100 MB
    swapFree: 2040109466, // 1.9 GB
    swapPercentage: 5.0
  },
  host: mockHostInfoLinux
};

/**
 * Mock metrics history - Multiple snapshots
 */
export const mockMetricsHistory: MetricsHistory = {
  snapshots: [
    mockSystemMetrics,
    { ...mockSystemMetrics, timestamp: '2026-04-16T14:30:05.000Z', cpu: { ...mockCpuMetrics, usage: 48.3 } },
    { ...mockSystemMetrics, timestamp: '2026-04-16T14:30:10.000Z', cpu: { ...mockCpuMetrics, usage: 42.1 } },
    { ...mockSystemMetrics, timestamp: '2026-04-16T14:30:15.000Z', cpu: { ...mockCpuMetrics, usage: 51.7 } },
    { ...mockSystemMetrics, timestamp: '2026-04-16T14:30:20.000Z', cpu: { ...mockCpuMetrics, usage: 45.2 } }
  ],
  startTime: '2026-04-16T14:30:00.000Z',
  endTime: '2026-04-16T14:30:20.000Z',
  durationMs: 20000,
  averageCpuUsage: 46.52,
  maxCpuUsage: 51.7,
  minCpuUsage: 42.1,
  averageMemoryPercentage: 51.2,
  maxMemoryPercentage: 51.2,
  minMemoryPercentage: 51.2
};

/**
 * Mock metrics history - Single snapshot
 */
export const mockMetricsHistorySingle: MetricsHistory = {
  snapshots: [mockSystemMetrics],
  startTime: BASE_TIMESTAMP,
  endTime: BASE_TIMESTAMP,
  durationMs: 0,
  averageCpuUsage: 45.2,
  maxCpuUsage: 45.2,
  minCpuUsage: 45.2,
  averageMemoryPercentage: 51.2,
  maxMemoryPercentage: 51.2,
  minMemoryPercentage: 51.2
};

/**
 * Generate multiple snapshots with varying CPU values
 *
 * @param count Number of snapshots to generate
 * @param baseMetrics Base metrics to use
 * @param variation Range of CPU usage variation
 */
export function generateMockSnapshots(
  count: number,
  baseMetrics: SystemMetrics = mockSystemMetrics,
  variation: number = 10
): SystemMetrics[] {
  const snapshots: SystemMetrics[] = [];
  const baseCpuUsage = baseMetrics.cpu.usage;

  for (let i = 0; i < count; i++) {
    const cpuUsage = Math.max(
      0,
      Math.min(100, baseCpuUsage + (Math.random() - 0.5) * 2 * variation)
    );

    const timestamp = new Date(
      new Date(BASE_TIMESTAMP).getTime() + i * 1000
    ).toISOString();

    snapshots.push({
      ...baseMetrics,
      timestamp,
      cpu: {
        ...baseMetrics.cpu,
        usage: cpuUsage,
        activeCores: Math.floor((cpuUsage / 100) * baseMetrics.cpu.cores)
      }
    });
  }

  return snapshots;
}

/**
 * Generate mock metrics history with calculated statistics
 *
 * @param count Number of snapshots to generate
 */
export function generateMockMetricsHistory(
  count: number
): MetricsHistory {
  const snapshots = generateMockSnapshots(count);
  const cpuValues = snapshots.map(s => s.cpu.usage);
  const memoryValues = snapshots.map(s => s.memory.percentage);

  return {
    snapshots,
    startTime: snapshots[0].timestamp,
    endTime: snapshots[snapshots.length - 1].timestamp,
    durationMs: (snapshots.length - 1) * 1000,
    averageCpuUsage: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
    maxCpuUsage: Math.max(...cpuValues),
    minCpuUsage: Math.min(...cpuValues),
    averageMemoryPercentage: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
    maxMemoryPercentage: Math.max(...memoryValues),
    minMemoryPercentage: Math.min(...memoryValues)
  };
}

/**
 * Mock invalid/edge case data for security testing
 */
export const mockMaliciousPaths = [
  '../etc/passwd',
  '..\\windows\\system32\\config',
  'C:\\windows\\system32\\..\\..\\evil.txt',
  '../../../etc/shadow',
  '....//....//etc/passwd',
  '../%2e%2e/etc/passwd',
  '..%2f..%2fetc/passwd',
  'C:\\CON\\test.json',
  'C:\\PRN\\test.json',
  'test\0.json',
  'test\n.json',
  'test\r.json'
];

/**
 * Mock invalid input data
 */
export const mockInvalidInputs = {
  negativeCpuUsage: -5.5,
  over100CpuUsage: 150.0,
  negativeMemory: -1000,
  negativeSampleCount: -1,
  zeroSampleCount: 0,
  veryLargeSampleCount: 999999,
  zeroInterval: 0,
  negativeInterval: -100,
  nullPath: null as unknown as string,
  emptyPath: '',
  whitespacePath: '   ',
  invalidFormat: 'xml' as unknown as 'json' | 'csv' | 'html'
};

/**
 * Mock export options
 */
export const mockExportOptionsJson = {
  outputPath: '/tmp/test-output.json',
  format: 'json' as const,
  append: false
};

export const mockExportOptionsCsv = {
  outputPath: '/tmp/test-output.csv',
  format: 'csv' as const,
  append: false
};

export const mockExportOptionsHtml = {
  outputPath: '/tmp/test-output.html',
  format: 'html' as const,
  append: false
};

export const mockExportOptionsWithSamples = {
  outputPath: '/tmp/test-output.json',
  format: 'json' as const,
  samples: 10,
  interval: 1000,
  append: false
};
