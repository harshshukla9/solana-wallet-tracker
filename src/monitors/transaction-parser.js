import { logger } from '../utils/logger.js';
import { DEX_PROGRAM_IDS, DEX_PLATFORMS, TRANSACTION_TYPES } from '../utils/constants.js';
import { tokenService } from '../services/token-service.js';
import { marketDataService } from '../services/market-data-service.js';
import { formatAddress, formatTokenAmount, formatUSD } from '../utils/formatters.js';

/**
 * Transaction parser for analyzing Solana transactions
 */
class TransactionParser {
  constructor() {
    this.dexProgramIds = Object.values(DEX_PROGRAM_IDS);
  }

  /**
   * Parse a Solana transaction to extract relevant information
   * @param {object} transaction - Solana transaction object
   * @param {string} monitoredAddress - The monitored address involved in the transaction
   * @returns {object|null} Parsed transaction data or null if not relevant
   */
  async parseTransaction(transaction, monitoredAddress) {
    try {
      if (!transaction || !transaction.meta || !transaction.transaction) {
        return null;
      }

      const signature = transaction.transaction.signatures[0];
      const blockTime = transaction.blockTime;
      const instructions = transaction.transaction.message.instructions;
      const accounts = transaction.transaction.message.accountKeys;

      // Check if transaction involves the monitored address
      const isInvolved = this.isAddressInvolved(accounts, monitoredAddress);
      if (!isInvolved) {
        logger.debug(`Address ${monitoredAddress} not involved in transaction`);
        return null;
      }
      
      logger.debug(`Address ${monitoredAddress} involved in transaction`);

      // Determine transaction type
      const transactionType = this.determineTransactionType(instructions);
      logger.debug(`Transaction type determined: ${transactionType}`);
      
      // Parse based on transaction type
      let parsedData = null;
      
      switch (transactionType) {
        case TRANSACTION_TYPES.SWAP:
          logger.debug('Attempting to parse as SWAP');
          parsedData = await this.parseSwapTransaction(transaction, monitoredAddress);
          break;
        case TRANSACTION_TYPES.TRANSFER:
          logger.debug('Attempting to parse as TRANSFER');
          parsedData = await this.parseTransferTransaction(transaction, monitoredAddress);
          break;
        case TRANSACTION_TYPES.DEFI:
          logger.debug('Attempting to parse as DEFI');
          parsedData = await this.parseDeFiTransaction(transaction, monitoredAddress);
          break;
        default:
          logger.debug('Attempting to parse as UNKNOWN');
          parsedData = await this.parseUnknownTransaction(transaction, monitoredAddress);
      }
      
      logger.debug(`Parsed data result: ${parsedData ? 'SUCCESS' : 'NULL'}`);

      if (parsedData) {
        parsedData.signature = signature;
        parsedData.blockTime = blockTime;
        parsedData.type = transactionType;
        parsedData.monitoredAddress = monitoredAddress;
      }

      return parsedData;
    } catch (error) {
      logger.error('Error parsing transaction:', error);
      return null;
    }
  }

  /**
   * Check if monitored address is involved in the transaction
   * @param {Array} accounts - Transaction account keys
   * @param {string} monitoredAddress - The monitored address
   * @returns {boolean} True if address is involved
   */
  isAddressInvolved(accounts, monitoredAddress) {
    if (!accounts || !Array.isArray(accounts)) {
      return false;
    }
    
    // Check if the monitored address appears in the account keys
    // Handle both string and object representations
    const isInAccounts = accounts.some(account => {
      const accountStr = typeof account === 'string' ? account : account.toString();
      return accountStr === monitoredAddress;
    });
    
    // Also check if it's the fee payer (first account)
    const firstAccount = accounts.length > 0 ? accounts[0] : null;
    const firstAccountStr = typeof firstAccount === 'string' ? firstAccount : firstAccount?.toString();
    const isFeePayer = firstAccountStr === monitoredAddress;
    
    // Accept any transaction where the address appears in any position
    return isInAccounts || isFeePayer;
  }

