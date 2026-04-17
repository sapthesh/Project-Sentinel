/**
 * Project Sentinel - CLI Entry Point
 *
 * Main CLI setup using commander with comprehensive security features.
 *
 * Security features:
 * - Input validation for all numeric options
 * - Bounds checking for all parameters
 * - Safe error handling
 * - Sanitized error messages
 */
import { Command } from 'commander';
/**
 * Main CLI setup using commander
 *
 * SECURITY:
 * - All numeric inputs are validated
 * - String inputs are sanitized
 * - Command handlers receive validated data
 */
export declare function setupCLI(): void;
/**
 * Initialize the CLI application
 *
 * @returns Configured Commander program instance
 *
 * SECURITY: Handles global errors and process signals
 */
export declare function init(): Promise<Command>;
//# sourceMappingURL=cli.d.ts.map