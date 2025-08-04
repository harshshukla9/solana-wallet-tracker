#!/usr/bin/env node

import { logger } from './utils/logger.js';
import { config, validateConfig } from './config/config.js';
import { solanaMonitor } from './monitors/solana-monitor.js';
import { storageService } from './services/storage-service.js';
import { marketDataService } from './services/market-data-service.js';
import { tokenService } from './services/token-service.js';

/**
 * Main application class
 */
class SolanaAddressMonitor {
  constructor() {
    this.isShuttingDown = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      logger.header('Solana Address Activity Monitor');
      
      // Validate configuration
      validateConfig();
      logger.success('Configuration validated');
      
      // Initialize services
      await storageService.initialize();
      logger.success('Storage service initialized');
      
      // Initialize Solana monitor
      await solanaMonitor.initialize();
      logger.success('Solana monitor initialized');
      
      // Add some sample addresses for testing (optional)
      await this.addSampleAddresses();
      
      logger.success('Application initialized successfully');
      logger.footer();
      
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * Add sample addresses for testing
   */
  async addSampleAddresses() {
    try {
      // Add some popular Solana addresses for testing
      const sampleAddresses = [
        {
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          label: 'Sample Whale 1',
        },
        {
          address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
          label: 'Sample Whale 2',
        },
      ];

      for (const { address, label } of sampleAddresses) {
        try {
          await solanaMonitor.addAddress(address, label);
        } catch (error) {
          logger.debug(`Failed to add sample address ${address}:`, error.message);
        }
      }
    } catch (error) {
      logger.debug('Failed to add sample addresses:', error.message);
    }
  }

  /**
   * Start the application
   */
  async start() {
    try {
      logger.info('Starting Solana Address Activity Monitor...');
      
      // Start the monitor
      await solanaMonitor.start();
      
      // Display status
      this.displayStatus();
      
      // Set up periodic status updates
      setInterval(() => {
        if (!this.isShuttingDown) {
          this.displayStatus();
        }
      }, 60000); // Update every minute
      
      logger.info('Application is running. Press Ctrl+C to stop.');
      
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Display current status
   */
  displayStatus() {
    const status = solanaMonitor.getStatus();
    const addresses = solanaMonitor.getMonitoredAddresses();
    
    logger.info('=== Status Update ===');
    logger.info(`Monitor Running: ${status.isRunning ? 'Yes' : 'No'}`);
    logger.info(`WebSocket Connected: ${status.wsConnected ? 'Yes' : 'No'}`);
    logger.info(`RPC Connected: ${status.rpcConnected ? 'Yes' : 'No'}`);
    logger.info(`Monitored Addresses: ${status.monitoredAddresses}`);
    logger.info(`Retry Attempts: ${status.retryAttempts}`);
    
    if (addresses.length > 0) {
      logger.info('Monitored Addresses:');
      addresses.forEach((address, index) => {
        logger.info(`  ${index + 1}. ${address}`);
      });
    }
    
    logger.info('===================');
  }

  /**
   * Stop the application gracefully
   */
  async stop() {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    
    try {
      logger.info('Shutting down application...');
      
      // Stop the monitor
      await solanaMonitor.stop();
      
      // Clear caches
      marketDataService.clearCache();
      tokenService.clearCache();
      
      logger.success('Application stopped gracefully');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Handle command line arguments
   */
  handleCommandLineArgs() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--add':
        case '-a':
          if (i + 1 < args.length) {
            const address = args[i + 1];
            const label = i + 2 < args.length ? args[i + 2] : '';
            this.addAddressAndExit(address, label);
          }
          break;
          
        case '--remove':
        case '-r':
          if (i + 1 < args.length) {
            const address = args[i + 1];
            this.removeAddressAndExit(address);
          }
          break;
          
        case '--list':
        case '-l':
          this.listAddressesAndExit();
          break;
          
        case '--help':
        case '-h':
          this.showHelpAndExit();
          break;
      }
    }
  }

  /**
   * Add address and exit
   */
  async addAddressAndExit(address, label) {
    try {
      await solanaMonitor.initialize();
      await solanaMonitor.addAddress(address, label);
      logger.success(`Added address: ${address}`);
      process.exit(0);
    } catch (error) {
      logger.error(`Failed to add address: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Remove address and exit
   */
  async removeAddressAndExit(address) {
    try {
      await solanaMonitor.initialize();
      await solanaMonitor.removeAddress(address);
      logger.success(`Removed address: ${address}`);
      process.exit(0);
    } catch (error) {
      logger.error(`Failed to remove address: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * List addresses and exit
   */
  async listAddressesAndExit() {
    try {
      await solanaMonitor.initialize();
      const addresses = solanaMonitor.getMonitoredAddresses();
      
      if (addresses.length === 0) {
        logger.info('No addresses are being monitored.');
      } else {
        logger.info('Monitored addresses:');
        addresses.forEach((address, index) => {
          logger.info(`  ${index + 1}. ${address}`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      logger.error(`Failed to list addresses: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Show help and exit
   */
  showHelpAndExit() {
    logger.info('Solana Address Activity Monitor');
    logger.info('');
    logger.info('Usage:');
    logger.info('  node src/index.js                    # Start monitoring');
    logger.info('  node src/index.js --add <address>    # Add address to monitor');
    logger.info('  node src/index.js --remove <address> # Remove address from monitor');
    logger.info('  node src/index.js --list             # List monitored addresses');
    logger.info('  node src/index.js --help             # Show this help');
    logger.info('');
    logger.info('Environment Variables:');
    logger.info('  SOLANA_RPC_URL     # Solana RPC endpoint');
    logger.info('  SOLANA_WS_URL      # Solana WebSocket endpoint');
    logger.info('  POLLING_INTERVAL   # Polling interval in milliseconds');
    logger.info('  DEBUG              # Enable debug mode (true/false)');
    logger.info('');
    process.exit(0);
  }
}

/**
 * Main application entry point
 */
async function main() {
  const app = new SolanaAddressMonitor();
  
  // Handle command line arguments
  app.handleCommandLineArgs();
  
  // Set up graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    app.stop();
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    app.stop();
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    app.stop();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    app.stop();
  });
  
  try {
    // Initialize and start the application
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.error('Application failed to start:', error);
    process.exit(1);
  }
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
} 