/**
 * Project Sentinel - Metrics Collector Service Tests
 *
 * Unit tests for the MetricsCollector service.
 * Tests metric collection, bounds checking, and security constraints.
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// Mock systeminformation module
jest.mock('systeminformation', () => {
  const mockSi = {
    cpuUsage: jest.fn(),
    currentLoad: jest.fn(),
    cpu: jest.fn(),
    mem: jest.fn(),
    swap: jest.fn(),
    osInfo: jest.fn()
  };
  return mockSi;
});

import si from 'systeminformation';
import { MetricsCollector } from '../../../src/services/metrics-collector.js';
import {
  mockCpuMetrics,
  mockMemoryMetrics,
  mockHostInfoLinux,
  mockSystemMetrics
} from '../../mocks/metrics-mock.js';
import { DEFAULT_SECURITY_CONSTRAINTS } from '../../../src/models/metrics.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  // Mock data for systeminformation
  const mockCpuUsageData = 45.2;
  const mockCurrentLoadData = {
    currentLoadUser: 22.5,
    currentLoadSystem: 5.0,
    avgLoad: [27.5, 25.0, 20.0]
  };
  const mockCpuInfoData = {
    cores: 8,
    speed: 2400,
    speedMax: 3800,
    temperature: 65.5
  };
  const mockMemData = {
    total: 17179869184,
    used: 8589934592,
    free: 6291456000,
    available: 7516192768
  };
  const mockSwapData = {
    total: 4294967296,
    used: 536870912,
    free: 3758096384
  };
  const mockOsInfoData = {
    uptime: 617542,
    hostname: 'test-workstation',
    platform: 'linux' as const,
    version: '5.15.0-generic',
    arch: 'x64'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collector = new MetricsCollector();

    // Set up default mock implementations
    (si.cpuUsage as jest.Mock).mockResolvedValue(mockCpuUsageData);
    (si.currentLoad as jest.Mock).mockResolvedValue(mockCurrentLoadData);
    (si.cpu as jest.Mock).mockResolvedValue(mockCpuInfoData);
    (si.mem as jest.Mock).mockResolvedValue(mockMemData);
    (si.swap as jest.Mock).mockResolvedValue(mockSwapData);
    (si.osInfo as jest.Mock).mockResolvedValue(mockOsInfoData);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(collector).toBeInstanceOf(MetricsCollector);
    });

    it('should not pre-warm CPU on construction (async, non-blocking)', () => {
      // The constructor calls initializeCpu() with void, so it runs in background
      // We just verify the instance was created
      expect(collector).toBeDefined();
    });
  });

  describe('collect()', () => {
    it('should return a valid SystemMetrics object', async () => {
      const result = await collector.collect();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('host');
    });

    it('should have valid timestamp in ISO 8601 format', async () => {
      const result = await collector.collect();

      expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should call all required systeminformation methods', async () => {
      await collector.collect();

      expect(si.cpuUsage).toHaveBeenCalled();
      expect(si.currentLoad).toHaveBeenCalled();
      expect(si.cpu).toHaveBeenCalled();
      expect(si.mem).toHaveBeenCalled();
      expect(si.swap).toHaveBeenCalled();
      expect(si.osInfo).toHaveBeenCalled();
    });
  });

  describe('CPU metrics collection', () => {
    it('should collect CPU usage correctly', async () => {
      const result = await collector.collect();

      expect(result.cpu.usage).toBe(mockCpuUsageData);
    });

    it('should collect CPU core count', async () => {
      const result = await collector.collect();

      expect(result.cpu.cores).toBe(mockCpuInfoData.cores);
    });

    it('should calculate active cores based on usage', async () => {
      const result = await collector.collect();

      // Active cores should be proportional to usage
      const expectedActive = Math.floor((mockCpuUsageData / 100) * mockCpuInfoData.cores);
      expect(result.cpu.activeCores).toBeLessThanOrEqual(expectedActive + 1); // Allow rounding
    });

    it('should collect CPU frequency', async () => {
      const result = await collector.collect();

      expect(result.cpu.frequency).toBe(mockCpuInfoData.speed);
      expect(result.cpu.maxFrequency).toBe(mockCpuInfoData.speedMax);
    });

    it('should handle missing temperature gracefully', async () => {
      (si.cpu as jest.Mock).mockResolvedValue({
        cores: 4,
        speed: 2000,
        speedMax: 3000
        // No temperature
      });

      const result = await collector.collect();

      expect(result.cpu.temperature).toBeUndefined();
    });

    it('should bound CPU usage to 0-100 range', async () => {
      // Test with negative value
      (si.cpuUsage as jest.Mock).mockResolvedValue(-10);

      const negativeResult = await collector.collect();
      expect(negativeResult.cpu.usage).toBe(0);

      // Test with over 100
      (si.cpuUsage as jest.Mock).mockResolvedValue(150);

      const overResult = await collector.collect();
      expect(overResult.cpu.usage).toBe(100);
    });

    it('should handle NaN CPU usage safely', async () => {
      (si.cpuUsage as jest.Mock).mockResolvedValue(NaN);

      const result = await collector.collect();
      expect(result.cpu.usage).toBe(0);
    });

    it('should bound CPU temperature to valid range', async () => {
      // Test with extreme temperature
      (si.cpu as jest.Mock).mockResolvedValue({
        ...mockCpuInfoData,
        temperature: 250 // Above max
      });

      const result = await collector.collect();
      expect(result.cpu.temperature).toBeLessThanOrEqual(200);

      // Test with negative temperature
      (si.cpu as jest.Mock).mockResolvedValue({
        ...mockCpuInfoData,
        temperature: -100 // Below min
      });

      const negativeResult = await collector.collect();
      expect(negativeResult.cpu.temperature).toBeGreaterThanOrEqual(-50);
    });
  });

  describe('Memory metrics collection', () => {
    it('should collect total memory', async () => {
      const result = await collector.collect();

      expect(result.memory.total).toBe(mockMemData.total);
    });

    it('should collect used memory', async () => {
      const result = await collector.collect();

      expect(result.memory.used).toBe(mockMemData.used);
    });

    it('should collect free memory', async () => {
      const result = await collector.collect();

      expect(result.memory.free).toBe(mockMemData.free);
    });

    it('should calculate memory percentage correctly', async () => {
      const result = await collector.collect();

      const expectedPercentage = (mockMemData.used / mockMemData.total) * 100;
      expect(result.memory.percentage).toBeCloseTo(expectedPercentage, 1);
    });

    it('should collect swap information', async () => {
      const result = await collector.collect();

      expect(result.memory.swapTotal).toBe(mockSwapData.total);
      expect(result.memory.swapUsed).toBe(mockSwapData.used);
      expect(result.memory.swapFree).toBe(mockSwapData.free);
    });

    it('should handle missing available memory', async () => {
      (si.mem as jest.Mock).mockResolvedValue({
        ...mockMemData,
        available: undefined
      });

      const result = await collector.collect();

      // Should fallback to free when available is undefined
      expect(result.memory.available).toBe(mockMemData.free);
    });

    it('should handle negative memory values safely', async () => {
      (si.mem as jest.Mock).mockResolvedValue({
        total: -1000,
        used: -500,
        free: -200
      });

      const result = await collector.collect();

      expect(result.memory.total).toBeGreaterThanOrEqual(0);
      expect(result.memory.used).toBeGreaterThanOrEqual(0);
      expect(result.memory.free).toBeGreaterThanOrEqual(0);
    });

    it('should ensure used memory never exceeds total', async () => {
      (si.mem as jest.Mock).mockResolvedValue({
        total: 1000,
        used: 2000, // More than total
        free: 100
      });

      const result = await collector.collect();

      expect(result.memory.used).toBeLessThanOrEqual(result.memory.total);
    });
  });

  describe('Host information collection', () => {
    it('should collect uptime', async () => {
      const result = await collector.collect();

      expect(result.host.uptime).toBe(mockOsInfoData.uptime);
    });

    it('should collect hostname', async () => {
      const result = await collector.collect();

      expect(result.host.hostname).toBe(mockOsInfoData.hostname);
    });

    it('should collect platform', async () => {
      const result = await collector.collect();

      expect(result.host.platform).toBe('linux');
    });

    it('should collect OS release/version', async () => {
      const result = await collector.collect();

      expect(result.host.release).toBe(mockOsInfoData.version);
    });

    it('should collect architecture', async () => {
      const result = await collector.collect();

      expect(result.host.arch).toBe(mockOsInfoData.arch);
    });

    it('should collect Node.js version', async () => {
      const result = await collector.collect();

      expect(result.host.nodeVersion).toBe(process.version);
    });

    it('should validate platform against whitelist', async () => {
      (si.osInfo as jest.Mock).mockResolvedValue({
        ...mockOsInfoData,
        platform: 'freebsd' // Not in whitelist
      });

      const result = await collector.collect();

      // Should fallback to 'linux' for unknown platforms
      expect(result.host.platform).toBe('linux');
    });

    it('should sanitize hostname (remove null bytes)', async () => {
      (si.osInfo as jest.Mock).mockResolvedValue({
        ...mockOsInfoData,
        hostname: 'malicious\x00hostname'
      });

      const result = await collector.collect();

      expect(result.host.hostname).not.toContain('\0');
    });

    it('should truncate long hostnames', async () => {
      (si.osInfo as jest.Mock).mockResolvedValue({
        ...mockOsInfoData,
        hostname: 'a'.repeat(300)
      });

      const result = await collector.collect();

      expect(result.host.hostname.length).toBeLessThanOrEqual(255);
    });
  });

  describe('collectSamples()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should collect specified number of samples', async () => {
      const sampleCount = 5;
      const interval = 100;

      const result = await collector.collectSamples(sampleCount, interval);

      expect(result.snapshots.length).toBe(sampleCount);
    });

    it('should throw error for zero sample count', async () => {
      await expect(collector.collectSamples(0, 100))
        .rejects
        .toThrow('Sample count must be a positive number');
    });

    it('should throw error for negative sample count', async () => {
      await expect(collector.collectSamples(-5, 100))
        .rejects
        .toThrow('Sample count must be a positive number');
    });

    it('should throw error for excessive sample count', async () => {
      await expect(collector.collectSamples(DEFAULT_SECURITY_CONSTRAINTS.maxSamples + 1, 100))
        .rejects
        .toThrow('exceeds maximum allowed');
    });

    it('should throw error for invalid interval', async () => {
      await expect(collector.collectSamples(5, 0))
        .rejects
        .toThrow('Interval must be between 1 and 300000');
    });

    it('should throw error for excessive interval', async () => {
      await expect(collector.collectSamples(5, 300001))
        .rejects
        .toThrow('Interval must be between 1 and 300000');
    });

    it('should calculate correct statistics', async () => {
      const sampleCount = 3;
      const interval = 100;

      const result = await collector.collectSamples(sampleCount, interval);

      expect(result.snapshots.length).toBe(sampleCount);
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.averageCpuUsage).toBeDefined();
      expect(result.maxCpuUsage).toBeGreaterThanOrEqual(result.minCpuUsage);
      expect(result.averageMemoryPercentage).toBeDefined();
      expect(result.maxMemoryPercentage).toBeGreaterThanOrEqual(result.minMemoryPercentage);
    });

    it('should calculate durationMs correctly', async () => {
      const sampleCount = 3;
      const interval = 100;

      const result = await collector.collectSamples(sampleCount, interval);

      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('should have increasing timestamps in snapshots', async () => {
      const sampleCount = 5;
      const interval = 100;

      const result = await collector.collectSamples(sampleCount, interval);

      for (let i = 1; i < result.snapshots.length; i++) {
        expect(result.snapshots[i].timestamp)
          .toBeGreaterThanOrEqual(result.snapshots[i - 1].timestamp);
      }
    });

    it('should wait between samples', async () => {
      const sampleCount = 3;
      const interval = 100;

      const start = Date.now();
      await collector.collectSamples(sampleCount, interval);
      const end = Date.now();

      // With fake timers, we check that timers were scheduled
      expect(si.cpuUsage).toHaveBeenCalledTimes(sampleCount);
    });
  });

  describe('getHostInfo()', () => {
    it('should return cached host info on second call', async () => {
      // First call caches
      const firstResult = await collector.getHostInfo();

      // Change mock data
      (si.osInfo as jest.Mock).mockResolvedValue({
        ...mockOsInfoData,
        hostname: 'modified-hostname'
      });

      // Second call should return cached value
      const secondResult = await collector.getHostInfo();

      expect(secondResult.hostname).toBe(firstResult.hostname);
      expect(secondResult.hostname).toBe('test-workstation');
    });

    it('should cache host info correctly', async () => {
      await collector.getHostInfo();

      expect(si.osInfo).toHaveBeenCalledTimes(1);

      await collector.getHostInfo();

      // Should still be 1 because of caching
      expect(si.osInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache()', () => {
    it('should clear cached host info', async () => {
      await collector.getHostInfo();

      collector.clearCache();

      const hostInfo = await collector.getHostInfo();

      // Should call osInfo again after cache clear
      expect(si.osInfo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle CPU collection errors gracefully', async () => {
      (si.cpuUsage as jest.Mock).mockRejectedValue(new Error('CPU error'));

      const result = await collector.collect();

      // Should return safe defaults
      expect(result.cpu).toBeDefined();
      expect(result.cpu.usage).toBe(0);
    });

    it('should handle memory collection errors gracefully', async () => {
      (si.mem as jest.Mock).mockRejectedValue(new Error('Memory error'));

      const result = await collector.collect();

      // Should return safe defaults
      expect(result.memory).toBeDefined();
      expect(result.memory.total).toBe(0);
    });

    it('should handle host info collection errors gracefully', async () => {
      (si.osInfo as jest.Mock).mockRejectedValue(new Error('OS info error'));

      const result = await collector.collect();

      // Should return safe defaults
      expect(result.host).toBeDefined();
      expect(result.host.hostname).toBe('unknown');
    });

    it('should collect metrics in parallel', async () => {
      await collector.collect();

      // All methods should be called (not sequentially)
      expect(si.cpuUsage).toHaveBeenCalled();
      expect(si.currentLoad).toHaveBeenCalled();
      expect(si.cpu).toHaveBeenCalled();
      expect(si.mem).toHaveBeenCalled();
      expect(si.swap).toHaveBeenCalled();
      expect(si.osInfo).toHaveBeenCalled();
    });
  });

  describe('Security constraints', () => {
    it('should enforce maximum sample limit', async () => {
      const maxSamples = DEFAULT_SECURITY_CONSTRAINTS.maxSamples;

      await expect(collector.collectSamples(maxSamples + 1, 100))
        .rejects
        .toThrow();
    });

    it('should bound all percentage values to 0-100', async () => {
      // Test CPU percentage bounding
      (si.cpuUsage as jest.Mock).mockResolvedValue(-50);
      let result = await collector.collect();
      expect(result.cpu.usage).toBe(0);

      (si.cpuUsage as jest.Mock).mockResolvedValue(150);
      result = await collector.collect();
      expect(result.cpu.usage).toBe(100);

      // Test memory percentage bounding
      (si.mem as jest.Mock).mockResolvedValue({
        total: 100,
        used: 150, // More than total
        free: 0,
        available: 0
      });
      result = await collector.collect();
      expect(result.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should sanitize hostnames', async () => {
      (si.osInfo as jest.Mock).mockResolvedValue({
        ...mockOsInfoData,
        hostname: 'test\x00\x1f\x7fhost' // Contains control characters
      });

      const result = await collector.collect();

      expect(result.host.hostname).not.toContain('\0');
      expect(result.host.hostname).not.toContain('\x1f');
      expect(result.host.hostname).not.toContain('\x7f');
    });

    it('should validate platform against whitelist', async () => {
      const invalidPlatforms = ['freebsd', 'sunos', 'aix', null, undefined];

      for (const platform of invalidPlatforms) {
        (si.osInfo as jest.Mock).mockResolvedValue({
          ...mockOsInfoData,
          platform: platform as any
        });

        const result = await collector.collect();
        expect(['win32', 'darwin', 'linux']).toContain(result.host.platform);
      }
    });
  });
});
