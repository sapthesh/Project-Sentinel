/**
 * Project Sentinel - Application Constants
 *
 * Centralized constants for consistent configuration across the application.
 */
import { SecurityConstraints } from '../models/metrics.js';
/**
 * Application metadata
 */
export declare const APP_NAME = "Project Sentinel";
export declare const APP_VERSION = "1.0.0";
export declare const APP_DESCRIPTION = "Real-time system performance monitoring CLI tool";
/**
 * Default command option values
 */
export declare const DEFAULT_MONITOR_INTERVAL = 1000;
export declare const DEFAULT_MONITOR_DURATION: null;
export declare const DEFAULT_CPU_THRESHOLD = 80;
export declare const DEFAULT_MEMORY_THRESHOLD = 80;
export declare const DEFAULT_EXPORT_FORMAT: "json";
export declare const DEFAULT_EXPORT_SAMPLES = 1;
export declare const DEFAULT_EXPORT_INTERVAL = 1000;
/**
 * Valid option ranges for input validation
 */
export declare const OPTION_RANGES: {
    monitorInterval: {
        readonly min: 100;
        readonly max: 60000;
        readonly unit: "ms";
    };
    monitorDuration: {
        readonly min: 1;
        readonly max: 3600;
        readonly unit: "seconds";
    };
    cpuThreshold: {
        readonly min: 0;
        readonly max: 100;
        readonly unit: "percent";
    };
    memoryThreshold: {
        readonly min: 0;
        readonly max: 100;
        readonly unit: "percent";
    };
    exportSamples: {
        readonly min: 1;
        readonly max: 10000;
        readonly unit: "samples";
    };
    exportInterval: {
        readonly min: 100;
        readonly max: 300000;
        readonly unit: "ms";
    };
};
/**
 * File extension mappings
 */
export declare const FILE_EXTENSIONS: {
    readonly json: ".json";
    readonly csv: ".csv";
    readonly html: ".html";
    readonly mustache: ".mustache";
};
/**
 * Valid export formats
 */
export declare const VALID_EXPORT_FORMATS: readonly ["json", "csv", "html"];
/**
 * Valid snapshot output formats
 */
export declare const VALID_SNAPSHOT_FORMATS: readonly ["text", "json"];
/**
 * Platform detection
 */
export declare const PLATFORM: "win32" | "darwin" | "linux";
export declare const IS_WINDOWS: boolean;
export declare const IS_MACOS: boolean;
export declare const IS_LINUX: boolean;
/**
 * Line ending based on platform
 */
export declare const LINE_ENDING: string;
/**
 * Security constraints (enforced across all operations)
 */
export declare const SECURITY_CONSTRAINTS: SecurityConstraints;
/**
 * Path security configuration
 * Prevents path traversal and injection attacks
 */
export declare const PATH_SECURITY: {
    /** Patterns that indicate path traversal attempts */
    traversalPatterns: readonly ["..", "\\\\", "%00", "%2e%2e"];
    /** Maximum directory depth allowed */
    maxDepth: number;
    /** Reserved path names to block */
    reservedNames: readonly ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
};
/**
 * Template paths relative to source directory
 */
export declare const TEMPLATE_PATH = "../templates/report.mustache";
/**
 * Color theme for terminal output
 * ANSI color codes for chalk
 */
export declare const COLORS: {
    readonly primary: "blue";
    readonly success: "green";
    readonly warning: "yellow";
    readonly error: "red";
    readonly info: "cyan";
    readonly highlight: "magenta";
    readonly dim: "gray";
};
/**
 * Status indicator characters
 */
export declare const STATUS_ICONS: {
    readonly success: "✅";
    readonly warning: "⚠";
    readonly error: "❌";
    readonly info: "ℹ";
    readonly loading: "⌛";
    readonly stop: "■";
};
/**
 * Box drawing characters for terminal displays
 */
export declare const BOX_CHARS: {
    readonly topLeft: "╔";
    readonly topRight: "╗";
    readonly bottomLeft: "╚";
    readonly bottomRight: "╝";
    readonly horizontal: "─";
    readonly vertical: "│";
    readonly cross: "┼";
    readonly teeDown: "┤";
    readonly teeUp: "┬";
    readonly teeLeft: "├";
    readonly teeRight: "┤";
};
/**
 * Progress bar configuration
 */
export declare const PROGRESS_BAR: {
    readonly segments: 10;
    readonly filled: "█";
    readonly empty: "░";
};
/**
 * Error codes for sentinel-specific errors
 */
export declare const ERROR_CODES: {
    readonly INVALID_PATH: "SENTINEL_E_INVALID_PATH";
    readonly PATH_TRAVERSAL: "SENTINEL_E_PATH_TRAVERSAL";
    readonly FILE_NOT_FOUND: "SENTINEL_E_FILE_NOT_FOUND";
    readonly FILE_TOO_LARGE: "SENTINEL_E_FILE_TOO_LARGE";
    readonly INVALID_INPUT: "SENTINEL_E_INVALID_INPUT";
    readonly INPUT_OUT_OF_RANGE: "SENTINEL_E_OUT_OF_RANGE";
    readonly MEMORY_LIMIT: "SENTINEL_E_MEMORY_LIMIT";
    readonly SAMPLE_LIMIT: "SENTINEL_E_SAMPLE_LIMIT";
    readonly COLLECTION_ERROR: "SENTINEL_E_COLLECTION";
    readonly EXPORT_ERROR: "SENTINEL_E_EXPORT";
    readonly TEMPLATE_ERROR: "SENTINEL_E_TEMPLATE";
    readonly PERMISSION_ERROR: "SENTINEL_E_PERMISSION";
};
/**
 * Log level configuration
 */
export declare const LOG_LEVELS: {
    readonly DEBUG: 0;
    readonly INFO: 1;
    readonly WARN: 2;
    readonly ERROR: 3;
};
/**
 * Default log level
 */
export declare const DEFAULT_LOG_LEVEL: 1;
//# sourceMappingURL=constants.d.ts.map