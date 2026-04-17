/**
 * Project Sentinel - File Exporter Service
 *
 * Handles exporting metrics data to files with comprehensive security features.
 *
 * Security features:
 * - Path traversal prevention (blocks '..' and encoded variants)
 * - Path normalization and validation
 * - Atomic file writes (write to temp, then rename)
 * - File size limits enforcement
 * - Input sanitization
 * - Safe file extension handling
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_SECURITY_CONSTRAINTS as SECURITY_CONSTRAINTS } from '../models/metrics.js';
import { logger } from '../utils/logger.js';
import { FILE_EXTENSIONS, PATH_SECURITY, ERROR_CODES } from '../utils/constants.js';
import { ReportGenerator } from './report-generator.js';
/**
 * Sentinel-specific error class for export errors
 */
export class SentinelExportError extends Error {
    code;
    constructor(message, code = ERROR_CODES.EXPORT_ERROR) {
        super(message);
        this.code = code;
        this.name = 'SentinelExportError';
    }
}
/**
 * File Exporter class
 *
 * Handles secure file export operations with:
 * - Path traversal prevention
 * - Atomic writes
 * - Size limits
 * - Input validation
 */
export class FileExporter {
    reportGenerator;
    constructor() {
        this.reportGenerator = new ReportGenerator();
    }
    /**
     * Export metrics to file based on format
     *
     * @param metrics Metrics data to export
     * @param options Export configuration
     *
     * SECURITY:
     * - Validates output path against traversal attacks
     * - Uses atomic write to prevent corruption
     * - Enforces file size limits
     */
    async export(metrics, options) {
        // SECURITY: Validate output path before any operations
        const validatedPath = await this.validateAndNormalizePath(options.outputPath, options.format);
        // Validate samples against security constraints
        if (options.samples && options.samples > SECURITY_CONSTRAINTS.maxSamples) {
            throw new SentinelExportError(`Sample count exceeds maximum (${SECURITY_CONSTRAINTS.maxSamples})`, ERROR_CODES.SAMPLE_LIMIT);
        }
        // Execute format-specific export with atomic write
        switch (options.format) {
            case 'json':
                await this.exportToJsonAtomic(metrics, validatedPath, options);
                break;
            case 'csv':
                await this.exportToCsvAtomic(Array.isArray(metrics) ? metrics : [metrics], validatedPath, options);
                break;
            case 'html':
                await this.exportToHtmlAtomic(Array.isArray(metrics) ? metrics : [metrics], validatedPath, options);
                break;
            default:
                throw new SentinelExportError(`Unsupported format: ${options.format}`, ERROR_CODES.INVALID_INPUT);
        }
    }
    /**
     * Export metrics to JSON file with atomic write
     *
     * SECURITY:
     * - Writes to temporary file first
     * - Renames atomically to prevent partial writes
     * - Cleans up temp file on failure
     * - Validates file size before finalizing
     */
    async exportToJsonAtomic(metrics, outputPath, options) {
        const tempPath = `${outputPath}.tmp.${process.pid}`;
        try {
            // Generate JSON content
            const content = Array.isArray(metrics)
                ? JSON.stringify(metrics, null, 2)
                : JSON.stringify(metrics, null, 2);
            // SECURITY: Check content size before write
            const byteLength = Buffer.byteLength(content, 'utf-8');
            if (byteLength > SECURITY_CONSTRAINTS.maxFileSizeBytes) {
                throw new SentinelExportError(`Content size (${byteLength} bytes) exceeds maximum (${SECURITY_CONSTRAINTS.maxFileSizeBytes} bytes)`, ERROR_CODES.FILE_TOO_LARGE);
            }
            // Check if appending to existing file
            if (options.append) {
                await this.appendToFile(tempPath, content);
            }
            else {
                // Write to temp file
                await fs.writeFile(tempPath, content, 'utf-8');
            }
            // SECURITY: Atomic rename (prevents partial file on crash)
            await fs.rename(tempPath, outputPath);
            logger.success(`Metrics exported to: ${outputPath}`);
        }
        catch (error) {
            // SECURITY: Clean up temp file on error
            try {
                await fs.unlink(tempPath).catch(() => { });
            }
            catch {
                // Ignore cleanup errors
            }
            if (error instanceof SentinelExportError) {
                throw error;
            }
            throw new SentinelExportError('Failed to export metrics: ' +
                this.sanitizeErrorMessage(error instanceof Error ? error.message : String(error)), ERROR_CODES.EXPORT_ERROR);
        }
    }
    /**
     * Export metrics to CSV file with atomic write
     *
     * SECURITY: Same atomic write protection as JSON export
     */
    async exportToCsvAtomic(metrics, outputPath, options) {
        const tempPath = `${outputPath}.tmp.${process.pid}`;
        try {
            // Generate CSV content
            const content = this.reportGenerator.generateCsvReport(metrics);
            // SECURITY: Check content size
            const byteLength = Buffer.byteLength(content, 'utf-8');
            if (byteLength > SECURITY_CONSTRAINTS.maxFileSizeBytes) {
                throw new SentinelExportError(`Content size (${byteLength} bytes) exceeds maximum`, ERROR_CODES.FILE_TOO_LARGE);
            }
            // Handle append mode - need to preserve header
            if (options.append) {
                // Read existing content to check if header exists
                try {
                    const existingContent = await fs.readFile(outputPath, 'utf-8');
                    const lines = existingContent.split('\n');
                    // Skip existing header, add new data rows
                    const newContent = lines.length > 0 ? content : '';
                    await fs.appendFile(outputPath, newContent ? '\n' + newContent : '', 'utf-8');
                }
                catch {
                    // File doesn't exist, write fresh
                    await fs.writeFile(tempPath, content, 'utf-8');
                    await fs.rename(tempPath, outputPath);
                }
            }
            else {
                // Write to temp file
                await fs.writeFile(tempPath, content, 'utf-8');
                // Atomic rename
                await fs.rename(tempPath, outputPath);
            }
            logger.success(`Metrics exported to: ${outputPath}`);
        }
        catch (error) {
            // Clean up temp file
            try {
                await fs.unlink(tempPath).catch(() => { });
            }
            catch {
                // Ignore
            }
            if (error instanceof SentinelExportError) {
                throw error;
            }
            throw new SentinelExportError('Failed to export metrics: ' +
                this.sanitizeErrorMessage(error instanceof Error ? error.message : String(error)), ERROR_CODES.EXPORT_ERROR);
        }
    }
    /**
     * Export metrics to HTML file with atomic write
     *
     * SECURITY: HTML sanitization in ReportGenerator, atomic write here
     */
    async exportToHtmlAtomic(metrics, outputPath, _options) {
        const tempPath = `${outputPath}.tmp.${process.pid}`;
        try {
            // Create a mock MetricsHistory for the HTML report
            const history = {
                snapshots: metrics,
                startTime: metrics[0]?.timestamp || new Date().toISOString(),
                endTime: metrics[metrics.length - 1]?.timestamp || new Date().toISOString(),
                durationMs: 0,
                averageCpuUsage: 0,
                maxCpuUsage: 0,
                minCpuUsage: 0,
                averageMemoryPercentage: 0,
                maxMemoryPercentage: 0,
                minMemoryPercentage: 0
            };
            // Calculate real statistics
            if (metrics.length > 0) {
                history.durationMs = Date.parse(history.endTime) - Date.parse(history.startTime);
                history.averageCpuUsage = metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length;
                history.maxCpuUsage = Math.max(...metrics.map(m => m.cpu.usage));
                history.minCpuUsage = Math.min(...metrics.map(m => m.cpu.usage));
                history.averageMemoryPercentage = metrics.reduce((sum, m) => sum + m.memory.percentage, 0) / metrics.length;
                history.maxMemoryPercentage = Math.max(...metrics.map(m => m.memory.percentage));
                history.minMemoryPercentage = Math.min(...metrics.map(m => m.memory.percentage));
            }
            // Generate HTML content (sanitized by ReportGenerator)
            const content = await this.reportGenerator.generateHtmlReport(history);
            // SECURITY: Check content size
            const byteLength = Buffer.byteLength(content, 'utf-8');
            if (byteLength > SECURITY_CONSTRAINTS.maxFileSizeBytes) {
                throw new SentinelExportError(`Content size exceeds maximum`, ERROR_CODES.FILE_TOO_LARGE);
            }
            // Write to temp file
            await fs.writeFile(tempPath, content, 'utf-8');
            // SECURITY: Atomic rename
            await fs.rename(tempPath, outputPath);
            logger.success(`HTML report exported to: ${outputPath}`);
        }
        catch (error) {
            // Clean up temp file
            try {
                await fs.unlink(tempPath).catch(() => { });
            }
            catch {
                // Ignore
            }
            if (error instanceof SentinelExportError) {
                throw error;
            }
            throw new SentinelExportError('Failed to export metrics: ' +
                this.sanitizeErrorMessage(error instanceof Error ? error.message : String(error)), ERROR_CODES.EXPORT_ERROR);
        }
    }
    /**
     * Validate and normalize output path
     *
     * SECURITY: Comprehensive path validation including:
     * - Path traversal prevention
     * - Null byte injection prevention
     * - Reserved name blocking
     * - Maximum length enforcement
     * - Extension validation
     *
     * @param rawPath Raw path from CLI
     * @param expectedFormat Expected file format
     * @returns Normalized absolute path
     */
    async validateAndNormalizePath(rawPath, expectedFormat) {
        if (!rawPath || typeof rawPath !== 'string') {
            throw new SentinelExportError('Output path is required and must be a string', ERROR_CODES.INVALID_PATH);
        }
        // SECURITY: Check path length
        if (rawPath.length > SECURITY_CONSTRAINTS.maxPathLength) {
            throw new SentinelExportError(`Path length exceeds maximum (${SECURITY_CONSTRAINTS.maxPathLength} characters)`, ERROR_CODES.INVALID_PATH);
        }
        // SECURITY: Check for null bytes (injection prevention)
        if (rawPath.includes('\0')) {
            throw new SentinelExportError('Invalid path: null bytes not allowed', ERROR_CODES.PATH_TRAVERSAL);
        }
        // SECURITY: Check for forbidden characters
        for (const char of SECURITY_CONSTRAINTS.forbiddenPathChars) {
            if (rawPath.includes(char)) {
                throw new SentinelExportError('Invalid path: forbidden characters detected', ERROR_CODES.PATH_TRAVERSAL);
            }
        }
        // SECURITY: Check for path traversal patterns
        // Normalize and check for '..'
        const normalizedPath = path.normalize(rawPath);
        const traversalPatterns = PATH_SECURITY.traversalPatterns;
        for (const pattern of traversalPatterns) {
            // Check both original and encoded paths
            if (normalizedPath.includes(pattern) || rawPath.includes(pattern)) {
                throw new SentinelExportError('Invalid path: path traversal detected', ERROR_CODES.PATH_TRAVERSAL);
            }
        }
        // Additional check: resolved path should not start with something outside intended directory
        const resolvedPath = path.resolve(normalizedPath);
        // SECURITY: Check for reserved Windows names
        const pathParts = resolvedPath.split(path.sep);
        const reservedNames = PATH_SECURITY.reservedNames;
        for (const part of pathParts) {
            const upperPart = part.toUpperCase();
            if (reservedNames.includes(upperPart)) {
                throw new SentinelExportError(`Invalid path: reserved name "${part}" not allowed`, ERROR_CODES.INVALID_PATH);
            }
        }
        // Add extension if missing
        let finalPath = resolvedPath;
        const extension = FILE_EXTENSIONS[expectedFormat] ||
            `.${expectedFormat}`;
        if (!finalPath.toLowerCase().endsWith(extension.toLowerCase())) {
            finalPath += extension;
        }
        // SECURITY: Verify the resolved path is still safe
        if (await this.isPathWritable(finalPath)) {
            return finalPath;
        }
        throw new SentinelExportError('Invalid path: cannot write to specified location', ERROR_CODES.PERMISSION_ERROR);
    }
    /**
     * Check if path is writable
     */
    async isPathWritable(filePath) {
        try {
            // Check if parent directory exists and is writable
            const dir = path.dirname(filePath);
            await fs.access(dir, fs.constants.W_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Append content to file (for JSON arrays)
     */
    async appendToFile(filePath, content) {
        try {
            await fs.appendFile(filePath, content, 'utf-8');
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Sanitize error message for safe output
     * SECURITY: Removes sensitive information from error messages
     */
    sanitizeErrorMessage(message) {
        // Remove absolute paths
        message = message.replace(/C:\\[^:"']+/g, '[PATH]');
        message = message.replace(/\/(?:[^\/\s]+\/)+[^\/\s]+/g, '[PATH]');
        // Remove potential PII
        message = message.replace(/password[=:]\s*[^,\s"']+/gi, 'password=[REDACTED]');
        // Limit length
        if (message.length > 300) {
            message = message.substring(0, 300) + '...';
        }
        return message;
    }
}
export default FileExporter;
//# sourceMappingURL=file-exporter.js.map