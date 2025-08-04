import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { formatUSD, formatNumber } from '../utils/formatters.js';

/**
 * Market data service for fetching token prices and market information
 */
class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
    this.jupiterApiUrl = config.apis.jupiter;
    this.coingeckoConfig = config.apis.coingecko;
  }

  /**
   * Get token price from Jupiter API
   * @param {string} tokenMint - Token mint address
   * @returns {object|null} Token price data or null if not found
   */
  async getJupiterPrice(tokenMint) {
    try {
      const cacheKey = `jupiter_${tokenMint}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`${this.jupiterApiUrl}/price`, {
        params: { ids: tokenMint },
        timeout: 5000,
      });

      if (response.data && response.data.data && response.data.data[tokenMint]) {
        const priceData = response.data.data[tokenMint];
        const result = {
          price: priceData.price,
          volume24h: priceData.volume24h || 0,
          marketCap: priceData.marketCap || 0,
          source: 'Jupiter',
        };

        this.setCachedData(cacheKey, result);
        return result;
      }

      return null;
    } catch (error) {
      logger.debug(`Failed to get Jupiter price for ${tokenMint}:`, error.message);
      return null;
    }
  }

  /**
   * Get token price from CoinGecko API
   * @param {string} tokenMint - Token mint address
   * @returns {object|null} Token price data or null if not found
   */
  async getCoinGeckoPrice(tokenMint) {
    try {
      const cacheKey = `coingecko_${tokenMint}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // First, get the CoinGecko ID for the token
      const searchResponse = await axios.get(`${this.coingeckoConfig.baseUrl}/search`, {
        params: { query: tokenMint },
        timeout: 5000,
      });

      if (!searchResponse.data.coins || searchResponse.data.coins.length === 0) {
        return null;
      }

      const coinId = searchResponse.data.coins[0].id;
      const priceResponse = await axios.get(`${this.coingeckoConfig.baseUrl}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
        },
        timeout: 5000,
      });

      if (priceResponse.data && priceResponse.data[coinId]) {
        const data = priceResponse.data[coinId];
        const result = {
          price: data.usd,
          volume24h: data.usd_24h_vol || 0,
          marketCap: data.usd_market_cap || 0,
          source: 'CoinGecko',
        };

        this.setCachedData(cacheKey, result);
        return result;
      }

      return null;
    } catch (error) {
      logger.debug(`Failed to get CoinGecko price for ${tokenMint}:`, error.message);
      return null;
    }
  }

  /**
   * Get token price from multiple sources
   * @param {string} tokenMint - Token mint address
   * @returns {object|null} Token price data or null if not found
   */
  async getTokenPrice(tokenMint) {
    // Try Jupiter first (faster for Solana tokens)
    let priceData = await this.getJupiterPrice(tokenMint);
    
    if (!priceData) {
      // Fallback to CoinGecko
      priceData = await this.getCoinGeckoPrice(tokenMint);
    }

    if (priceData) {
      // Format the data for display
      return {
        ...priceData,
        priceFormatted: formatUSD(priceData.price),
        volume24hFormatted: formatUSD(priceData.volume24h),
        marketCapFormatted: formatUSD(priceData.marketCap),
      };
    }

    return null;
  }

  /**
   * Get market data for multiple tokens
   * @param {Array} tokenMints - Array of token mint addresses
   * @returns {object} Object with token mint as key and price data as value
   */
  async getBatchTokenPrices(tokenMints) {
    const results = {};
    const promises = tokenMints.map(async (tokenMint) => {
      const priceData = await this.getTokenPrice(tokenMint);
      if (priceData) {
        results[tokenMint] = priceData;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Calculate USD value of a token amount
   * @param {number} amount - Token amount
   * @param {number} decimals - Token decimals
   * @param {string} tokenMint - Token mint address
   * @returns {object|null} USD value data or null if price not available
   */
  async calculateUSDValue(amount, decimals, tokenMint) {
    const priceData = await this.getTokenPrice(tokenMint);
    if (!priceData) return null;

    const tokenAmount = amount / Math.pow(10, decimals);
    const usdValue = tokenAmount * priceData.price;

    return {
      tokenAmount,
      usdValue,
      price: priceData.price,
      priceFormatted: priceData.priceFormatted,
      usdValueFormatted: formatUSD(usdValue),
    };
  }

  /**
   * Get cached data if not expired
   * @param {string} key - Cache key
   * @returns {object|null} Cached data or null if expired/not found
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data with timestamp
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    logger.debug('Market data cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
    };
  }

  /**
   * Get SOL price in USD
   * @returns {object|null} SOL price data
   */
  async getSOLPrice() {
    return await this.getTokenPrice('So11111111111111111111111111111111111111112');
  }

  /**
   * Get USDC price (should always be ~$1)
   * @returns {object|null} USDC price data
   */
  async getUSDCPrice() {
    return await this.getTokenPrice('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  }

  /**
   * Get popular token prices
   * @returns {object} Popular token prices
   */
  async getPopularTokenPrices() {
    const popularTokens = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // SAMO
      'EKpQGSJtjMFqKZ1KQanSqYXRcF8fB8zEHYMkLdCmvj7', // WIF
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
    ];

    return await this.getBatchTokenPrices(popularTokens);
  }
}

// Create and export a singleton instance
export const marketDataService = new MarketDataService(); 