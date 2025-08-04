import chalk from 'chalk';
import { formatTimestamp } from './formatters.js';
import { config } from '../config/config.js';

/**
 * Logger class for colored console output
 */
class Logger {
  constructor() {
    this.debugMode = config.app.debug;
    this.logLevel = config.app.logLevel;
  }

  /**
   * Get timestamp for log messages
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    return formatTimestamp(new Date());
  }

  /**
   * Log a debug message (only shown in debug mode)
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  debug(message, data = null) {
    if (!this.debugMode) return;
    
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}] DEBUG:`);
    console.log(`${prefix} ${chalk.cyan(message)}`);
    
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  info(message, data = null) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}] INFO:`);
    console.log(`${prefix} ${chalk.white(message)}`);
    
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log a success message
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  success(message, data = null) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}] SUCCESS:`);
    console.log(`${prefix} ${chalk.green(message)}`);
    
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {object} data - Optional data to include
   */
  warn(message, data = null) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}] WARN:`);
    console.log(`${prefix} ${chalk.yellow(message)}`);
    
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Error} error - Optional error object
   */
  error(message, error = null) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}] ERROR:`);
    console.log(`${prefix} ${chalk.red(message)}`);
    
    if (error) {
      console.log(chalk.red(error.stack || error.message));
    }
  }

  /**
   * Log a transaction event with rich formatting
   * @param {string} type - Transaction type (SWAP, TRANSFER, etc.)
   * @param {object} transaction - Transaction data
   */
  logTransaction(type, transaction) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}]`);
    
    // Get color based on transaction type
    let color;
    let emoji;
    
    switch (type) {
      case 'SWAP':
        color = chalk.green;
        emoji = '🔄';
        break;
      case 'TRANSFER':
        color = chalk.blue;
        emoji = '💸';
        break;
      case 'NFT':
        color = chalk.magenta;
        emoji = '🖼️';
        break;
      case 'DEFI':
        color = chalk.cyan;
        emoji = '🏦';
        break;
      case 'UNKNOWN':
        color = chalk.yellow;
        emoji = '📝';
        break;
      default:
        color = chalk.white;
        emoji = '📝';
    }
    
    console.log(`${prefix} ${emoji} ${color(type)} DETECTED`);
    console.log(`${prefix} ${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
    
    // Log transaction details
    if (transaction.address) {
      console.log(`${prefix} 👤 Address: ${chalk.cyan(transaction.address)}`);
    }
    
    if (transaction.signature) {
      console.log(`${prefix} 🔗 Signature: ${chalk.cyan(transaction.signature)}`);
    }
    
    if (transaction.platform) {
      console.log(`${prefix} 💱 Platform: ${chalk.yellow(transaction.platform)}`);
    }
    
    if (transaction.swap) {
      console.log(`${prefix} 📊 Swap: ${chalk.green(transaction.swap)}`);
    }
    
    if (transaction.transfer) {
      console.log(`${prefix} 💸 Transfer: ${chalk.blue(transaction.transfer)}`);
    }
    
    if (transaction.activity) {
      console.log(`${prefix} 📝 Activity: ${chalk.yellow(transaction.activity)}`);
    }
    
    if (transaction.value) {
      console.log(`${prefix} 💰 Value: ${chalk.green(transaction.value)}`);
    }
    
    if (transaction.tokenInfo) {
      const { symbol, price, marketCap } = transaction.tokenInfo;
      console.log(`${prefix} 📈 ${symbol} Price: ${chalk.green(price)} | Market Cap: ${chalk.green(marketCap)}`);
    }
    
    if (transaction.time) {
      console.log(`${prefix} ⏰ Time: ${chalk.gray(transaction.time)}`);
    }
    
    console.log(`${prefix} ${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
  }

  /**
   * Log a connection status message
   * @param {string} status - Connection status
   * @param {string} endpoint - The endpoint being connected to
   */
  logConnection(status, endpoint) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}]`);
    
    switch (status) {
      case 'connecting':
        console.log(`${prefix} 🔌 ${chalk.yellow('Connecting to')} ${chalk.cyan(endpoint)}`);
        break;
      case 'connected':
        console.log(`${prefix} ✅ ${chalk.green('Connected to')} ${chalk.cyan(endpoint)}`);
        break;
      case 'disconnected':
        console.log(`${prefix} ❌ ${chalk.red('Disconnected from')} ${chalk.cyan(endpoint)}`);
        break;
      case 'reconnecting':
        console.log(`${prefix} 🔄 ${chalk.yellow('Reconnecting to')} ${chalk.cyan(endpoint)}`);
        break;
    }
  }

  /**
   * Log a market data update
   * @param {string} symbol - Token symbol
   * @param {object} data - Market data
   */
  logMarketData(symbol, data) {
    const timestamp = this.getTimestamp();
    const prefix = chalk.gray(`[${timestamp}]`);
    
    console.log(`${prefix} 📊 ${chalk.cyan(symbol)} Market Update:`);
    console.log(`${prefix}    Price: ${chalk.green(data.price)}`);
    console.log(`${prefix}    Market Cap: ${chalk.green(data.marketCap)}`);
    console.log(`${prefix}    Volume: ${chalk.green(data.volume)}`);
  }

  /**
   * Print a separator line
   * @param {string} character - Character to use for separator (default: '━')
   */
  separator(character = '━') {
    console.log(chalk.gray(character.repeat(80)));
  }

  /**
   * Print a header with title
   * @param {string} title - The header title
   */
  header(title) {
    this.separator('═');
    console.log(chalk.cyan.bold(`  ${title}`));
    this.separator('═');
  }

  /**
   * Print a footer
   */
  footer() {
    this.separator('═');
  }
}

// Create and export a singleton instance
export const logger = new Logger(); 