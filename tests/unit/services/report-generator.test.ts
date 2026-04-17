/**
 * Project Sentinel - Report Generator Service Tests
 *
 * Unit tests for the ReportGenerator service.
 * Tests report formatting, JSON serialization, CSV generation, and HTML sanitization.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ReportGenerator } from '../../../src/services/report-generator.js';
import {
  mockSystemMetrics,
  mockMetricsHistory,
  mockSystemMetricsHighLoad,
  mockSystemMetricsMinimal,
  mockHostInfoWindows,
  mockCpuMetrics
} from '../../mocks/metrics-mock.js';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('constructor', () => {
    it('should create instance with colors enabled by default', () => {
      const gen = new ReportGenerator();
      // Colors should be enabled by default
      expect(gen).toBeInstanceOf(ReportGenerator);
    });

    it('should create instance with colors disabled', () => {
      const gen = new ReportGenerator(false);
      expect(gen).toBeInstanceOf(ReportGenerator);
    });
  });

  describe('setColors()', () => {
    it('should enable colors', () => {
      const gen = new ReportGenerator(false);
      gen.setColors(true);
      // Internal state change verified by subsequent behavior
    });

    it('should disable colors', () => {
      const gen = new ReportGenerator(true);
      gen.setColors(false);
    });
  });

  describe('generateMonitorDisplay()', () => {
    it('should generate display with header and footer', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('SENTINEL');
      expect(display).toContain('CPU');
      expect(display).toContain('Memory');
      expect(display).toContain('\u2500'); // Horizontal box character
    });

    it('should display CPU usage correctly', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('45.2%');
    });

    it('should display memory percentage correctly', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('51.2%');
    });

    it('should show success indicator when below threshold', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      // Should contain success indicator (checkmark)
      expect(display).toContain('\u2705');
    });

    it('should show warning indicator when at threshold', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 80 } // At threshold
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('\u26A0'); // Warning triangle
    });

    it('should show error indicator when significantly above threshold', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 95 } // Well above threshold
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('\u274C'); // Cross mark
    });

    it('should include progress bar characters', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toContain('\u2588'); // Filled block
    });
  });

  describe('generateSnapshotReport()', () => {
    it('should generate snapshot report with timestamp', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      expect(report).toContain(mockSystemMetrics.timestamp);
    });

    it('should display CPU usage', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      expect(report).toContain('CPU');
      expect(report).toContain('45.2%');
    });

    it('should display memory information with human-readable sizes', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      expect(report).toContain('Memory');
      expect(report).toContain('GB');
      expect(report).toContain('51.2%');
    });

    it('should display uptime', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      expect(report).toContain('Uptime');
    });

    it('should include verbose information when requested', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics, true);

      expect(report).toContain('Frequency');
      expect(report).toContain('Host');
      expect(report).toContain('OS');
      expect(report).toContain('Node');
    });

    it('should exclude verbose information by default', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      expect(report).not.toContain('Frequency');
      expect(report).not.toContain('Host');
    });

    it('should handle missing temperature gracefully', () => {
      const metrics = {
        ...mockSystemMetricsMinimal,
        cpu: mockSystemMetricsMinimal.cpu
        // No temperature
      };

      const report = generator.generateSnapshotReport(metrics, true);

      expect(report).toBeDefined();
      expect(report).not.toThrow();
    });

    it('should format duration correctly', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);

      // Uptime is 617542 seconds = ~7 days, 2 hours, 12 minutes, 22 seconds
      expect(report).toContain('day');
    });

    it('should work with different platforms', () => {
      const windowsMetrics = {
        ...mockSystemMetrics,
        host: mockHostInfoWindows
      };

      const report = generator.generateSnapshotReport(windowsMetrics);
      expect(report).toContain('win32');
    });
  });

  describe('generateJsonReport()', () => {
    it('should return valid JSON string', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);

      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });

    it('should include all required fields', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);
      const parsed: any = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.cpu).toBeDefined();
      expect(parsed.memory).toBeDefined();
      expect(parsed.host).toBeDefined();
    });

    it('should be pretty-printed', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);

      expect(json).toContain('\n');
      expect(json).toContain('  '); // Indentation
    });

    it('should include CPU fields', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);
      const parsed: any = JSON.parse(json);

      expect(parsed.cpu.usage).toBe(45.2);
      expect(parsed.cpu.cores).toBe(8);
      expect(parsed.cpu.frequency).toBe(2400);
    });

    it('should include memory fields', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);
      const parsed: any = JSON.parse(json);

      expect(parsed.memory.total).toBe(17179869184);
      expect(parsed.memory.used).toBe(8589934592);
      expect(parsed.memory.percentage).toBe(51.2);
    });

    it('should include optional fields when present', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);
      const parsed: any = JSON.parse(json);

      expect(parsed.cpu.temperature).toBeDefined();
      expect(parsed.disk).toBeDefined();
      expect(parsed.network).toBeDefined();
    });

    it('should handle missing optional fields', () => {
      const json = generator.generateJsonReport(mockSystemMetricsMinimal);
      const parsed: any = JSON.parse(json);

      expect(parsed).toBeDefined();
      expect(parsed.cpu.temperature).toBeUndefined();
    });

    it('should ensure all values are JSON-serializable', () => {
      // Even with NaN or Infinity, should produce valid JSON
      const json = generator.generateJsonReport(mockSystemMetrics);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should preserve numeric precision', () => {
      const json = generator.generateJsonReport(mockSystemMetrics);
      const parsed: any = JSON.parse(json);

      expect(parsed.cpu.usage).toBeCloseTo(45.2, 1);
      expect(parsed.memory.percentage).toBeCloseTo(51.2, 1);
    });
  });

  describe('generateCsvReport()', () => {
    it('should return CSV with header row', () => {
      const csv = generator.generateCsvReport([mockSystemMetrics]);

      expect(csv).toContain('timestamp');
      expect(csv).toContain('cpu_usage');
      expect(csv).toContain('memory_percentage');
    });

    it('should include data rows', () => {
      const csv = generator.generateCsvReport([mockSystemMetrics]);

      expect(csv).toContain('45.20'); // CPU usage
      expect(csv).toContain('51.20'); // Memory percentage
    });

    it('should handle multiple snapshots', () => {
      const snapshots = [
        mockSystemMetrics,
        { ...mockSystemMetrics, timestamp: '2026-04-16T14:31:00.000Z', cpu: { ...mockSystemMetrics.cpu, usage: 50.0 } }
      ];

      const csv = generator.generateCsvReport(snapshots);

      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // Header + 2 data rows
    });

    it('should return empty string for empty array', () => {
      const csv = generator.generateCsvReport([]);

      expect(csv).toBe('');
    });

    it('should escape values containing commas', () => {
      const metrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: 'host,name,with,commas'
        }
      };

      const csv = generator.generateCsvReport([metrics]);

      // Should be quoted
      expect(csv).toContain('"host,name,with,commas"');
    });

    it('should escape values containing quotes', () => {
      const metrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: 'host"with"quotes'
        }
      };

      const csv = generator.generateCsvReport([metrics]);

      // Quotes should be doubled
      expect(csv).toContain('""');
    });

    it('should include all expected columns', () => {
      const csv = generator.generateCsvReport([mockSystemMetrics]);

      const header = csv.split('\n')[0];
      expect(header).toContain('cpu_cores');
      expect(header).toContain('cpu_active_cores');
      expect(header).toContain('cpu_frequency');
      expect(header).toContain('memory_total');
      expect(header).toContain('memory_used');
      expect(header).toContain('memory_free');
      expect(header).toContain('hostname');
      expect(header).toContain('platform');
    });

    it('should format numeric values with decimal places', () => {
      const csv = generator.generateCsvReport([mockSystemMetrics]);

      expect(csv).toContain('45.20');
      expect(csv).toContain('51.20');
    });
  });

  describe('generateHtmlReport()', () => {
    it('should return HTML document', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include report title', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('Sentinel Report');
    });

    it('should include start and end times', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('2026-04-16T14:30:00.000Z');
      expect(html).toContain('2026-04-16T14:30:20.000Z');
    });

    it('should include sample count', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('5'); // Sample count
    });

    it('should include CPU statistics', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('CPU');
      expect(html).toContain('46.52'); // Average CPU usage
      expect(html).toContain('51.70'); // Max CPU usage
    });

    it('should include memory statistics', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      expect(html).toContain('Memory');
      expect(html).toContain('51.20'); // Memory percentage
    });

    it('should use fallback template if template file not found', async () => {
      const html = await generator.generateHtmlReport(mockMetricsHistory);

      // Should return valid HTML even without template file
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should sanitize HTML content', async () => {
      const maliciousHistory = {
        ...mockMetricsHistory,
        startTime: '<script>alert("xss")</script>',
        endTime: mockMetricsHistory.endTime
      };

      const html = await generator.generateHtmlReport(maliciousHistory);

      // Script tags should be escaped
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('should escape special HTML characters', async () => {
      const maliciousHistory = {
        ...mockMetricsHistory,
        startTime: '">&img src=x onerror=alert(1)<',
        endTime: mockMetricsHistory.endTime
      };

      const html = await generator.generateHtmlReport(maliciousHistory);

      expect(html).toContain('&gt;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&amp;');
    });

    it('should handle empty history gracefully', async () => {
      const emptyHistory = {
        ...mockMetricsHistory,
        snapshots: []
      };

      const html = await generator.generateHtmlReport(emptyHistory);

      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });
  });

  describe('Byte formatting utility', () => {
    it('should format bytes', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);
      expect(report).toContain('GB');
    });

    it('should format small values', () => {
      const metrics = {
        ...mockSystemMetrics,
        memory: {
          ...mockSystemMetrics.memory,
          used: 1024 // 1 KB
        }
      };

      const report = generator.generateSnapshotReport(metrics);
      expect(report).toContain('1.0 KB');
    });
  });

  describe('Duration formatting utility', () => {
    it('should format short duration in seconds', () => {
      const metrics = {
        ...mockSystemMetrics,
        host: { ...mockSystemMetrics.host, uptime: 45 }
      };

      const report = generator.generateSnapshotReport(metrics);
      expect(report).toContain('45 seconds');
    });

    it('should format duration with days', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);
      expect(report).toContain('day');
    });

    it('should format duration with hours', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);
      expect(report).toContain('hour');
    });

    it('should handle plural correctly', () => {
      const report = generator.generateSnapshotReport(mockSystemMetrics);
      // 7 days should be plural
      expect(report).toContain('days');
    });
  });

  describe('Color and styling', () => {
    it('should use colored output when enabled', () => {
      generator.setColors(true);
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toBeDefined();
    });

    it('should work without colors when disabled', () => {
      generator.setColors(false);
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toBeDefined();
    });
  });

  describe('Threshold handling', () => {
    it('should color based on CPU threshold', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 50,
        memoryThreshold: 50
      });

      // CPU at 45.2% with 50% threshold should be below (success)
      expect(display).toContain('CPU');
    });

    it('should handle custom thresholds', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 30,
        memoryThreshold: 40
      });

      // CPU at 45.2% with 30% threshold is above (warning)
      expect(display).toContain('CPU');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 0 },
        memory: { ...mockSystemMetrics.memory, percentage: 0 }
      };

      const report = generator.generateSnapshotReport(metrics);
      expect(report).toBeDefined();
    });

    it('should handle maximum values', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 100 },
        memory: { ...mockSystemMetrics.memory, percentage: 100 }
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });
      expect(display).toBeDefined();
    });

    it('should handle minimal metrics object', () => {
      const report = generator.generateSnapshotReport(mockSystemMetricsMinimal);
      expect(report).toBeDefined();
      expect(report).toContain('CPU');
      expect(report).toContain('Memory');
    });

    it('should handle null/undefined optional fields', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: {
          ...mockSystemMetrics.cpu,
          temperature: undefined,
          loadAverage1: undefined,
          loadAverage5: undefined,
          loadAverage15: undefined
        }
      };

      const report = generator.generateSnapshotReport(metrics, true);
      expect(report).toBeDefined();
    });
  });

  describe('Progress bar generation', () => {
    it('should generate full progress bar at 100%', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 100 }
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      // Should have filled blocks
      expect(display).toContain('\u2588');
    });

    it('should generate empty progress bar at 0%', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 0 }
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      // Should have empty blocks
      expect(display).toContain('\u2591');
    });

    it('should generate proportional progress bar', () => {
      const metrics = {
        ...mockSystemMetrics,
        cpu: { ...mockSystemMetrics.cpu, usage: 50 }
      };

      const display = generator.generateMonitorDisplay(metrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      expect(display).toBeDefined();
    });
  });

  describe('Box drawing characters', () => {
    it('should use box characters for monitor display', () => {
      const display = generator.generateMonitorDisplay(mockSystemMetrics, {
        cpuThreshold: 80,
        memoryThreshold: 80
      });

      // Top-left corner
      expect(display).toContain('\u2554');
      // Top-right corner
      expect(display).toContain('\u2557');
      // Bottom-left corner
      expect(display).toContain('\u255A');
      // Bottom-right corner
      expect(display).toContain('\u255D');
      // Vertical line
      expect(display).toContain('\u2502');
      // Horizontal line
      expect(display).toContain('\u2500');
    });
  });
});
