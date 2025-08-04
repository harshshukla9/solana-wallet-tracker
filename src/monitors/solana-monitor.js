import { Connection, PublicKey } from '@solana/web3.js';
import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { storageService } from '../services/storage-service.js';
import { transactionParser } from './transaction-parser.js';
import { formatAddress, formatTimestamp } from '../utils/formatters.js';

/**
 * Solana monitor for tracking wallet addresses
 */
class SolanaMonitor {
  constructor() {
    this.connection = null;
    this.wsConnection = null;
    this.monitoredAddresses = new Set();
    this.isRunning = false;
    this.pollingInterval = null;
    this.lastProcessedSignatures = new Map();
    this.retryAttempts = 0;
    this.maxRetryAttempts = config.app.retryAttempts;
    this.retryDelay = config.app.retryDelay;
  }

  /**
   * Initialize the Solana monitor
   */
  async initialize() {
    try {
      logger.info('Initializing Solana monitor...');
      
      // Initialize storage service
      await storageService.initialize();
      
      // Load monitored addresses
      await this.loadMonitoredAddresses();
      
      // Initialize Solana connection
      await this.initializeConnection();
      
      logger.success('Solana monitor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Solana monitor:', error);
      throw error;
    }
  }

  /**
   * Initialize Solana connection
   */
  async initializeConnection() {
    try {
      const { rpcUrl, wsUrl } = config.solana;
      
      // Initialize HTTP connection
      this.connection = new Connection(rpcUrl, 'confirmed');
      
      // Test connection
      const version = await this.connection.getVersion();
      logger.success(`Connected to Solana RPC (version: ${version['solana-core']})`);
      
      // Initialize WebSocket connection
      await this.initializeWebSocket(wsUrl);
      
    } catch (error) {
      logger.error('Failed to initialize Solana connection:', error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection
   * @param {string} wsUrl - WebSocket URL
   */
  async initializeWebSocket(wsUrl) {
    try {
      logger.logConnection('connecting', wsUrl);
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.on('open', () => {
        logger.logConnection('connected', wsUrl);
        this.retryAttempts = 0;
        this.subscribeToAccounts();
      });
      
      this.wsConnection.on('message', (data) => {
        this.handleWebSocketMessage(data);
      });
      
      this.wsConnection.on('close', () => {
        logger.logConnection('disconnected', wsUrl);
        this.handleWebSocketDisconnect();
      });
      
      this.wsConnection.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.handleWebSocketError();
      });
      
    } catch (error) {
      logger.error('Failed to initialize WebSocket connection:', error);
      throw error;
    }
  }

  /**
   * Subscribe to account notifications for monitored addresses
   */
  subscribeToAccounts() {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      return;
    }
    
    for (const address of this.monitoredAddresses) {
      try {
        const subscribeMessage = {
          jsonrpc: '2.0',
          id: 1,
          method: 'accountSubscribe',
          params: [
            address,
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
            },
          ],
        };
        
        this.wsConnection.send(JSON.stringify(subscribeMessage));
        logger.debug(`Subscribed to account: ${formatAddress(address)}`);
      } catch (error) {
        logger.error(`Failed to subscribe to account ${address}:`, error);
      }
    }
  }

  /**
   * Handle WebSocket messages
   * @param {Buffer} data - Raw message data
   */
  async handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.method === 'accountNotification') {
        await this.handleAccountNotification(message.params);
      } else if (message.method === 'logsNotification') {
        await this.handleLogsNotification(message.params);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle account notification
   * @param {object} params - Notification parameters
   */
  async handleAccountNotification(params) {
    try {
      const { result } = params;
      const address = result.value.owner;
      
      if (this.monitoredAddresses.has(address)) {
        logger.debug(`Account activity detected for: ${formatAddress(address)}`);
        await this.pollRecentTransactions(address);
      }
    } catch (error) {
      logger.error('Error handling account notification:', error);
    }
  }

  /**
   * Handle logs notification
   * @param {object} params - Notification parameters
   */
  async handleLogsNotification(params) {
    try {
      const { result } = params;
      const signature = result.value.signature;
      
      // Check if any monitored addresses are involved
      for (const address of this.monitoredAddresses) {
        if (result.value.logs.some(log => log.includes(address))) {
          logger.debug(`Log activity detected for: ${formatAddress(address)}`);
          await this.processTransaction(signature, address);
          break;
        }
      }
    } catch (error) {
      logger.error('Error handling logs notification:', error);
    }
  }

  /**
   * Handle WebSocket disconnect
   */
  handleWebSocketDisconnect() {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      logger.logConnection('reconnecting', config.solana.wsUrl);
      
      setTimeout(() => {
        this.initializeWebSocket(config.solana.wsUrl);
      }, this.retryDelay);
    } else {
      logger.error('Max retry attempts reached for WebSocket connection');
      this.startPollingMode();
    }
  }

  /**
   * Handle WebSocket error
   */
  handleWebSocketError() {
    logger.error('WebSocket connection error');
    this.handleWebSocketDisconnect();
  }

  /**
   * Start polling mode as fallback
   */
  startPollingMode() {
    logger.warn('Starting polling mode as fallback');
    
    this.pollingInterval = setInterval(async () => {
      for (const address of this.monitoredAddresses) {
        await this.pollRecentTransactions(address);
      }
    }, config.app.pollingInterval);
  }

  /**
   * Poll recent transactions for an address
   * @param {string} address - Address to poll
   */
  async pollRecentTransactions(address) {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit: 10 },
        'confirmed'
      );
      
      for (const sigInfo of signatures) {
        const signature = sigInfo.signature;
        
        // Check if we've already processed this signature
        if (await storageService.isTransactionProcessed(signature)) {
          continue;
        }
        
        await this.processTransaction(signature, address);
      }
    } catch (error) {
      logger.error(`Error polling transactions for ${formatAddress(address)}:`, error);
    }
  }

  /**
   * Process a transaction
   * @param {string} signature - Transaction signature
   * @param {string} address - Monitored address
   */
  async processTransaction(signature, address) {
    try {
      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!transaction) {
        return;
      }
      
      // Parse transaction
      const parsedData = await transactionParser.parseTransaction(transaction, address);
      
      if (parsedData) {
        // Log the transaction
        logger.logTransaction(parsedData.type, {
          address: formatAddress(address),
          signature: formatAddress(signature),
          platform: parsedData.platform,
          swap: parsedData.swap,
          transfer: parsedData.transfer,
          value: parsedData.value,
          tokenInfo: parsedData.tokenInfo,
          time: formatTimestamp(parsedData.blockTime * 1000),
        });
        
        // Mark as processed
        await storageService.addProcessedTransaction(signature, {
          type: parsedData.type,
          address,
          platform: parsedData.platform,
        });
      }
    } catch (error) {
      logger.error(`Error processing transaction ${signature}:`, error);
    }
  }

  /**
   * Load monitored addresses from storage
   */
  async loadMonitoredAddresses() {
    try {
      const addresses = await storageService.getMonitoredAddresses();
      this.monitoredAddresses.clear();
      
      for (const addressData of addresses) {
        this.monitoredAddresses.add(addressData.address);
      }
      
      logger.info(`Loaded ${this.monitoredAddresses.size} monitored addresses`);
    } catch (error) {
      logger.error('Error loading monitored addresses:', error);
    }
  }

  /**
   * Add an address to monitor
   * @param {string} address - Solana address to monitor
   * @param {string} label - Optional label for the address
   */
  async addAddress(address, label = '') {
    try {
      // Validate address
      new PublicKey(address);
      
      // Add to storage
      await storageService.addMonitoredAddress(address, label);
      
      // Add to local set
      this.monitoredAddresses.add(address);
      
      // Subscribe to WebSocket if connected
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        const subscribeMessage = {
          jsonrpc: '2.0',
          id: 1,
          method: 'accountSubscribe',
          params: [
            address,
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
            },
          ],
        };
        
        this.wsConnection.send(JSON.stringify(subscribeMessage));
      }
      
      logger.success(`Added address to monitor: ${formatAddress(address)}`);
    } catch (error) {
      logger.error(`Failed to add address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Remove an address from monitoring
   * @param {string} address - Solana address to remove
   */
  async removeAddress(address) {
    try {
      // Remove from storage
      await storageService.removeMonitoredAddress(address);
      
      // Remove from local set
      this.monitoredAddresses.delete(address);
      
      logger.success(`Removed address from monitoring: ${formatAddress(address)}`);
    } catch (error) {
      logger.error(`Failed to remove address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Start monitoring
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Monitor is already running');
      return;
    }
    
    try {
      this.isRunning = true;
      logger.info('Starting Solana monitor...');
      
      // Start polling as backup
      this.startPollingMode();
      
      logger.success('Solana monitor started successfully');
    } catch (error) {
      logger.error('Failed to start monitor:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Monitor is not running');
      return;
    }
    
    try {
      this.isRunning = false;
      
      // Clear polling interval
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      // Close WebSocket connection
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
      
      logger.success('Solana monitor stopped');
    } catch (error) {
      logger.error('Error stopping monitor:', error);
    }
  }

  /**
   * Get monitoring status
   * @returns {object} Monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredAddresses: this.monitoredAddresses.size,
      wsConnected: this.wsConnection?.readyState === WebSocket.OPEN,
      rpcConnected: !!this.connection,
      retryAttempts: this.retryAttempts,
    };
  }

  /**
   * Get monitored addresses
   * @returns {Array} Array of monitored addresses
   */
  getMonitoredAddresses() {
    return Array.from(this.monitoredAddresses);
  }
}

// Create and export a singleton instance
export const solanaMonitor = new SolanaMonitor(); 