/**
 * Project Sentinel - Report Generator Service
 *
 * Generates formatted reports from system metrics for terminal display,
 * JSON output, CSV export, and HTML reports.
 *
 * Security features:
 * - Sanitizes all input data for HTML output
 * - Bounds numeric values to prevent overflow
 * - Validates template data before rendering
 */
import { SystemMetrics, MetricsHistory } from '../models/metrics.js';
/**
 * Report Generator class
 *
 * Generates various report formats from system metrics data.
 * Implements input sanitization for HTML output.
 */
export declare class ReportGenerator {
    private templateContent;
    /**
     * Create report generator
     *
     * @param useColors Enable colored output (default: true)
     */
    constructor();
    /**
     * Generate terminal display for live monitoring
     *
     * @param metrics SystemMetrics to display
     * @param options Display configuration with thresholds
     * @returns Formatted string for terminal
     *
     * SECURITY: All numeric values are bounded before display
     */
    generateMonitorDisplay(metrics: SystemMetrics, options: {
        cpuThreshold: number;
        memoryThreshold: number;
    }): string;
    /**
     * Generate snapshot report (single metrics)
     *
     * @param metrics SystemMetrics snapshot
     * @param verbose Include detailed information
     * @returns Formatted report string
     */
    generateSnapshotReport(metrics: SystemMetrics, verbose?: boolean): string;
    /**
     * Generate JSON output from metrics
     *
     * @param metrics SystemMetrics to serialize
     * @returns JSON string (pretty-printed)
     *
     * SECURITY: Ensures all values are JSON-serializable
     */
    generateJsonReport(metrics: SystemMetrics): string;
    /**
     * Generate CSV output from metrics array
     *
     * @param metrics Array of SystemMetrics snapshots
     * @returns CSV formatted string with header
     *
     * SECURITY: Escapes special characters in CSV values
     */
    generateCsvReport(metrics: SystemMetrics[]): string;
    /**
     * Generate HTML report from metrics history
     *
     * @param history MetricsHistory with multiple snapshots
     * @returns HTML formatted report string
     *
     * SECURITY: Sanitizes all content for HTML injection prevention
     */
    generateHtmlReport(history: MetricsHistory): Promise<string>;
    /**
     * Ensure all values are JSON-serializable
     * SECURITY: Removes circular references and non-serializable values
     */
    private ensureSerializable;
    /**
     * Sanitize data for HTML output
     * SECURITY: Encodes special HTML characters
     */
    private sanitizeForHtml;
    /**
     * Build header row for monitor display
     */
    private buildHeader;
    /**
     * Build CPU usage row with progress bar
     */
    private buildCpuRow;
    /**
     * Build memory usage row with progress bar
     */
    private buildMemoryRow;
    /**
     * Build disk row
     */
    private buildDiskRow;
    /**
     * Build network row
     */
    private buildNetworkRow;
    /**
     * Build footer row for monitor display
     */
    private buildFooter;
    /**
     * Build progress bar string
     */
    private buildProgressBar;
    /**
     * Get status icon based on threshold
     */
    private getStatusIcon;
    /**
     * Get color based on percentage and threshold
     */
    private getColorForPercentage;
    /**
     * Format bytes to human-readable string
     */
    private formatBytes;
    /**
     * Format duration from seconds
     */
    private formatDuration;
    /**
     * Format frequency value
     */
    private formatFrequency;
    /**
     * Escape value for CSV
     * SECURITY: Properly escapes quotes and commas
     */
    private csvEscape;
    /**
     * Get fallback mustache template
     */
    private getFallbackTemplate;
    /**
     * Generate fallback HTML without template
     */
    private generateFallbackHtml;
}
export default ReportGenerator;
//# sourceMappingURL=report-generator.d.ts.map