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
import { SystemMetrics, ExportOptions } from '../models/metrics.js';
/**
 * Sentinel-specific error class for export errors
 */
export declare class SentinelExportError extends Error {
    code: string;
    constructor(message: string, code?: string);
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
export declare class FileExporter {
    private reportGenerator;
    constructor();
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
    export(metrics: SystemMetrics | SystemMetrics[], options: ExportOptions): Promise<void>;
    /**
     * Export metrics to JSON file with atomic write
     *
     * SECURITY:
     * - Writes to temporary file first
     * - Renames atomically to prevent partial writes
     * - Cleans up temp file on failure
     * - Validates file size before finalizing
     */
    exportToJsonAtomic(metrics: SystemMetrics | SystemMetrics[], outputPath: string, options: ExportOptions): Promise<void>;
    /**
     * Export metrics to CSV file with atomic write
     *
     * SECURITY: Same atomic write protection as JSON export
     */
    exportToCsvAtomic(metrics: SystemMetrics[], outputPath: string, options: ExportOptions): Promise<void>;
    /**
     * Export metrics to HTML file with atomic write
     *
     * SECURITY: HTML sanitization in ReportGenerator, atomic write here
     */
    exportToHtmlAtomic(metrics: SystemMetrics[], outputPath: string, _options: ExportOptions): Promise<void>;
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
    validateAndNormalizePath(rawPath: string, expectedFormat: string): Promise<string>;
    /**
     * Check if path is writable
     */
    private isPathWritable;
    /**
     * Append content to file (for JSON arrays)
     */
    private appendToFile;
    /**
     * Sanitize error message for safe output
     * SECURITY: Removes sensitive information from error messages
     */
    private sanitizeErrorMessage;
}
export default FileExporter;
//# sourceMappingURL=file-exporter.d.ts.map