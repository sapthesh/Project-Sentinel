/**
 * Project Sentinel - Snapshot Command
 *
 * Captures and displays a single metrics snapshot.
 *
 * Security features:
 * - Input validation for format option
 * - Safe error handling
 * - Sanitized output
 */
import { SnapshotOptions } from '../models/metrics.js';
/**
 * Snapshot command handler
 *
 * @param options Snapshot configuration from CLI
 *
 * SECURITY:
 * - Validates format option against whitelist
 * - Handles errors gracefully
 * - Sanitizes output data
 */
export declare function handleSnapshot(options: SnapshotOptions): Promise<void>;
//# sourceMappingURL=snapshot.d.ts.map