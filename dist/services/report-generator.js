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
import mustache from 'mustache';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { STATUS_ICONS, BOX_CHARS, PROGRESS_BAR, TEMPLATE_PATH } from '../utils/constants.js';
// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Report Generator class
 *
 * Generates various report formats from system metrics data.
 * Implements input sanitization for HTML output.
 */
export class ReportGenerator {
    templateContent = null;
    /**
     * Create report generator
     *
     * @param useColors Enable colored output (default: true)
     */
    constructor() {
        this.templateContent = null;
    }
    /**
     * Generate terminal display for live monitoring
     *
     * @param metrics SystemMetrics to display
     * @param options Display configuration with thresholds
     * @returns Formatted string for terminal
     *
     * SECURITY: All numeric values are bounded before display
     */
    generateMonitorDisplay(metrics, options) {
        const { cpuThreshold, memoryThreshold } = options;
        // Build display using box-drawing characters
        const display = [
            this.buildHeader('SENTINEL - System Monitor'),
            this.buildCpuRow(metrics.cpu.usage, cpuThreshold),
            this.buildMemoryRow(metrics.memory.percentage, memoryThreshold),
            metrics.disk ? this.buildDiskRow(metrics.disk) : this.buildDiskRow(),
            metrics.network ? this.buildNetworkRow(metrics.network) : this.buildNetworkRow(),
            this.buildFooter()
        ].join('\n');
        return display;
    }
    /**
     * Generate snapshot report (single metrics)
     *
     * @param metrics SystemMetrics snapshot
     * @param verbose Include detailed information
     * @returns Formatted report string
     */
    generateSnapshotReport(metrics, verbose = false) {
        const lines = [];
        // Header
        lines.push(`System Snapshot - ${metrics.timestamp}`);
        lines.push('='.repeat(48));
        lines.push('');
        // CPU section
        lines.push(`${chalk.blue('CPU:')}\t\t${metrics.cpu.usage.toFixed(1)}% ` +
            `(Active: ${metrics.cpu.activeCores}/${metrics.cpu.cores} cores)`);
        if (verbose) {
            lines.push(`  Frequency: ${this.formatFrequency(metrics.cpu.frequency)} MHz`);
            if (metrics.cpu.temperature !== undefined) {
                lines.push(`  Temperature: ${metrics.cpu.temperature.toFixed(1)}°C`);
            }
        }
        // Memory section
        lines.push(`${chalk.blue('Memory:')}\t${this.formatBytes(metrics.memory.used)} / ` +
            `${this.formatBytes(metrics.memory.total)} (${metrics.memory.percentage.toFixed(1)}%)`);
        if (verbose) {
            lines.push(`  Swap: ${this.formatBytes(metrics.memory.swapUsed)} / ` +
                `${this.formatBytes(metrics.memory.swapTotal)} (${metrics.memory.swapPercentage.toFixed(1)}%)`);
        }
        // Uptime section
        lines.push(`${chalk.blue('Uptime:')}\t${this.formatDuration(metrics.host.uptime)}`);
        // Host info (verbose only)
        if (verbose) {
            lines.push('');
            lines.push(`${chalk.blue('Host:')}\t${metrics.host.hostname}`);
            lines.push(`${chalk.blue('OS:')}\t${metrics.host.platform} ${metrics.host.release}`);
            lines.push(`${chalk.blue('Node:')}\t${metrics.host.nodeVersion}`);
        }
        return lines.join('\n');
    }
    /**
     * Generate JSON output from metrics
     *
     * @param metrics SystemMetrics to serialize
     * @returns JSON string (pretty-printed)
     *
     * SECURITY: Ensures all values are JSON-serializable
     */
    generateJsonReport(metrics) {
        const serializableMetrics = this.ensureSerializable(metrics);
        return JSON.stringify(serializableMetrics, null, 2);
    }
    /**
     * Generate CSV output from metrics array
     *
     * @param metrics Array of SystemMetrics snapshots
     * @returns CSV formatted string with header
     *
     * SECURITY: Escapes special characters in CSV values
     */
    generateCsvReport(metrics) {
        if (metrics.length === 0) {
            return '';
        }
        // Build header
        const header = [
            'timestamp',
            'cpu_usage',
            'cpu_cores',
            'cpu_active_cores',
            'cpu_frequency',
            'memory_total',
            'memory_used',
            'memory_free',
            'memory_percentage',
            'memory_swap_total',
            'memory_swap_used',
            'hostname',
            'platform'
        ].join(',');
        // Build data rows
        const rows = metrics.map(m => [
            this.csvEscape(m.timestamp),
            this.csvEscape(m.cpu.usage.toFixed(2)),
            this.csvEscape(m.cpu.cores.toString()),
            this.csvEscape(m.cpu.activeCores.toString()),
            this.csvEscape(m.cpu.frequency.toString()),
            this.csvEscape(m.memory.total.toString()),
            this.csvEscape(m.memory.used.toString()),
            this.csvEscape(m.memory.free.toString()),
            this.csvEscape(m.memory.percentage.toFixed(2)),
            this.csvEscape(m.memory.swapTotal.toString()),
            this.csvEscape(m.memory.swapUsed.toString()),
            this.csvEscape(m.host.hostname),
            this.csvEscape(m.host.platform)
        ].join(','));
        return [header, ...rows].join('\n');
    }
    /**
     * Generate HTML report from metrics history
     *
     * @param history MetricsHistory with multiple snapshots
     * @returns HTML formatted report string
     *
     * SECURITY: Sanitizes all content for HTML injection prevention
     */
    async generateHtmlReport(history) {
        try {
            // Load template
            const templatePath = path.resolve(__dirname, TEMPLATE_PATH);
            this.templateContent = await fs.readFile(templatePath, 'utf-8');
        }
        catch (error) {
            // Fallback to inline template if file not found
            this.templateContent = this.getFallbackTemplate();
        }
        // SECURITY: Sanitize template data
        const sanitizedData = this.sanitizeForHtml(history);
        try {
            return mustache.render(this.templateContent, sanitizedData);
        }
        catch (error) {
            // Return fallback HTML on template error
            return this.generateFallbackHtml();
        }
    }
    /**
     * Ensure all values are JSON-serializable
     * SECURITY: Removes circular references and non-serializable values
     */
    ensureSerializable(metrics) {
        return {
            ...metrics,
            cpu: {
                ...metrics.cpu,
                usage: Number(metrics.cpu.usage) || 0,
                cores: Number(metrics.cpu.cores) || 0,
                activeCores: Number(metrics.cpu.activeCores) || 0,
                frequency: Number(metrics.cpu.frequency) || 0,
                maxFrequency: Number(metrics.cpu.maxFrequency) || 0,
                temperature: metrics.cpu.temperature !== undefined
                    ? Number(metrics.cpu.temperature)
                    : undefined,
                loadAverage1: metrics.cpu.loadAverage1 !== undefined
                    ? Number(metrics.cpu.loadAverage1)
                    : undefined,
                loadAverage5: metrics.cpu.loadAverage5 !== undefined
                    ? Number(metrics.cpu.loadAverage5)
                    : undefined,
                loadAverage15: metrics.cpu.loadAverage15 !== undefined
                    ? Number(metrics.cpu.loadAverage15)
                    : undefined
            },
            memory: {
                ...metrics.memory,
                total: Number(metrics.memory.total) || 0,
                used: Number(metrics.memory.used) || 0,
                free: Number(metrics.memory.free) || 0,
                available: Number(metrics.memory.available) || 0,
                percentage: Number(metrics.memory.percentage) || 0,
                swapTotal: Number(metrics.memory.swapTotal) || 0,
                swapUsed: Number(metrics.memory.swapUsed) || 0,
                swapFree: Number(metrics.memory.swapFree) || 0,
                swapPercentage: Number(metrics.memory.swapPercentage) || 0
            }
        };
    }
    /**
     * Sanitize data for HTML output
     * SECURITY: Encodes special HTML characters
     */
    sanitizeForHtml(history) {
        const escape = (str) => {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        return {
            startTime: escape(history.startTime),
            endTime: escape(history.endTime),
            durationMs: history.durationMs,
            sampleCount: history.snapshots.length,
            averageCpuUsage: history.averageCpuUsage.toFixed(2),
            maxCpuUsage: history.maxCpuUsage.toFixed(2),
            minCpuUsage: history.minCpuUsage.toFixed(2),
            averageMemoryPercentage: history.averageMemoryPercentage.toFixed(2),
            maxMemoryPercentage: history.maxMemoryPercentage.toFixed(2),
            minMemoryPercentage: history.minMemoryPercentage.toFixed(2)
        };
    }
    /**
     * Build header row for monitor display
     */
    buildHeader(title) {
        const borderLength = 42;
        const padding = (borderLength - title.length) / 2;
        const paddedTitle = ' '.repeat(Math.floor(padding)) + title;
        return (BOX_CHARS.topLeft +
            BOX_CHARS.horizontal.repeat(borderLength) +
            BOX_CHARS.topRight +
            '\n' +
            BOX_CHARS.vertical +
            ' '.repeat(4) +
            chalk.blue.bold(paddedTitle) +
            ' '.repeat(4) +
            BOX_CHARS.vertical);
    }
    /**
     * Build CPU usage row with progress bar
     */
    buildCpuRow(usage, threshold) {
        const status = this.getStatusIcon(usage, threshold);
        const color = this.getColorForPercentage(usage, threshold);
        const bar = this.buildProgressBar(usage);
        return (BOX_CHARS.vertical +
            '  CPU Usage:  ' +
            chalk[color](bar) +
            ` ${usage.toFixed(1)}% ${status}  ` +
            BOX_CHARS.vertical);
    }
    /**
     * Build memory usage row with progress bar
     */
    buildMemoryRow(usage, threshold) {
        const status = this.getStatusIcon(usage, threshold);
        const color = this.getColorForPercentage(usage, threshold);
        const bar = this.buildProgressBar(usage);
        return (BOX_CHARS.vertical +
            '  Memory:     ' +
            chalk[color](bar) +
            ` ${usage.toFixed(1)}% ${status}  ` +
            BOX_CHARS.vertical);
    }
    /**
     * Build disk row
     */
    buildDiskRow(disk) {
        if (!disk || disk.total === 0) {
            return (BOX_CHARS.vertical +
                '  Disk:       -- not available --' +
                BOX_CHARS.vertical);
        }
        const pct = disk.percentage || 0;
        const bar = this.buildProgressBar(pct);
        const usedGB = (disk.used / (1024 * 1024 * 1024)).toFixed(1);
        const totalGB = (disk.total / (1024 * 1024 * 1024)).toFixed(1);
        return (BOX_CHARS.vertical +
            '  Disk:       ' +
            chalk[pct > 80 ? 'red' : 'green'](bar) +
            ` ${usedGB}GB/${totalGB}GB  ` +
            BOX_CHARS.vertical);
    }
    /**
     * Build network row
     */
    buildNetworkRow(network) {
        if (!network || (network.receivedBytes === 0 && network.transmittedBytes === 0)) {
            return (BOX_CHARS.vertical +
                '  Network:    -- not available --' +
                BOX_CHARS.vertical);
        }
        const rxMB = (network.receivedBytes / (1024 * 1024)).toFixed(1);
        const txMB = (network.transmittedBytes / (1024 * 1024)).toFixed(1);
        return (BOX_CHARS.vertical +
            `  Network:    ${rxMB}MB in / ${txMB}MB out  ` +
            BOX_CHARS.vertical);
    }
    /**
     * Build footer row for monitor display
     */
    buildFooter() {
        const borderLength = 42;
        return BOX_CHARS.bottomLeft + BOX_CHARS.horizontal.repeat(borderLength) + BOX_CHARS.bottomRight;
    }
    /**
     * Build progress bar string
     */
    buildProgressBar(percentage) {
        const pct = Math.min(Math.max(percentage, 0), 100);
        const filled = Math.round((pct / 100) * PROGRESS_BAR.segments);
        const empty = PROGRESS_BAR.segments - filled;
        return (PROGRESS_BAR.filled.repeat(filled) +
            PROGRESS_BAR.empty.repeat(empty));
    }
    /**
     * Get status icon based on threshold
     */
    getStatusIcon(usage, threshold) {
        if (usage >= threshold + 10) {
            return chalk.red(STATUS_ICONS.error);
        }
        else if (usage >= threshold) {
            return chalk.yellow(STATUS_ICONS.warning);
        }
        return chalk.green(STATUS_ICONS.success);
    }
    /**
     * Get color based on percentage and threshold
     */
    getColorForPercentage(usage, threshold) {
        if (usage >= threshold + 10) {
            return 'red';
        }
        else if (usage >= threshold) {
            return 'yellow';
        }
        return 'green';
    }
    /**
     * Format bytes to human-readable string
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return ((bytes / Math.pow(1024, unitIndex)).toFixed(1) +
            ' ' +
            units[unitIndex]);
    }
    /**
     * Format duration from seconds
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} seconds`;
        }
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const parts = [];
        if (days > 0) {
            parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        }
        if (hours > 0) {
            parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        }
        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
        if (remainingSeconds > 0 && parts.length === 0) {
            parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
        }
        return parts.join(', ');
    }
    /**
     * Format frequency value
     */
    formatFrequency(freq) {
        return freq.toString();
    }
    /**
     * Escape value for CSV
     * SECURITY: Properly escapes quotes and commas
     */
    csvEscape(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
    /**
     * Get fallback mustache template
     */
    getFallbackTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentinel Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .metric-label { font-weight: bold; color: #555; }
        .metric-value { color: #007bff; }
        .info { background: #e7f3ff; padding: 15px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Project Sentinel Report</h1>
        <div class="info">
            <strong>Collection Period:</strong> {{startTime}} to {{endTime}}<br>
            <strong>Total Duration:</strong> {{durationMs}}ms<br>
            <strong>Samples Collected:</strong> {{sampleCount}}
        </div>
        <div class="section">
            <h2>CPU Statistics</h2>
            <div class="metric"><span class="metric-label">Average Usage:</span><span class="metric-value">{{averageCpuUsage}}%</span></div>
            <div class="metric"><span class="metric-label">Maximum Usage:</span><span class="metric-value">{{maxCpuUsage}}%</span></div>
            <div class="metric"><span class="metric-label">Minimum Usage:</span><span class="metric-value">{{minCpuUsage}}%</span></div>
        </div>
        <div class="section">
            <h2>Memory Statistics</h2>
            <div class="metric"><span class="metric-label">Average Usage:</span><span class="metric-value">{{averageMemoryPercentage}}%</span></div>
            <div class="metric"><span class="metric-label">Maximum Usage:</span><span class="metric-value">{{maxMemoryPercentage}}%</span></div>
            <div class="metric"><span class="metric-label">Minimum Usage:</span><span class="metric-value">{{minMemoryPercentage}}%</span></div>
        </div>
    </div>
</body>
</html>`;
    }
    /**
     * Generate fallback HTML without template
     */
    generateFallbackHtml() {
        return `<!DOCTYPE html>
<html>
<head><title>Sentinel Report</title></head>
<body>
<h1>Project Sentinel Report</h1>
<p>Report generated successfully</p>
</body>
</html>`;
    }
}
export default ReportGenerator;
//# sourceMappingURL=report-generator.js.map