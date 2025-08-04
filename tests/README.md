# Tests Directory

This directory contains all test files for the Solana Whale Tracker project.

## Directory Structure

### `/unit`
Contains unit tests for individual components and modules:
- `test-monitor.js` - Unit tests for the monitor functionality
- `test-active-monitor.js` - Unit tests for active monitoring features
- `test-wallet-monitor.js` - Unit tests for wallet monitoring

### `/integration`
Contains integration tests that test the interaction between different components:
- `simple-monitor.js` - Integration tests for the monitoring system
- `simple-show-all.js` - Integration tests for displaying all monitored data

### `/debug`
Contains debug scripts and utilities for troubleshooting:
- `debug-monitor.js` - Debug script for monitoring functionality
- `debug-accounts.js` - Debug script for account-related operations

## Running Tests

To run tests, navigate to the project root and use:

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:debug
```

## Adding New Tests

When adding new tests, please follow these conventions:
- Unit tests go in `/unit`
- Integration tests go in `/integration`
- Debug scripts go in `/debug`
- Use descriptive filenames that indicate the purpose of the test 