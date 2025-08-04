import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Storage service for managing monitored addresses and processed transactions
 */
class StorageService {
  constructor() {
    this.dataDir = config.paths.dataDir;
    this.monitoredAddressesPath = config.paths.monitoredAddresses;
    this.processedTransactionsPath = config.paths.processedTransactions;
    this.initialized = false;
  }

  /**
   * Initialize the storage service and create necessary directories/files
   */
  async initialize() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize monitored addresses file if it doesn't exist
      await this.ensureFile(this.monitoredAddressesPath, {
        addresses: [],
        lastUpdated: new Date().toISOString(),
      });
      
      // Initialize processed transactions file if it doesn't exist
      await this.ensureFile(this.processedTransactionsPath, {
        transactions: [],
        lastUpdated: new Date().toISOString(),
      });
      
      this.initialized = true;
      logger.success('Storage service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize storage service', error);
      throw error;
    }
  }

  /**
   * Ensure a file exists with default content if it doesn't
   * @param {string} filePath - Path to the file
   * @param {object} defaultContent - Default content to write if file doesn't exist
   */
  async ensureFile(filePath, defaultContent) {
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, create it with default content
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
      logger.debug(`Created file: ${filePath}`);
    }
  }

  /**
   * Read JSON data from a file
   * @param {string} filePath - Path to the file
   * @returns {object} Parsed JSON data
   */
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write JSON data to a file
   * @param {string} filePath - Path to the file
   * @param {object} data - Data to write
   */
  async writeJsonFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get all monitored addresses
   * @returns {Array} Array of monitored addresses
   */
  async getMonitoredAddresses() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.monitoredAddressesPath);
    return data.addresses || [];
  }

  /**
   * Add a new address to monitor
   * @param {string} address - Solana address to monitor
   * @param {string} label - Optional label for the address
   */
  async addMonitoredAddress(address, label = '') {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.monitoredAddressesPath);
    const addresses = data.addresses || [];
    
    // Check if address already exists
    const existingIndex = addresses.findIndex(addr => addr.address === address);
    
    if (existingIndex >= 0) {
      // Update existing address
      addresses[existingIndex] = {
        address,
        label,
        addedAt: addresses[existingIndex].addedAt,
        updatedAt: new Date().toISOString(),
      };
      logger.info(`Updated monitored address: ${address}`);
    } else {
      // Add new address
      addresses.push({
        address,
        label,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.success(`Added new monitored address: ${address}`);
    }
    
    data.addresses = addresses;
    data.lastUpdated = new Date().toISOString();
    
    await this.writeJsonFile(this.monitoredAddressesPath, data);
  }

  /**
   * Remove an address from monitoring
   * @param {string} address - Solana address to remove
   */
  async removeMonitoredAddress(address) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.monitoredAddressesPath);
    const addresses = data.addresses || [];
    
    const filteredAddresses = addresses.filter(addr => addr.address !== address);
    
    if (filteredAddresses.length === addresses.length) {
      logger.warn(`Address not found in monitored list: ${address}`);
      return;
    }
    
    data.addresses = filteredAddresses;
    data.lastUpdated = new Date().toISOString();
    
    await this.writeJsonFile(this.monitoredAddressesPath, data);
    logger.success(`Removed monitored address: ${address}`);
  }

  /**
   * Get processed transactions
   * @returns {Array} Array of processed transaction signatures
   */
  async getProcessedTransactions() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.processedTransactionsPath);
    return data.transactions || [];
  }

  /**
   * Add a transaction signature to processed list
   * @param {string} signature - Transaction signature
   * @param {object} transactionData - Optional transaction data
   */
  async addProcessedTransaction(signature, transactionData = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.processedTransactionsPath);
    const transactions = data.transactions || [];
    
    // Check if transaction already exists
    const existingIndex = transactions.findIndex(tx => tx.signature === signature);
    
    if (existingIndex >= 0) {
      // Update existing transaction
      transactions[existingIndex] = {
        signature,
        processedAt: transactions[existingIndex].processedAt,
        updatedAt: new Date().toISOString(),
        ...transactionData,
      };
    } else {
      // Add new transaction
      transactions.push({
        signature,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...transactionData,
      });
    }
    
    // Keep only the last 1000 transactions to prevent file from growing too large
    if (transactions.length > 1000) {
      transactions.splice(0, transactions.length - 1000);
    }
    
    data.transactions = transactions;
    data.lastUpdated = new Date().toISOString();
    
    await this.writeJsonFile(this.processedTransactionsPath, data);
  }

  /**
   * Check if a transaction has been processed
   * @param {string} signature - Transaction signature
   * @returns {boolean} True if transaction has been processed
   */
  async isTransactionProcessed(signature) {
    const processedTransactions = await this.getProcessedTransactions();
    return processedTransactions.some(tx => tx.signature === signature);
  }

  /**
   * Clear old processed transactions (older than specified days)
   * @param {number} days - Number of days to keep transactions
   */
  async clearOldTransactions(days = 7) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const data = await this.readJsonFile(this.processedTransactionsPath);
    const transactions = data.transactions || [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredTransactions = transactions.filter(tx => {
      const processedDate = new Date(tx.processedAt);
      return processedDate > cutoffDate;
    });
    
    if (filteredTransactions.length < transactions.length) {
      data.transactions = filteredTransactions;
      data.lastUpdated = new Date().toISOString();
      
      await this.writeJsonFile(this.processedTransactionsPath, data);
      logger.info(`Cleared ${transactions.length - filteredTransactions.length} old transactions`);
    }
  }

  /**
   * Get storage statistics
   * @returns {object} Storage statistics
   */
  async getStats() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const monitoredAddresses = await this.getMonitoredAddresses();
    const processedTransactions = await this.getProcessedTransactions();
    
    return {
      monitoredAddresses: monitoredAddresses.length,
      processedTransactions: processedTransactions.length,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Create and export a singleton instance
export const storageService = new StorageService(); 