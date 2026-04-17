/**
 * Project Sentinel - Jest Configuration
 *
 * Configures Jest for TypeScript testing with code coverage.
 */

/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],

  // Module file extensions for imports
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        }
      }
    ]
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts' // Exclude entry point
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  coverageDirectory: 'coverage',

  // Test results processor
  reporters: ['default'],

  // Verbose test output
  verbose: true,

  // Show test names in output
  testNamePattern: undefined,

  // Bail after first test failure
  bail: false,

  // Run tests in parallel
  maxWorkers: '50%',

  // ClearMocks before each test
  clearMocks: true,

  // Reset modules between tests
  resetMocks: false,

  // Reset modules between tests
  restoreMocks: false,

  // Reset all mock implementations
  resetModules: false,

  // Test timeout in milliseconds
  testTimeout: 10000,

  // Force exit after all tests complete
  forceExit: false,

  // Watch path for changes
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Module path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  }
};
