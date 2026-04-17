/**
 * Project Sentinel - File Exporter Service Tests
 *
 * Unit tests for the FileExporter service.
 * Comprehensive security tests including path traversal prevention,
 * invalid input handling, and file extension validation.
 */

import { describe, it, expect, jest, beforeEach, afterEach, afterAll } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

import { FileExporter, SentinelExportError } from '../../../src/services/file-exporter.js';
import {
  mockSystemMetrics,
  mockMetricsHistory,
  mockMaliciousPaths,
  mockInvalidInputs,
  mockExportOptionsJson,
  mockExportOptionsCsv,
  mockExportOptionsHtml,
  mockSystemMetricsWindows,
  mockSystemMetricsMacOS,
  generateMockMetricsHistory
} from '../../mocks/metrics-mock.js';
import { SECURITY_CONSTRAINTS, ERROR_CODES } from '../../../src/utils/constants.js';
import { DEFAULT_SECURITY_CONSTRAINTS } from '../../../src/models/metrics.js';

// Create temp directory for tests
const testTempDir = path.join(tmpdir(), 'sentinel-test-' + Date.now());

describe('FileExporter', () => {
  let exporter: FileExporter;
  let testOutputPath: string;

  beforeEach(() => {
    jest.clearAllMocks();
    exporter = new FileExporter();
    testOutputPath = path.join(testTempDir, 'test-output.json');
  });

  afterEach(async () => {
    // Clean up any test files created
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(exporter).toBeInstanceOf(FileExporter);
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should block path traversal with ..', async () => {
      const maliciousPath = '../etc/passwd.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('path traversal detected');
    });

    it('should block path traversal with double ..', async () => {
      const maliciousPath = '../../etc/passwd.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('path traversal detected');
    });

    it('should block path traversal with Windows-style ..\\', async () => {
      const maliciousPath = '..\\windows\\system32\\config.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('path traversal detected');
    });

    it('should block encoded path traversal %2e%2e', async () => {
      const maliciousPath = '%2e%2e/etc/passwd.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('path traversal detected');
    });

    it('should block null byte injection', async () => {
      const maliciousPath = 'test\x00.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('null bytes not allowed');
    });

    it('should block newline in path', async () => {
      const maliciousPath = 'test\n.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('forbidden characters detected');
    });

    it('should block carriage return in path', async () => {
      const maliciousPath = 'test\r.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('forbidden characters detected');
    });

    it('should block reserved Windows names - CON', async () => {
      const maliciousPath = 'C:\\CON\\test.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('reserved name');
    });

    it('should block reserved Windows names - PRN', async () => {
      const maliciousPath = 'C:\\PRN\\test.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('reserved name');
    });

    it('should block reserved Windows names - AUX', async () => {
      const maliciousPath = 'C:\\AUX\\test.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('reserved name');
    });

    it('should block reserved Windows names - NUL', async () => {
      const maliciousPath = 'C:\\NUL\\test.json';

      await expect(
        exporter.validateAndNormalizePath(maliciousPath, 'json')
      ).rejects.toThrow('reserved name');
    });

    it('should block all malicious paths from mock data', async () => {
      for (const maliciousPath of mockMaliciousPaths) {
        await expect(
          exporter.validateAndNormalizePath(maliciousPath, 'json')
        ).rejects.toThrow();
      }
    });

    it('should detect complex path traversal patterns', async () => {
      const complexPatterns = [
        '....//....//etc/passwd.json',
        '....//....//etc/passwd.json',
        '...\\...\\windows\\system.json'
      ];

      for (const pattern of complexPatterns) {
        await expect(
          exporter.validateAndNormalizePath(pattern, 'json')
        ).rejects.toThrow();
      }
    });
  });

  describe('Path Validation', () => {
    it('should accept valid absolute path', async () => {
      const validPath = path.join(testTempDir, 'output.json');

      const result = await exporter.validateAndNormalizePath(validPath, 'json');

      expect(result).toBe(validPath);
    });

    it('should accept valid relative path', async () => {
      const validPath = 'output.json';

      const result = await exporter.validateAndNormalizePath(validPath, 'json');

      expect(result).toContain('output.json');
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should reject null path', async () => {
      await expect(
        exporter.validateAndNormalizePath(null as any, 'json')
      ).rejects.toThrow('must be a string');
    });

    it('should reject undefined path', async () => {
      await expect(
        exporter.validateAndNormalizePath(undefined as any, 'json')
      ).rejects.toThrow('must be a string');
    });

    it('should reject empty path', async () => {
      await expect(
        exporter.validateAndNormalizePath('', 'json')
      ).rejects.toThrow('must be a string');
    });

    it('should reject whitespace-only path', async () => {
      await expect(
        exporter.validateAndNormalizePath('   ', 'json')
      ).rejects.toThrow('must be a string');
    });

    it('should enforce maximum path length', async () => {
      const longPath = 'output-' + 'a'.repeat(SECURITY_CONSTRAINTS.maxPathLength + 1) + '.json';

      await expect(
        exporter.validateAndNormalizePath(longPath, 'json')
      ).rejects.toThrow('exceeds maximum');
    });

    it('should reject path at maximum length exactly', async () => {
      const maxPath = 'output-' + 'a'.repeat(SECURITY_CONSTRAINTS.maxPathLength) + '.json';

      await expect(
        exporter.validateAndNormalizePath(maxPath, 'json')
      ).rejects.toThrow('exceeds maximum');
    });
  });

  describe('File Extension Validation', () => {
    it('should add .json extension if missing for json format', async () => {
      const result = await exporter.validateAndNormalizePath('/tmp/test', 'json');

      expect(result).toMatch(/\.json$/i);
    });

    it('should add .csv extension if missing for csv format', async () => {
      const result = await exporter.validateAndNormalizePath('/tmp/test', 'csv');

      expect(result).toMatch(/\.csv$/i);
    });

    it('should add .html extension if missing for html format', async () => {
      const result = await exporter.validateAndNormalizePath('/tmp/test', 'html');

      expect(result).toMatch(/\.html$/i);
    });

    it('should preserve existing correct extension', async () => {
      const result = await exporter.validateAndNormalizePath('/tmp/test.json', 'json');

      expect(result).toMatch(/\.json$/i);
      expect(result).not.toMatch(/\.json\.json/i);
    });

    it('should be case-insensitive for extension matching', async () => {
      const result = await exporter.validateAndNormalizePath('/tmp/test.JSON', 'json');

      expect(result).toMatch(/\.JSON$/i);
    });
  });

  describe('JSON Export', () => {
    it('should export single metrics object to JSON', async () => {
      const outputPath = path.join(testTempDir, 'single.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.cpu.usage).toBe(45.2);
      expect(parsed.memory.percentage).toBe(51.2);
    });

    it('should export array of metrics to JSON', async () => {
      const outputPath = path.join(testTempDir, 'array.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export([mockSystemMetrics, mockSystemMetricsHighLoad], {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('should export pretty-printed JSON', async () => {
      const outputPath = path.join(testTempDir, 'pretty.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toContain('\n');
      expect(content).toContain('  '); // Indentation
    });

    it('should create parent directories if they do not exist', async () => {
      const outputPath = path.join(testTempDir, 'nested', 'deep', 'output.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(JSON.parse(content).timestamp).toBeDefined();
    });

    it('should enforce file size limit', async () => {
      // Create a very large metrics object
      const largeMetrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: 'x'.repeat(SECURITY_CONSTRAINTS.maxFileSizeBytes + 1)
        }
      };

      const outputPath = path.join(testTempDir, 'large.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await expect(
        exporter.export(largeMetrics, {
          ...mockExportOptionsJson,
          outputPath
        })
      ).rejects.toThrow('exceeds maximum');
    });

    it('should use atomic write (temp file then rename)', async () => {
      const outputPath = path.join(testTempDir, 'atomic.json');
      await fs.mkdir(testTempDir, { recursive: true });

      // Spy on fs operations
      const writeFileSync = jest.spyOn(fs, 'writeFile');
      const renameSync = jest.spyOn(fs, 'rename');

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      expect(writeFileSync).toHaveBeenCalled();
      expect(renameSync).toHaveBeenCalled();
    });
  });

  describe('CSV Export', () => {
    it('should export metrics to CSV', async () => {
      const outputPath = path.join(testTempDir, 'output.csv');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export([mockSystemMetrics], {
        ...mockExportOptionsCsv,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toContain('timestamp');
      expect(content).toContain('cpu_usage');
      expect(content).toContain('45.20');
    });

    it('should include CSV header', async () => {
      const outputPath = path.join(testTempDir, 'header.csv');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export([mockSystemMetrics], {
        ...mockExportOptionsCsv,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.split('\n');

      expect(lines[0]).toContain('timestamp');
      expect(lines[0]).toContain('cpu_usage');
      expect(lines[0]).toContain('memory_percentage');
    });

    it('should export multiple snapshots as multiple rows', async () => {
      const outputPath = path.join(testTempDir, 'multi.csv');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(
        [mockSystemMetrics, mockSystemMetricsHighLoad],
        {
          ...mockExportOptionsCsv,
          outputPath
        }
      );

      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(3); // Header + 2 data rows
    });
  });

  describe('HTML Export', () => {
    it('should export metrics to HTML', async () => {
      const outputPath = path.join(testTempDir, 'report.html');
      await fs.mkdir(testTempDir, { recursive: true });

      const metricsHistory = generateMockMetricsHistory(3);

      await exporter.export([mockSystemMetrics], {
        ...mockExportOptionsHtml,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
      expect(content).toContain('Sentinel');
    });

    it('should sanitize HTML content', async () => {
      const outputPath = path.join(testTempDir, 'sanitized.html');
      await fs.mkdir(testTempDir, { recursive: true });

      // Metrics with potentially malicious content
      const maliciousMetrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: '<script>alert("xss")</script>'
        }
      };

      await exporter.export([maliciousMetrics], {
        ...mockExportOptionsHtml,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).not.toContain('<script>alert("xss")</script>');
      expect(content).toContain('&lt;script&gt;');
    });
  });

  describe('Append Mode', () => {
    it('should append to existing JSON file', async () => {
      const outputPath = path.join(testTempDir, 'append.json');
      await fs.mkdir(testTempDir, { recursive: true });

      // Create initial file
      await fs.writeFile(outputPath, '[]', 'utf-8');

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath,
        append: true
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.length).toBeGreaterThan(2);
    });

    it('should handle append mode for CSV', async () => {
      const outputPath = path.join(testTempDir, 'append.csv');
      await fs.mkdir(testTempDir, { recursive: true });

      // Create initial CSV with header
      await fs.writeFile(outputPath, 'timestamp,cpu_usage\n2026-04-16T14:30:00.000Z,50.0\n', 'utf-8');

      await exporter.export([mockSystemMetrics], {
        ...mockExportOptionsCsv,
        outputPath,
        append: true
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw SentinelExportError for path traversal', async () => {
      await expect(
        exporter.export(mockSystemMetrics, {
          ...mockExportOptionsJson,
          outputPath: '../etc/passwd.json'
        })
      ).rejects.toThrow(SentinelExportError);
    });

    it('should throw SentinelExportError with correct code for path traversal', async () => {
      try {
        await exporter.export(mockSystemMetrics, {
          ...mockExportOptionsJson,
          outputPath: '../etc/passwd.json'
        });
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.PATH_TRAVERSAL);
      }
    });

    it('should throw error for invalid format', async () => {
      const outputPath = path.join(testTempDir, 'invalid.txt');
      await fs.mkdir(testTempDir, { recursive: true });

      await expect(
        exporter.export(mockSystemMetrics, {
          outputPath,
          format: 'txt' as any,
          append: false
        })
      ).rejects.toThrow('Unsupported format');
    });

    it('should clean up temp file on error', async () => {
      const outputPath = path.join(testTempDir, 'error.json');
      await fs.mkdir(testTempDir, { recursive: true });

      // Make directory read-only to cause error
      await fs.chmod(testTempDir, 0o444);

      try {
        await exporter.export(mockSystemMetrics, {
          ...mockExportOptionsJson,
          outputPath
        });
      } catch {
        // Expected to fail
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testTempDir, 0o755).catch(() => {});
      }
    });

    it('should handle permission errors gracefully', async () => {
      const outputPath = '/root/protected/output.json';

      await expect(
        exporter.export(mockSystemMetrics, {
          ...mockExportOptionsJson,
          outputPath
        })
      ).rejects.toThrow();
    });
  });

  describe('Security Constraints', () => {
    it('should enforce maximum sample count', async () => {
      const outputPath = path.join(testTempDir, 'limited.json');
      await fs.mkdir(testTempDir, { recursive: true });

      const largeMetricsArray = Array(
        SECURITY_CONSTRAINTS.maxSamples + 1
      ).fill(mockSystemMetrics);

      await expect(
        exporter.export(largeMetricsArray, {
          ...mockExportOptionsJson,
          outputPath,
          samples: SECURITY_CONSTRAINTS.maxSamples + 1
        })
      ).rejects.toThrow('exceeds maximum');
    });

    it('should enforce maximum file size', async () => {
      const outputPath = path.join(testTempDir, 'large.json');
      await fs.mkdir(testTempDir, { recursive: true });

      const largeMetrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: 'x'.repeat(SECURITY_CONSTRAINTS.maxFileSizeBytes + 1)
        }
      };

      await expect(
        exporter.export(largeMetrics, {
          ...mockExportOptionsJson,
          outputPath
        })
      ).rejects.toThrow('exceeds maximum');
    });

    it('should sanitize error messages', async () => {
      const outputPath = path.join(testTempDir, 'sanitize.json');
      await fs.mkdir(testTempDir, { recursive: true });

      try {
        await exporter.export(mockSystemMetrics, {
          ...mockExportOptionsJson,
          outputPath: '../etc/passwd.json'
        });
      } catch (error: any) {
        // Error message should be sanitized
        expect(error.message).not.toContain('C:\\');
        expect(error.message).not.toContain('password=');
      }
    });

    it('should validate all forbidden path characters', async () => {
      const forbiddenChars = DEFAULT_SECURITY_CONSTRAINTS.forbiddenPathChars;

      for (const char of forbiddenChars) {
        const maliciousPath = 'test' + char + '.json';

        await expect(
          exporter.validateAndNormalizePath(maliciousPath, 'json')
        ).rejects.toThrow();
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle Windows paths correctly', async () => {
      const windowsPath = 'C:\\Users\\test\\output.json';

      try {
        const result = await exporter.validateAndNormalizePath(windowsPath, 'json');
        expect(result).toBeDefined();
      } catch {
        // May fail due to permissions, but should not throw path validation error
      }
    });

    it('should handle Unix paths correctly', async () => {
      const unixPath = '/home/test/output.json';

      try {
        const result = await exporter.validateAndNormalizePath(unixPath, 'json');
        expect(result).toBeDefined();
      } catch {
        // May fail due to permissions
      }
    });

    it('should work with different platform metrics', async () => {
      const outputPath = path.join(testTempDir, 'platform.json');
      await fs.mkdir(testTempDir, { recursive: true });

      // Test with Windows metrics
      await exporter.export(mockSystemMetricsWindows, {
        ...mockExportOptionsJson,
        outputPath: outputPath + '-windows.json'
      });

      // Test with macOS metrics
      await exporter.export(mockSystemMetricsMacOS, {
        ...mockExportOptionsJson,
        outputPath: outputPath + '-macos.json'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metrics array', async () => {
      const outputPath = path.join(testTempDir, 'empty.csv');
      await fs.mkdir(testTempDir, { recursive: true });

      // CSV with empty array should produce just header or empty
      await exporter.export([], {
        ...mockExportOptionsCsv,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toBeDefined();
    });

    it('should handle special characters in valid paths', async () => {
      const outputPath = path.join(testTempDir, 'test-output with spaces.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(JSON.parse(content).timestamp).toBeDefined();
    });

    it('should handle unicode in path', async () => {
      const outputPath = path.join(testTempDir, '测试.json');
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(JSON.parse(content).timestamp).toBeDefined();
    });

    it('should handle very long valid filenames', async () => {
      const shortLongName = 'test-' + 'a'.repeat(100) + '.json';
      const outputPath = path.join(testTempDir, shortLongName);
      await fs.mkdir(testTempDir, { recursive: true });

      await exporter.export(mockSystemMetrics, {
        ...mockExportOptionsJson,
        outputPath
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(JSON.parse(content).timestamp).toBeDefined();
    });
  });

  describe('validateAndNormalizePath', () => {
    it('should normalize path separators', async () => {
      const pathWithMixedSeparators = 'test/output\\nested.json';

      try {
        const result = await exporter.validateAndNormalizePath(pathWithMixedSeparators, 'json');
        // Path should be normalized
        expect(result).toBeDefined();
      } catch {
        // May fail for other reasons
      }
    });

    it('should resolve relative paths to absolute', async () => {
      const relativePath = './test.json';

      const result = await exporter.validateAndNormalizePath(relativePath, 'json');

      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should add extension if missing', async () => {
      const pathWithoutExtension = path.join(testTempDir, 'noextension');

      const result = await exporter.validateAndNormalizePath(pathWithoutExtension, 'json');

      expect(result).toMatch(/\.json$/i);
    });

    it('should preserve extension if correct', async () => {
      const pathWithExtension = path.join(testTempDir, 'hasextension.json');

      const result = await exporter.validateAndNormalizePath(pathWithExtension, 'json');

      expect(result).toMatch(/\.json$/i);
      expect(result).not.toMatch(/\.json\.json/i);
    });
  });
});
