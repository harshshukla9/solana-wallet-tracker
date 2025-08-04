/**
 * Utility functions for formatting data for console display
 */

/**
 * Format a Solana address for display (truncate to first 4 and last 4 characters)
 * @param {string} address - The address to format
 * @param {number} prefixLength - Number of characters to show at start (default: 4)
 * @param {number} suffixLength - Number of characters to show at end (default: 4)
 * @returns {string} Formatted address
 */
export function formatAddress(address, prefixLength = 4, suffixLength = 4) {
  if (!address || address.length < prefixLength + suffixLength + 3) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format a number with appropriate units (K, M, B)
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  } else {
    return num.toFixed(decimals);
  }
}

/**
 * Format a USD amount with proper currency formatting
 * @param {number} amount - The amount in USD
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted USD amount
 */
export function formatUSD(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a token amount based on its decimals
 * @param {number} amount - Raw token amount
 * @param {number} decimals - Token decimals
 * @param {number} displayDecimals - Number of decimal places to display (default: 6)
 * @returns {string} Formatted token amount
 */
export function formatTokenAmount(amount, decimals, displayDecimals = 6) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  
  const adjustedAmount = amount / Math.pow(10, decimals);
  return adjustedAmount.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

/**
 * Format a percentage with proper sign and color indication
 * @param {number} percentage - The percentage value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {object} Object with formatted string and color
 */
export function formatPercentage(percentage, decimals = 2) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return { text: '0%', color: 'white' };
  }
  
  const formatted = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(decimals)}%`;
  const color = percentage > 0 ? 'green' : percentage < 0 ? 'red' : 'white';
  
  return { text: formatted, color };
}

/**
 * Format a timestamp for display
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Format a duration in milliseconds to human readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Create a progress bar for console display
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {number} width - Width of the progress bar (default: 20)
 * @returns {string} Progress bar string
 */
export function createProgressBar(current, total, width = 20) {
  const percentage = total > 0 ? current / total : 0;
  const filledWidth = Math.round(width * percentage);
  const emptyWidth = width - filledWidth;
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  return `[${filled}${empty}] ${(percentage * 100).toFixed(1)}%`;
}

/**
 * Format a large number with commas
 * @param {number} num - The number to format
 * @returns {string} Formatted number with commas
 */
export function formatWithCommas(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
} 