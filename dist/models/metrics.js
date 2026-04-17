/**
 * Project Sentinel - Data Models and Interfaces
 *
 * Defines the core data structures for system metrics collection,
 * reporting, and export operations.
 */
/**
 * Default security constraints
 * These values enforce memory and resource limits
 */
export const DEFAULT_SECURITY_CONSTRAINTS = {
    maxSamples: 10000,
    maxMemoryBytes: 500 * 1024 * 1024, // 500MB
    maxFileSizeBytes: 100 * 1024 * 1024, // 100MB
    maxPathLength: 260, // Windows max path length
    forbiddenPathChars: ['\0', '\n', '\r']
};
//# sourceMappingURL=metrics.js.map