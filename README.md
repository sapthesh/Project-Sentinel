# Project Sentinel

> **A powerful CLI tool for real-time system performance monitoring**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/project-sentinel)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.4.0-blue.svg)](https://www.typescriptlang.org/)
<a href="https://hits.sh/github.com/sapthesh/Project-Sentinel/"><img alt="Hits" src="https://hits.sh/github.com/sapthesh/Project-Sentinel.svg?view=today-total&color=fe7d37"/></a>

Project Sentinel is a modern Command-Line Interface (CLI) tool designed to monitor real-time system performance metrics, specifically CPU and memory utilization. Built with TypeScript and Node.js, it provides system administrators, developers, and DevOps engineers with an accessible, efficient way to gather, display, and export system performance data directly from the terminal.

---

## Features

### Real-Time Monitoring
- **Live Terminal Updates**: Continuous monitoring with configurable refresh intervals
- **Visual Progress Bars**: Color-coded metrics with threshold-based warning indicators
- **Auto-Termination**: Optional duration-based monitoring with graceful shutdown

### Snapshot Capture
- **Point-in-Time Metrics**: Instant system state capture
- **Multiple Output Formats**: Text or JSON output for scripting integration
- **Verbose Mode**: Detailed system information including uptime and swap usage

### Data Export
- **CSV Format**: Spreadsheet-compatible exports for analysis
- **JSON Format**: Structured data for programmatic consumption
- **Multi-Sample Collection**: Gather historical data with configurable intervals
- **Append Mode**: Add new samples to existing export files

### Cross-Platform Support
- Windows (PowerShell & CMD)
- macOS (Intel & Apple Silicon)
- Linux (all major distributions)

---

## Installation

### Prerequisites

- **Node.js** >= 18.0.0 (LTS recommended)
- **npm** or **yarn** package manager

### Quick Install

```bash
# Clone the repository
git clone https://github.com/your-org/project-sentinel.git
cd project-sentinel

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

---

## Usage Examples

### 1. Monitor Command

Start real-time system monitoring with live terminal updates:

```bash
# Basic monitoring with default settings (1 second refresh)
sentinel monitor

# Monitor every 500ms for 60 seconds
sentinel monitor -i 500 -d 60

# Quiet mode with custom thresholds
sentinel monitor --quiet --cpu 90 --mem 75

# All options specified
sentinel monitor --interval 1000 --duration 300 --threshold-cpu 80 --threshold-memory 85
```

**Monitor Output:**
```
╔══════════════════════════════════════╗
║       SENTINEL - System Monitor      ║
╠══════════════════════════════════════╣
║  CPU Usage:    ███████░░░ 72.5% ⚠️   ║
║  Memory:       ██░░░░░░░░ 12.3% ✅   ║
║  Disk I/O:     125 MB/s               ║
║  Network:      45 MB/s in / 12 MB/s out ║
╚══════════════════════════════════════╝
```

### 2. Snapshot Command

Capture a single point-in-time metrics snapshot:

```bash
# Simple snapshot with text output
sentinel snapshot

# Verbose mode with JSON output
sentinel snapshot --verbose --format json

# Short flags equivalent
sentinel snapshot -v -f json
```

**Snapshot Output (text):**
```
System Snapshot - 2026-04-16T14:30:00.000Z
===========================================
CPU:       45.2% (4 of 8 cores active)
Memory:    8.2 GB / 16 GB (51.2%)
Swap:      0.5 GB / 4 GB (12.5%)
Uptime:    7 days, 3 hours, 22 minutes
```

**Snapshot Output (JSON):**
```json
{
  "timestamp": "2026-04-16T14:30:00.000Z",
  "cpu": {
    "usage": 45.2,
    "cores": 8,
    "active": 4,
    "frequency": 2400
  },
  "memory": {
    "used": 8589934592,
    "total": 17179869184,
    "percentage": 51.2,
    "free": 8589934592
  }
}
```

### 3. Export Command

Export metrics data to file for external analysis:

```bash
# Export single snapshot as JSON
sentinel export metrics.json

# Collect 100 samples every 5 seconds as CSV
sentinel export performance.csv -f csv -n 100 -i 5000

# Append new samples to existing file
sentinel export metrics.json --append

# All options specified
sentinel export output.json --format json --samples 50 --interval 2000 --append
```

**CSV Export Example:**
```csv
timestamp,cpu_usage,cpu_cores,memory_used,memory_total,memory_percentage
2026-04-16T14:30:00.000Z,45.2,8,8589934592,17179869184,51.2
2026-04-16T14:30:05.000Z,48.7,8,8796093040,17179869184,51.2
```

---

## Command Reference

### `monitor` - Real-time monitoring

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--interval <ms>` | `-i` | `1000` | Refresh interval in milliseconds |
| `--duration <sec>` | `-d` | `null` | Auto-stop after duration (seconds) |
| `--quiet` | `-q` | `false` | Suppress colored output |
| `--threshold-cpu <pct>` | `--cpu` | `80` | CPU warning threshold (%) |
| `--threshold-memory <pct>` | `--mem` | `80` | Memory warning threshold (%) |

### `snapshot` - Single metrics capture

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--verbose` | `-v` | `false` | Include detailed metrics |
| `--format <fmt>` | `-f` | `text` | Output format (text/json) |

### `export` - File export

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `<output-file>` | — | (required) | Output file path |
| `--format <fmt>` | `-f` | `json` | Export format (json/csv) |
| `--samples <n>` | `-n` | `1` | Number of samples to collect |
| `--interval <ms>` | `-i` | `1000` | Interval between samples |
| `--append` | `-a` | `false` | Append to existing file |

---

## Configuration Options

### Environment Variables

Create a `.env` file in the project root for custom configuration:

```bash
# Environment configuration
NODE_ENV=production
LOG_LEVEL=info

# Custom thresholds
CPU_WARNING_THRESHOLD=80
MEMORY_WARNING_THRESHOLD=80
```

### Programmatic Configuration

For advanced use cases, configure Sentinel programmatically:

```typescript
import { setupCLI } from './src/cli';

// Custom configuration
const config = {
  defaultInterval: 1000,
  defaultDuration: null,
  thresholds: {
    cpu: 80,
    memory: 80
  },
  output: {
    colored: true,
    format: 'text'
  }
};
```

---

## Architecture

### System Overview

Project Sentinel follows a modular, service-oriented architecture designed for maintainability and testability:

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Layer                               │
│                    (commander.js)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ monitor  │  │ snapshot │  │  export  │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Layer                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ monitor.ts     │ │ snapshot.ts    │ │  export.ts     │   │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘   │
└──────────┼──────────────────┼──────────────────┼─────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ MetricsCollector   │ │ ReportGenerator    │             │
│  └────────┬───────────┘ └────────┬───────────┘             │
│           │                      │                         │
│  ┌────────────────────┐          │                         │
│  │ FileExporter       │◄─────────┘                         │
│  └────────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Model Layer                               │
│              (src/models/metrics.ts)                         │
│   SystemMetrics | CpuMetrics | MemoryMetrics                │
│   MetricsHistory | ExportOptions | MonitorOptions           │
└─────────────────────────────────────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ logger.ts  │ │constants.ts│ │formatters.ts│              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### Commands (`src/commands/`)
- **`monitor.ts`**: Handles continuous monitoring loop with interval-based updates
- **`snapshot.ts`**: Captures single-point metrics with format selection
- **`export.ts`**: Manages file export operations with multi-sample support

#### Services (`src/services/`)
- **`metrics-collector.ts`**: Core service interfacing with `systeminformation` package
- **`report-generator.ts`**: Formats output using `chalk` and `mustache`
- **`file-exporter.ts`**: Handles file I/O operations with append mode support

#### Models (`src/models/`)
- Type-safe TypeScript interfaces for all data structures
- Strong typing for metrics, configuration, and export options

#### Utilities (`src/utils/`)
- **`logger.ts`**: Centralized logging with severity levels
- **`constants.ts`**: Platform detection and configuration constants
- **`formatters.ts`**: Byte/duration formatting helpers

### Data Flow

```
User Input → CLI Parser → Command Handler → Services → Models → External APIs
                                              ↓
                                    Report Generator → Terminal/File Output
```

### Design Patterns

1. **Service Layer Pattern**: Separates business logic from command handlers
2. **Factory Pattern**: ReportGenerator creates different output formats
3. **Strategy Pattern**: MetricsCollector adapts to platform differences
4. **Async/await**: Non-blocking I/O for responsive terminal experience

---

## Security Notes

### Security Considerations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Privilege Escalation | Medium | No elevated permissions required for basic metrics |
| Path Traversal | Low | Input validation and path sanitization |
| Information Disclosure | Low | Sensitive data excluded from default output |

### Security Checklist

- [x] All file paths validated (prevents directory traversal)
- [x] User input sanitized for file operations
- [x] No sensitive system data logged
- [x] Safe file writing with proper encoding
- [x] Memory usage bounded for large exports

### Permission Requirements

- **Standard User**: Full functionality for basic metrics
- **Administrator/Root**: Required for detailed hardware metrics on some platforms

---

## Contributing

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-org/project-sentinel.git
   cd project-sentinel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests before making changes**
   ```bash
   npm test
   ```

4. **Make your changes and run the development server**
   ```bash
   npm run dev
   ```

5. **Run the full test suite**
   ```bash
   npm run test:coverage
   ```

6. **Lint and format your code**
   ```bash
   npm run lint
   npm run format
   ```

7. **Type check**
   ```bash
   npm run type-check
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Code Style

This project uses ESLint and Prettier for code consistency:

- **ESLint**: Code linting rules
- **Prettier**: Code formatting
- **TypeScript**: Strict mode enabled

Please follow the existing code style and conventions when contributing.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Project Sentinel Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- CLI framework: [commander](https://github.com/tj/commander.js)
- System metrics: [systeminformation](https://github.com/sebhily/systeminformation)
- Terminal styling: [chalk](https://github.com/chalk/chalk)
- Loading indicators: [ora](https://github.com/sindresorhus/ora)
- Template engine: [mustache](https://github.com/janl/mustache.js)

---

**Project Sentinel v1.0.0** | © 2026 Project Sentinel - Created by Sapthesh
