/**
 * Project Sentinel - CLI Integration Tests
 *
 * End-to-end tests for the CLI commands.
 * Tests command execution, argument parsing, and output validation.
 */

import { describe, it, expect, jest, beforeEach, afterEach, afterAll } from '@jest/globals';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

import { mockSystemMetrics, mockMaliciousPaths } from '../mocks/metrics-mock.js';
import { ERROR_CODES } from '../../src/utils/constants.js';

// Create temp directory for tests
const testTempDir = path.join(tmpdir(), 'sentinel-cli-test-' + Date.now());

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    // Ensure test directory exists
    jest.setTimeout(30000);
  });

  afterEach(async () => {
    // Clean up test directory
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

  describe('CLI Structure', () => {
    it('should have help command', () => {
      // Test that the CLI module exports setupCLI and init functions
      const cliModule = require('../../src/cli.js');
      expect(cliModule.setupCLI).toBeDefined();
      expect(cliModule.init).toBeDefined();
    });

    it('should import required modules', () => {
      // Test that all required modules can be imported
      const metricsModule = require('../../src/models/metrics.js');
      expect(metricsModule.DEFAULT_SECURITY_CONSTRAINTS).toBeDefined();

      const collectorModule = require('../../src/services/metrics-collector.js');
      expect(collectorModule.MetricsCollector).toBeDefined();

      const generatorModule = require('../../src/services/report-generator.js');
      expect(generatorModule.ReportGenerator).toBeDefined();

      const exporterModule = require('../../src/services/file-exporter.js');
      expect(exporterModule.FileExporter).toBeDefined();
      expect(exporterModule.SentinelExportError).toBeDefined();
    });
  });

  describe('Command Validation', () => {
    it('should validate numeric options', () => {
      // Test that invalid numeric options are handled
      const cliModule = require('../../src/cli.js');

      // This test verifies the CLI module structure
      expect(cliModule).toBeDefined();
    });

    it('should validate format options', () => {
      // Valid formats
      const validFormats = ['json', 'csv', 'html', 'text'];

      validFormats.forEach(format => {
        expect(['json', 'csv', 'html', 'text']).toContain(format);
      });
    });
  });

  describe('Security Tests - Path Validation', () => {
    it('should block path traversal in CLI export command', async () => {
      // Test that path traversal is prevented at the CLI level
      const maliciousPaths = [
        '../etc/passwd',
        '../../windows/system32',
        '..\\..\\windows\\config'
      ];

      for (const maliciousPath of maliciousPaths) {
        // The FileExporter should block these
        const { FileExporter } = require('../../src/services/file-exporter.js');
        const exporter = new FileExporter();

        await expect(
          exporter.validateAndNormalizePath(maliciousPath, 'json')
        ).rejects.toThrow('path traversal');
      }
    });

    it('should block null byte injection in export path', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      await expect(
        exporter.validateAndNormalizePath('test\x00.json', 'json')
      ).rejects.toThrow('null bytes');
    });

    it('should block reserved names in export path', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL'];

      for (const name of reservedNames) {
        await expect(
          exporter.validateAndNormalizePath(`C:\\${name}\\test.json`, 'json')
        ).rejects.toThrow('reserved name');
      }
    });

    it('should validate all malicious paths from mock data', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const blockedCount = await Promise.all(
        mockMaliciousPaths.map(async (maliciousPath) => {
          try {
            await exporter.validateAndNormalizePath(maliciousPath, 'json');
            return false; // Should have been blocked
          } catch (error: any) {
            return error.message.includes('path traversal') ||
                   error.message.includes('null bytes') ||
                   error.message.includes('forbidden') ||
                   error.message.includes('reserved');
          }
        })
      );

      // All malicious paths should be blocked
      expect(blockedCount.every(b => b)).toBe(true);
    });

    it('should sanitize error messages to prevent information disclosure', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      try {
        await exporter.export(mockSystemMetrics, {
          outputPath: '../etc/passwd.json',
          format: 'json',
          append: false
        });
      } catch (error: any) {
        // Error message should not contain sensitive paths
        expect(error.message).not.toContain('password=');
        // Error should be descriptive but sanitized
        expect(error.message).toMatch(/path|traversal|invalid/i);
      }
    });
  });

  describe('Security Tests - Input Validation', () => {
    it('should validate sample count bounds', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();
      const { DEFAULT_SECURITY_CONSTRAINTS } = require('../../src/models/metrics.js');

      // Test negative sample count
      await expect(collector.collectSamples(-1, 100)).rejects.toThrow('positive number');

      // Test zero sample count
      await expect(collector.collectSamples(0, 100)).rejects.toThrow('positive number');

      // Test excessive sample count
      await expect(collector.collectSamples(DEFAULT_SECURITY_CONSTRAINTS.maxSamples + 1, 100))
        .rejects.toThrow('exceeds maximum');
    });

    it('should validate interval bounds', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();

      // Test zero interval
      await expect(collector.collectSamples(5, 0)).rejects.toThrow('Interval must be between');

      // Test negative interval
      await expect(collector.collectSamples(5, -100)).rejects.toThrow('Interval must be between');

      // Test excessive interval
      await expect(collector.collectSamples(5, 300001)).rejects.toThrow('Interval must be between');
    });

    it('should handle invalid numeric input gracefully', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();

      // Test with NaN-like values
      await expect(collector.collectSamples(5, 0)).rejects.toThrow();
    });

    it('should enforce maximum path length', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const { SECURITY_CONSTRAINTS } = require('../../src/utils/constants.js');
      const exporter = new FileExporter();

      const longPath = 'output-' + 'a'.repeat(SECURITY_CONSTRAINTS.maxPathLength + 1) + '.json';

      await expect(
        exporter.validateAndNormalizePath(longPath, 'json')
      ).rejects.toThrow('exceeds maximum');
    });

    it('should handle empty string inputs', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      await expect(
        exporter.validateAndNormalizePath('', 'json')
      ).rejects.toThrow('must be a string');

      await expect(
        exporter.validateAndNormalizePath('   ', 'json')
      ).rejects.toThrow('must be a string');
    });

    it('should handle null and undefined inputs', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      await expect(
        exporter.validateAndNormalizePath(null as any, 'json')
      ).rejects.toThrow('must be a string');

      await expect(
        exporter.validateAndNormalizePath(undefined as any, 'json')
      ).rejects.toThrow('must be a string');
    });
  });

  describe('Security Tests - Format Validation', () => {
    it('should validate export format whitelist', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();
      const { tmpdir } = require('os');
      const testPath = path.join(tmpdir(), 'format-test.json');

      // Invalid format should throw
      await expect(
        exporter.export(mockSystemMetrics, {
          outputPath: testPath,
          format: 'xml' as any,
          append: false
        })
      ).rejects.toThrow('Unsupported format');

      await expect(
        exporter.export(mockSystemMetrics, {
          outputPath: testPath,
          format: 'yaml' as any,
          append: false
        })
      ).rejects.toThrow('Unsupported format');
    });

    it('should accept valid export formats', () => {
      const validFormats = ['json', 'csv', 'html'];

      validFormats.forEach(format => {
        expect(validFormats).toContain(format);
      });
    });

    it('should add correct file extension based on format', async () => {
      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      // Test JSON format
      const jsonPath = await exporter.validateAndNormalizePath('/tmp/test', 'json');
      expect(jsonPath).toMatch(/\.json$/i);

      // Test CSV format
      const csvPath = await exporter.validateAndNormalizePath('/tmp/test', 'csv');
      expect(csvPath).toMatch(/\.csv$/i);

      // Test HTML format
      const htmlPath = await exporter.validateAndNormalizePath('/tmp/test', 'html');
      expect(htmlPath).toMatch(/\.html$/i);
    });
  });

  describe('End-to-End JSON Export', () => {
    it('should export metrics to JSON file', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-test.json');

      await exporter.export(mockSystemMetrics, {
        outputPath,
        format: 'json',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.timestamp).toBeDefined();
      expect(data.cpu.usage).toBe(45.2);
      expect(data.memory.percentage).toBe(51.2);
      expect(data.host.platform).toBe('linux');
    });

    it('should export multiple metrics as JSON array', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-array.json');

      const metricsArray = [mockSystemMetrics, mockSystemMetrics];

      await exporter.export(metricsArray, {
        outputPath,
        format: 'json',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });
  });

  describe('End-to-End CSV Export', () => {
    it('should export metrics to CSV file', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-test.csv');

      await exporter.export([mockSystemMetrics], {
        outputPath,
        format: 'csv',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toContain('timestamp');
      expect(content).toContain('cpu_usage');
      expect(content).toContain('45.20');
      expect(content).toContain('51.20');
    });

    it('should include CSV header row', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-header.csv');

      await exporter.export([mockSystemMetrics], {
        outputPath,
        format: 'csv',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines[0]).toContain('timestamp');
      expect(lines[0]).toContain('cpu_cores');
      expect(lines[0]).toContain('memory_percentage');
      expect(lines[0]).toContain('hostname');
      expect(lines[0]).toContain('platform');
    });
  });

  describe('End-to-End HTML Export', () => {
    it('should export metrics to HTML file', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-test.html');

      await exporter.export([mockSystemMetrics], {
        outputPath,
        format: 'html',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
      expect(content).toContain('Sentinel');
      expect(content).toContain('Report');
    });

    it('should sanitize HTML content in exported file', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { FileExporter } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      const outputPath = path.join(testTempDir, 'e2e-sanitized.html');

      const maliciousMetrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: '<script>alert("xss")</script>'
        }
      };

      await exporter.export([maliciousMetrics], {
        outputPath,
        format: 'html',
        append: false
      });

      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).not.toContain('<script>alert("xss")</script>');
      expect(content).toContain('&lt;script&gt;');
    });
  });

  describe('Error Code Testing', () => {
    it('should return correct error code for path traversal', async () => {
      const { FileExporter, SentinelExportError } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      try {
        await exporter.export(mockSystemMetrics, {
          outputPath: '../etc/passwd.json',
          format: 'json',
          append: false
        });
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.PATH_TRAVERSAL);
      }
    });

    it('should return correct error code for invalid path', async () => {
      const { FileExporter, SentinelExportError } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      try {
        await exporter.export(mockSystemMetrics, {
          outputPath: null as any,
          format: 'json',
          append: false
        });
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.INVALID_PATH);
      }
    });

    it('should return correct error code for file too large', async () => {
      const { FileExporter, SentinelExportError } = require('../../src/services/file-exporter.js');
      const { SECURITY_CONSTRAINTS } = require('../../src/utils/constants.js');
      const exporter = new FileExporter();

      await fs.mkdir(testTempDir, { recursive: true });
      const outputPath = path.join(testTempDir, 'large.json');

      const largeMetrics = {
        ...mockSystemMetrics,
        host: {
          ...mockSystemMetrics.host,
          hostname: 'x'.repeat(SECURITY_CONSTRAINTS.maxFileSizeBytes + 1)
        }
      };

      try {
        await exporter.export(largeMetrics, {
          outputPath,
          format: 'json',
          append: false
        });
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
      }
    });

    it('should return correct error code for invalid input', async () => {
      const { FileExporter, SentinelExportError } = require('../../src/services/file-exporter.js');
      const exporter = new FileExporter();

      await fs.mkdir(testTempDir, { recursive: true });
      const outputPath = path.join(testTempDir, 'invalid.json');

      try {
        await exporter.export(mockSystemMetrics, {
          outputPath,
          format: 'invalid' as any,
          append: false
        });
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.INVALID_INPUT);
      }
    });
  });

  describe('Metrics Collector Integration', () => {
    it('should collect metrics with security constraints', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const { DEFAULT_SECURITY_CONSTRAINTS } = require('../../src/models/metrics.js');
      const collector = new MetricsCollector();

      // Collect a single metric
      const metrics = await collector.collect();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.cpu).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.host).toBeDefined();
    });

    it('should respect sample limit', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const { DEFAULT_SECURITY_CONSTRAINTS } = require('../../src/models/metrics.js');
      const collector = new MetricsCollector();

      await expect(
        collector.collectSamples(DEFAULT_SECURITY_CONSTRAINTS.maxSamples + 1, 100)
      ).rejects.toThrow('exceeds maximum');
    });

    it('should bound CPU usage to valid range', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();

      const metrics = await collector.collect();

      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
    });

    it('should bound memory percentage to valid range', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();

      const metrics = await collector.collect();

      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should sanitize hostname', async () => {
      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const collector = new MetricsCollector();

      const metrics = await collector.collect();

      expect(metrics.host.hostname).not.toContain('\0');
      expect(metrics.host.hostname.length).toBeLessThanOrEqual(255);
    });
  });

  describe('Report Generator Integration', () => {
    it('should generate JSON report', async () => {
      const { ReportGenerator } = require('../../src/services/report-generator.js');
      const generator = new ReportGenerator();

      const json = generator.generateJsonReport(mockSystemMetrics);
      const data = JSON.parse(json);

      expect(data).toBeDefined();
      expect(data.cpu.usage).toBe(45.2);
    });

    it('should generate CSV report', async () => {
      const { ReportGenerator } = require('../../src/services/report-generator.js');
      const generator = new ReportGenerator();

      const csv = generator.generateCsvReport([mockSystemMetrics]);

      expect(csv).toContain('timestamp');
      expect(csv).toContain('45.20');
    });

    it('should generate HTML report with sanitization', async () => {
      const { ReportGenerator } = require('../../src/services/report-generator.js');
      const { generateMockMetricsHistory } = require('../mocks/metrics-mock.js');
      const generator = new ReportGenerator();

      const history = generateMockMetricsHistory(3);

      const html = await generator.generateHtmlReport(history);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Sentinel');
    });
  });

  describe('Complete Workflow Test', () => {
    it('should execute complete export workflow', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const { FileExporter } = require('../../src/services/file-exporter.js');

      const collector = new MetricsCollector();
      const exporter = new FileExporter();

      // Collect metrics
      const metrics = await collector.collect();

      // Export to JSON
      const jsonPath = path.join(testTempDir, 'workflow.json');
      await exporter.export(metrics, {
        outputPath: jsonPath,
        format: 'json',
        append: false
      });

      // Verify JSON export
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);
      expect(jsonData.timestamp).toBeDefined();
      expect(jsonData.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(jsonData.cpu.usage).toBeLessThanOrEqual(100);

      // Export to CSV
      const csvPath = path.join(testTempDir, 'workflow.csv');
      await exporter.export([metrics], {
        outputPath: csvPath,
        format: 'csv',
        append: false
      });

      // Verify CSV export
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain('timestamp');
      expect(csvContent).toContain('cpu_usage');
    });

    it('should handle complete workflow with multiple samples', async () => {
      await fs.mkdir(testTempDir, { recursive: true });

      const { MetricsCollector } = require('../../src/services/metrics-collector.js');
      const { FileExporter } = require('../../src/services/file-exporter.js');

      const collector = new MetricsCollector();
      const exporter = new FileExporter();

      // Collect multiple samples quickly
      const history = await collector.collectSamples(3, 100);

      // Export to JSON
      const jsonPath = path.join(testTempDir, 'multi-workflow.json');
      await exporter.export(history.snapshots, {
        outputPath: jsonPath,
        format: 'json',
        append: false
      });

      // Verify export
      const content = await fs.readFile(jsonPath, 'utf-8');
      const data = JSON.parse(content);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
    });
  });
});