  /**
   * Determine the type of transaction based on instructions
   * @param {Array} instructions - Transaction instructions
   * @returns {string} Transaction type
   */
  determineTransactionType(instructions) {
    for (const instruction of instructions) {
      const programId = instruction.programId;
      
      // Check for DEX swaps
      if (this.dexProgramIds.includes(programId)) {
        return TRANSACTION_TYPES.SWAP;
      }
      
      // Check for System Program transfers
      if (programId === '11111111111111111111111111111111') {
        return TRANSACTION_TYPES.TRANSFER;
      }
      
      // Check for SPL Token Program
      if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        return TRANSACTION_TYPES.TRANSFER;
      }
    }
    
    return TRANSACTION_TYPES.UNKNOWN;
  }

  /**
   * Parse a swap transaction
   * @param {object} transaction - Transaction object
   * @param {string} monitoredAddress - Monitored address
   * @returns {object|null} Parsed swap data
   */
  async parseSwapTransaction(transaction, monitoredAddress) {
    try {
      const instructions = transaction.transaction.message.instructions;
      const accounts = transaction.transaction.message.accountKeys;
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;
      const preTokenBalances = transaction.meta.preTokenBalances || [];
      const postTokenBalances = transaction.meta.postTokenBalances || [];

      // Determine DEX platform
      const platform = this.determineDEXPlatform(instructions);
      
      // Extract token changes
      const tokenChanges = this.extractTokenChanges(
        preTokenBalances,
        postTokenBalances,
        accounts,
        monitoredAddress
      );

      if (tokenChanges.length < 2) {
        return null;
      }

      // Get token information
      const tokenInfos = await Promise.all(
        tokenChanges.map(async (change) => {
          const tokenInfo = await tokenService.getTokenInfo(change.mint);
          return {
            ...change,
            info: tokenInfo,
          };
        })
      );

      // Format swap description
      const inputToken = tokenInfos.find(t => t.change < 0);
      const outputToken = tokenInfos.find(t => t.change > 0);

      if (!inputToken || !outputToken) {
        return null;
      }

      const inputSymbol = inputToken.info?.metadata?.symbol || 'UNKNOWN';
      const outputSymbol = outputToken.info?.metadata?.symbol || 'UNKNOWN';
      const inputAmount = Math.abs(inputToken.change);
      const outputAmount = outputToken.change;

      const swapDescription = `${this.formatTokenAmount(inputAmount, inputToken.mint)} → ${this.formatTokenAmount(outputAmount, outputToken.mint)}`;

      // Calculate USD values
      const inputUSD = await this.calculateUSDValue(inputAmount, inputToken.mint);
      const outputUSD = await this.calculateUSDValue(outputAmount, outputToken.mint);

      return {
        platform,
        swap: swapDescription,
        inputToken: {
          mint: inputToken.mint,
          symbol: inputSymbol,
          amount: inputAmount,
          usdValue: inputUSD,
        },
        outputToken: {
          mint: outputToken.mint,
          symbol: outputSymbol,
          amount: outputAmount,
          usdValue: outputUSD,
        },
        value: inputUSD ? formatUSD(inputUSD) : 'Unknown',
        tokenInfo: outputToken.info?.price ? {
          symbol: outputSymbol,
          price: outputToken.info.price.priceFormatted,
          marketCap: outputToken.info.price.marketCapFormatted,
        } : null,
      };
    } catch (error) {
      logger.error('Error parsing swap transaction:', error);
      return null;
    }
  }

  /**
   * Parse a transfer transaction
   * @param {object} transaction - Transaction object
   * @param {string} monitoredAddress - Monitored address
   * @returns {object|null} Parsed transfer data
   */
  async parseTransferTransaction(transaction, monitoredAddress) {
    try {
      const accounts = transaction.transaction.message.accountKeys;
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;
      const preTokenBalances = transaction.meta.preTokenBalances || [];
      const postTokenBalances = transaction.meta.postTokenBalances || [];

      // Check for SOL transfer
      const solChange = this.calculateSOLChange(accounts, preBalances, postBalances, monitoredAddress);
      
      if (solChange !== 0) {
        const solInfo = await tokenService.getTokenInfo('So11111111111111111111111111111111111111112');
        const solUSD = await this.calculateUSDValue(Math.abs(solChange), 'So11111111111111111111111111111111111111112');
        
        return {
          platform: 'Solana Transfer',
          transfer: `${solChange > 0 ? '+' : ''}${this.formatTokenAmount(Math.abs(solChange), 'So11111111111111111111111111111111111111112')}`,
          value: solUSD ? formatUSD(solUSD) : 'Unknown',
          type: solChange > 0 ? 'Received' : 'Sent',
        };
      }

      // Check for token transfers
      const tokenChanges = this.extractTokenChanges(
        preTokenBalances,
        postTokenBalances,
        accounts,
        monitoredAddress
      );

      if (tokenChanges.length > 0) {
        const tokenChange = tokenChanges[0];
        const tokenInfo = await tokenService.getTokenInfo(tokenChange.mint);
        const tokenUSD = await this.calculateUSDValue(Math.abs(tokenChange.change), tokenChange.mint);
        
        return {
          platform: 'Token Transfer',
          transfer: `${tokenChange.change > 0 ? '+' : ''}${this.formatTokenAmount(Math.abs(tokenChange.change), tokenChange.mint)}`,
          value: tokenUSD ? formatUSD(tokenUSD) : 'Unknown',
          type: tokenChange.change > 0 ? 'Received' : 'Sent',
          tokenInfo: tokenInfo?.price ? {
            symbol: tokenInfo.metadata?.symbol || 'UNKNOWN',
            price: tokenInfo.price.priceFormatted,
            marketCap: tokenInfo.price.marketCapFormatted,
          } : null,
        };
      }

      return null;
    } catch (error) {
      logger.error('Error parsing transfer transaction:', error);
      return null;
    }
  }

  /**
   * Parse a DeFi transaction
   * @param {object} transaction - Transaction object
   * @param {string} monitoredAddress - Monitored address
   * @returns {object|null} Parsed DeFi data
   */
  async parseDeFiTransaction(transaction, monitoredAddress) {
    try {
      const instructions = transaction.transaction.message.instructions;
      const platform = this.determineDEXPlatform(instructions);
      
      return {
        platform,
        defi: 'DeFi Interaction',
        value: 'Unknown',
      };
    } catch (error) {
      logger.error('Error parsing DeFi transaction:', error);
      return null;
    }
  }

  /**
   * Parse an unknown transaction
   * @param {object} transaction - Transaction object
   * @param {string} monitoredAddress - Monitored address
   * @returns {object|null} Parsed unknown data
   */
  async parseUnknownTransaction(transaction, monitoredAddress) {
    try {
      const instructions = transaction.transaction.message.instructions;
      const accounts = transaction.transaction.message.accountKeys;
      
      // Try to identify any program interactions
      let platform = 'Unknown';
      for (const instruction of instructions) {
        const programId = instruction.programId;
        if (programId === '11111111111111111111111111111111') {
          platform = 'System Program';
        } else if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          platform = 'SPL Token Program';
        } else if (programId === 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') {
          platform = 'Associated Token Account';
        }
      }
      
      return {
        platform,
        activity: 'Transaction Detected',
        value: 'Unknown',
        type: 'UNKNOWN',
      };
    } catch (error) {
      logger.error('Error parsing unknown transaction:', error);
      return {
        platform: 'Unknown',
        activity: 'Transaction Detected',
        value: 'Unknown',
        type: 'UNKNOWN',
      };
    }
  }

  /**
   * Determine the DEX platform from instructions
   * @param {Array} instructions - Transaction instructions
   * @returns {string} DEX platform name
   */
  determineDEXPlatform(instructions) {
    for (const instruction of instructions) {
      const programId = instruction.programId;
      
      if (programId === DEX_PROGRAM_IDS.JUPITER_V6 || programId === DEX_PROGRAM_IDS.JUPITER_V4) {
        return DEX_PLATFORMS.JUPITER;
      } else if (programId === DEX_PROGRAM_IDS.RAYDIUM_AMM || programId === DEX_PROGRAM_IDS.RAYDIUM_CLMM) {
        return DEX_PLATFORMS.RAYDIUM;
      } else if (programId === DEX_PROGRAM_IDS.ORCA_WHIRLPOOL) {
        return DEX_PLATFORMS.ORCA;
      } else if (programId === DEX_PROGRAM_IDS.METEORA) {
        return DEX_PLATFORMS.METEORA;
      } else if (programId === DEX_PROGRAM_IDS.SERUM_V3) {
        return DEX_PLATFORMS.SERUM;
      } else if (programId === DEX_PROGRAM_IDS.OPENBOOK) {
        return DEX_PLATFORMS.OPENBOOK;
      }
    }
    
    return DEX_PLATFORMS.UNKNOWN;
  }

  /**
   * Extract token balance changes
   * @param {Array} preBalances - Pre-transaction token balances
   * @param {Array} postBalances - Post-transaction token balances
   * @param {Array} accounts - Transaction account keys
   * @param {string} monitoredAddress - Monitored address
   * @returns {Array} Array of token changes
   */
  extractTokenChanges(preBalances, postBalances, accounts, monitoredAddress) {
    const changes = [];
    const monitoredAccountIndex = accounts.findIndex(account => account === monitoredAddress);
    
    if (monitoredAccountIndex === -1) return changes;

    // Create maps for easy lookup
    const preBalanceMap = new Map();
    const postBalanceMap = new Map();

    preBalances.forEach(balance => {
      if (balance.owner === monitoredAddress) {
        preBalanceMap.set(balance.mint, balance.uiTokenAmount.amount);
      }
    });

    postBalances.forEach(balance => {
      if (balance.owner === monitoredAddress) {
        postBalanceMap.set(balance.mint, balance.uiTokenAmount.amount);
      }
    });

    // Calculate changes
    const allMints = new Set([...preBalanceMap.keys(), ...postBalanceMap.keys()]);
    
    for (const mint of allMints) {
      const preAmount = parseInt(preBalanceMap.get(mint) || '0');
      const postAmount = parseInt(postBalanceMap.get(mint) || '0');
      const change = postAmount - preAmount;
      
      if (change !== 0) {
        changes.push({
          mint,
          change,
          preAmount,
          postAmount,
        });
      }
    }

    return changes;
  }

  /**
   * Calculate SOL balance change
   * @param {Array} accounts - Transaction account keys
   * @param {Array} preBalances - Pre-transaction SOL balances
   * @param {Array} postBalances - Post-transaction SOL balances
   * @param {string} monitoredAddress - Monitored address
   * @returns {number} SOL balance change
   */
  calculateSOLChange(accounts, preBalances, postBalances, monitoredAddress) {
    const monitoredAccountIndex = accounts.findIndex(account => account === monitoredAddress);
    
    if (monitoredAccountIndex === -1) return 0;
    
    const preBalance = preBalances[monitoredAccountIndex] || 0;
    const postBalance = postBalances[monitoredAccountIndex] || 0;
    
    return postBalance - preBalance;
  }

  /**
   * Format token amount with proper decimals
   * @param {number} amount - Raw token amount
   * @param {string} mint - Token mint address
   * @returns {string} Formatted token amount
   */
  formatTokenAmount(amount, mint) {
    // For now, use default decimals. In a full implementation, you'd get this from token metadata
    const decimals = 9; // Default for most tokens
    const adjustedAmount = amount / Math.pow(10, decimals);
    return adjustedAmount.toFixed(6).replace(/\.?0+$/, '');
  }

  /**
   * Calculate USD value of a token amount
   * @param {number} amount - Raw token amount
   * @param {string} mint - Token mint address
   * @returns {number|null} USD value or null if price not available
   */
  async calculateUSDValue(amount, mint) {
    try {
      const priceData = await marketDataService.getTokenPrice(mint);
      if (!priceData) return null;
      
      const decimals = await tokenService.getTokenDecimals(mint);
      const tokenAmount = amount / Math.pow(10, decimals);
      return tokenAmount * priceData.price;
    } catch (error) {
      logger.debug(`Failed to calculate USD value for ${mint}:`, error.message);
      return null;
    }
  }
}

// Create and export a singleton instance
export const transactionParser = new TransactionParser(); 