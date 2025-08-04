import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // Solana RPC Configuration
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    wsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  },

  // API Configuration
  apis: {
    jupiter: process.env.JUPITER_API_URL || 'https://price.jup.ag/v4',
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3',
    },
  },

  // Application Settings
  app: {
    pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 15000,
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    maxConcurrentConnections: parseInt(process.env.MAX_CONCURRENT_CONNECTIONS) || 5,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 5000,
  },

  // File Paths
  paths: {
    dataDir: join(__dirname, '../../data'),
    monitoredAddresses: join(__dirname, '../../data/monitored-addresses.json'),
    processedTransactions: join(__dirname, '../../data/processed-transactions.json'),
  },
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const required = ['solana.rpcUrl', 'solana.wsUrl'];
  
  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${path}`);
    }
  }
}

/**
 * Get configuration for a specific section
 * @param {string} section - Configuration section name
 * @returns {object} Configuration object for the section
 */
export function getConfig(section) {
  return config[section] || {};
} 