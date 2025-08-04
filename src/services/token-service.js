import { logger } from '../utils/logger.js';
import { DEFAULT_TOKEN_METADATA, TOKEN_ADDRESSES } from '../utils/constants.js';
import { marketDataService } from './market-data-service.js';

/**
 * Token service for managing token metadata and information
 */
class TokenService {
  constructor() {
    this.tokenCache = new Map();
    this.metadataCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache
  }

  /**
   * Get token metadata by mint address
   * @param {string} mintAddress - Token mint address
   * @returns {object|null} Token metadata or null if not found
   */
  async getTokenMetadata(mintAddress) {
    try {
      // Check cache first
      const cached = this.getCachedMetadata(mintAddress);
      if (cached) return cached;

      // Check default metadata
      if (DEFAULT_TOKEN_METADATA[mintAddress]) {
        const metadata = DEFAULT_TOKEN_METADATA[mintAddress];
        this.setCachedMetadata(mintAddress, metadata);
        return metadata;
      }

      // Try to fetch from Jupiter API or other sources
      const metadata = await this.fetchTokenMetadata(mintAddress);
      if (metadata) {
        this.setCachedMetadata(mintAddress, metadata);
        return metadata;
      }

      // Return basic metadata if nothing else works
      const basicMetadata = {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 9,
        logo: null,
      };

      this.setCachedMetadata(mintAddress, basicMetadata);
      return basicMetadata;
    } catch (error) {
      logger.debug(`Failed to get token metadata for ${mintAddress}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch token metadata from external sources
   * @param {string} mintAddress - Token mint address
   * @returns {object|null} Token metadata or null if not found
   */
  async fetchTokenMetadata(mintAddress) {
    try {
      // For now, return null as we'll implement this later
      // This could fetch from Jupiter API, Solscan, or other sources
      return null;
    } catch (error) {
      logger.debug(`Failed to fetch token metadata for ${mintAddress}:`, error.message);
      return null;
    }
  }

  /**
   * Get token symbol by mint address
   * @param {string} mintAddress - Token mint address
   * @returns {string} Token symbol
   */
  async getTokenSymbol(mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    return metadata ? metadata.symbol : 'UNKNOWN';
  }

  /**
   * Get token name by mint address
   * @param {string} mintAddress - Token mint address
   * @returns {string} Token name
   */
  async getTokenName(mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    return metadata ? metadata.name : 'Unknown Token';
  }

  /**
   * Get token decimals by mint address
   * @param {string} mintAddress - Token mint address
   * @returns {number} Token decimals
   */
  async getTokenDecimals(mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    return metadata ? metadata.decimals : 9;
  }

  /**
   * Format token amount with symbol
   * @param {number} amount - Raw token amount
   * @param {string} mintAddress - Token mint address
   * @returns {string} Formatted token amount with symbol
   */
  async formatTokenAmount(amount, mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    const decimals = metadata ? metadata.decimals : 9;
    const symbol = metadata ? metadata.symbol : 'UNKNOWN';
    
    const adjustedAmount = amount / Math.pow(10, decimals);
    return `${adjustedAmount.toFixed(6).replace(/\.?0+$/, '')} ${symbol}`;
  }

  /**
   * Get comprehensive token information including price
   * @param {string} mintAddress - Token mint address
   * @returns {object} Complete token information
   */
  async getTokenInfo(mintAddress) {
    const [metadata, priceData] = await Promise.allSettled([
      this.getTokenMetadata(mintAddress),
      marketDataService.getTokenPrice(mintAddress),
    ]);

    const tokenInfo = {
      mint: mintAddress,
      metadata: metadata.status === 'fulfilled' ? metadata.value : null,
      price: priceData.status === 'fulfilled' ? priceData.value : null,
    };

    return tokenInfo;
  }

  /**
   * Get multiple tokens information
   * @param {Array} mintAddresses - Array of token mint addresses
   * @returns {object} Object with mint address as key and token info as value
   */
  async getBatchTokenInfo(mintAddresses) {
    const results = {};
    const promises = mintAddresses.map(async (mintAddress) => {
      const tokenInfo = await this.getTokenInfo(mintAddress);
      if (tokenInfo) {
        results[mintAddress] = tokenInfo;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Check if a token is SOL
   * @param {string} mintAddress - Token mint address
   * @returns {boolean} True if token is SOL
   */
  isSOL(mintAddress) {
    return mintAddress === TOKEN_ADDRESSES.SOL;
  }

  /**
   * Check if a token is USDC
   * @param {string} mintAddress - Token mint address
   * @returns {boolean} True if token is USDC
   */
  isUSDC(mintAddress) {
    return mintAddress === TOKEN_ADDRESSES.USDC;
  }

  /**
   * Check if a token is a stablecoin
   * @param {string} mintAddress - Token mint address
   * @returns {boolean} True if token is a stablecoin
   */
  isStablecoin(mintAddress) {
    const stablecoins = [
      TOKEN_ADDRESSES.USDC,
      TOKEN_ADDRESSES.USDT,
    ];
    return stablecoins.includes(mintAddress);
  }

  /**
   * Get popular token addresses
   * @returns {Array} Array of popular token addresses
   */
  getPopularTokens() {
    return Object.values(TOKEN_ADDRESSES);
  }

  /**
   * Get cached metadata if not expired
   * @param {string} mintAddress - Token mint address
   * @returns {object|null} Cached metadata or null if expired/not found
   */
  getCachedMetadata(mintAddress) {
    const cached = this.metadataCache.get(mintAddress);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.metadataCache.delete(mintAddress);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached metadata with timestamp
   * @param {string} mintAddress - Token mint address
   * @param {object} metadata - Metadata to cache
   */
  setCachedMetadata(mintAddress, metadata) {
    this.metadataCache.set(mintAddress, {
      data: metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the metadata cache
   */
  clearCache() {
    this.metadataCache.clear();
    logger.debug('Token metadata cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.metadataCache.size,
      timeout: this.cacheTimeout,
    };
  }

  /**
   * Get token display name (name + symbol)
   * @param {string} mintAddress - Token mint address
   * @returns {string} Token display name
   */
  async getTokenDisplayName(mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    if (!metadata) return 'Unknown Token (UNKNOWN)';
    
    return `${metadata.name} (${metadata.symbol})`;
  }

  /**
   * Get token logo URL
   * @param {string} mintAddress - Token mint address
   * @returns {string|null} Token logo URL or null if not available
   */
  async getTokenLogo(mintAddress) {
    const metadata = await this.getTokenMetadata(mintAddress);
    return metadata ? metadata.logo : null;
  }
}

// Create and export a singleton instance
export const tokenService = new TokenService(); 