/**
 * Project Sentinel - Export Command
 *
 * Collects and exports metrics data to files.
 *
 * Security features:
 * - Path validation delegated to FileExporter
 * - Input validation for all options
 * - Memory limit enforcement
 * - Atomic file writes
 * - Sanitized error messages
 */
/**
 * Export command handler
 *
 * @param outputPath Output file path
 * @param options Export configuration from CLI
 *
 * SECURITY:
 * - Validates all parameters
 * - Enforces memory limits
 * - Uses atomic writes via FileExporter
 * - Sanitizes error output
 */
export declare function handleExport(outputPath: string, options: {
    format: string;
    samples?: number;
    interval?: number;
    append?: boolean;
}): Promise<void>;
//# sourceMappingURL=export.d.ts.map