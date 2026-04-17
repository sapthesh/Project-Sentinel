/**
 * Project Sentinel - Application Constants
 *
 * Centralized constants for consistent configuration across the application.
 */
import { DEFAULT_SECURITY_CONSTRAINTS } from '../models/metrics.js';
/**
 * Application metadata
 */
export const APP_NAME = 'Project Sentinel';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Real-time system performance monitoring CLI tool';
/**
 * Default command option values
 */
export const DEFAULT_MONITOR_INTERVAL = 1000; // 1 second
export const DEFAULT_MONITOR_DURATION = null; // Run indefinitely
export const DEFAULT_CPU_THRESHOLD = 80; // Percent
export const DEFAULT_MEMORY_THRESHOLD = 80; // Percent
export const DEFAULT_EXPORT_FORMAT = 'json';
export const DEFAULT_EXPORT_SAMPLES = 1;
export const DEFAULT_EXPORT_INTERVAL = 1000;
/**
 * Valid option ranges for input validation
 */
export const OPTION_RANGES = {
    monitorInterval: { min: 100, max: 60000, unit: 'ms' },
    monitorDuration: { min: 1, max: 3600, unit: 'seconds' },
    cpuThreshold: { min: 0, max: 100, unit: 'percent' },
    memoryThreshold: { min: 0, max: 100, unit: 'percent' },
    exportSamples: { min: 1, max: 10000, unit: 'samples' },
    exportInterval: { min: 100, max: 300000, unit: 'ms' }
};
/**
 * File extension mappings
 */
export const FILE_EXTENSIONS = {
    json: '.json',
    csv: '.csv',
    html: '.html',
    mustache: '.mustache'
};
/**
 * Valid export formats
 */
export const VALID_EXPORT_FORMATS = ['json', 'csv', 'html'];
/**
 * Valid snapshot output formats
 */
export const VALID_SNAPSHOT_FORMATS = ['text', 'json'];
/**
 * Platform detection
 */
export const PLATFORM = process.platform;
export const IS_WINDOWS = PLATFORM === 'win32';
export const IS_MACOS = PLATFORM === 'darwin';
export const IS_LINUX = PLATFORM === 'linux';
/**
 * Line ending based on platform
 */
export const LINE_ENDING = IS_WINDOWS ? '\r\n' : '\n';
/**
 * Security constraints (enforced across all operations)
 */
export const SECURITY_CONSTRAINTS = DEFAULT_SECURITY_CONSTRAINTS;
/**
 * Path security configuration
 * Prevents path traversal and injection attacks
 */
export const PATH_SECURITY = {
    /** Patterns that indicate path traversal attempts */
    traversalPatterns: ['..', '\\\\', '%00', '%2e%2e'],
    /** Maximum directory depth allowed */
    maxDepth: 10,
    /** Reserved path names to block */
    reservedNames: [
        'CON',
        'PRN',
        'AUX',
        'NUL',
        'COM1',
        'COM2',
        'COM3',
        'COM4',
        'COM5',
        'COM6',
        'COM7',
        'COM8',
        'COM9',
        'LPT1',
        'LPT2',
        'LPT3',
        'LPT4',
        'LPT5',
        'LPT6',
        'LPT7',
        'LPT8',
        'LPT9'
    ]
};
/**
 * Template paths relative to source directory
 */
export const TEMPLATE_PATH = '../templates/report.mustache';
/**
 * Color theme for terminal output
 * ANSI color codes for chalk
 */
export const COLORS = {
    primary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'cyan',
    highlight: 'magenta',
    dim: 'gray'
};
/**
 * Status indicator characters
 */
export const STATUS_ICONS = {
    success: '\u2705', // check mark
    warning: '\u26A0', // warning triangle
    error: '\u274C', // cross mark
    info: '\u2139', // information
    loading: '\u231B', // watch
    stop: '\u25A0' // square
};
/**
 * Box drawing characters for terminal displays
 */
export const BOX_CHARS = {
    topLeft: '\u2554',
    topRight: '\u2557',
    bottomLeft: '\u255A',
    bottomRight: '\u255D',
    horizontal: '\u2500',
    vertical: '\u2502',
    cross: '\u253C',
    teeDown: '\u2524',
    teeUp: '\u252C',
    teeLeft: '\u251C',
    teeRight: '\u2524'
};
/**
 * Progress bar configuration
 */
export const PROGRESS_BAR = {
    segments: 10,
    filled: '\u2588',
    empty: '\u2591'
};
/**
 * Error codes for sentinel-specific errors
 */
export const ERROR_CODES = {
    INVALID_PATH: 'SENTINEL_E_INVALID_PATH',
    PATH_TRAVERSAL: 'SENTINEL_E_PATH_TRAVERSAL',
    FILE_NOT_FOUND: 'SENTINEL_E_FILE_NOT_FOUND',
    FILE_TOO_LARGE: 'SENTINEL_E_FILE_TOO_LARGE',
    INVALID_INPUT: 'SENTINEL_E_INVALID_INPUT',
    INPUT_OUT_OF_RANGE: 'SENTINEL_E_OUT_OF_RANGE',
    MEMORY_LIMIT: 'SENTINEL_E_MEMORY_LIMIT',
    SAMPLE_LIMIT: 'SENTINEL_E_SAMPLE_LIMIT',
    COLLECTION_ERROR: 'SENTINEL_E_COLLECTION',
    EXPORT_ERROR: 'SENTINEL_E_EXPORT',
    TEMPLATE_ERROR: 'SENTINEL_E_TEMPLATE',
    PERMISSION_ERROR: 'SENTINEL_E_PERMISSION'
};
/**
 * Log level configuration
 */
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
/**
 * Default log level
 */
export const DEFAULT_LOG_LEVEL = LOG_LEVELS.INFO;
//# sourceMappingURL=constants.js.map