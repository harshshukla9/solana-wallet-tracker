/**
 * Solana DEX Program IDs and important addresses
 */
export const DEX_PROGRAM_IDS = {
  // Jupiter Aggregator
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  JUPITER_V4: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  
  // Raydium
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  RAYDIUM_CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUQp5VhH5b9KmTcpY9',
  
  // Orca
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  
  // Meteora
  METEORA: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
  
  // Serum
  SERUM_V3: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  
  // OpenBook
  OPENBOOK: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
};

/**
 * Common token addresses
 */
export const TOKEN_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  SAMO: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  WIF: 'EKpQGSJtjMFqKZ1KQanSqYXRcF8fB8zEHYMkLdCmvj7',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVg58WUyNrm9sS9ZkqRqJxn',
};

/**
 * Transaction types for categorization
 */
export const TRANSACTION_TYPES = {
  SWAP: 'SWAP',
  TRANSFER: 'TRANSFER',
  NFT: 'NFT',
  DEFI: 'DEFI',
  UNKNOWN: 'UNKNOWN',
};

/**
 * DEX platforms for identification
 */
export const DEX_PLATFORMS = {
  JUPITER: 'Jupiter Aggregator',
  RAYDIUM: 'Raydium',
  ORCA: 'Orca',
  METEORA: 'Meteora',
  SERUM: 'Serum',
  OPENBOOK: 'OpenBook',
  UNKNOWN: 'Unknown DEX',
};

/**
 * Console colors for different transaction types
 */
export const CONSOLE_COLORS = {
  SWAP: 'green',
  TRANSFER: 'blue',
  NFT: 'magenta',
  DEFI: 'cyan',
  ERROR: 'red',
  WARNING: 'yellow',
  INFO: 'white',
  SUCCESS: 'green',
};

/**
 * WebSocket message types
 */
export const WS_MESSAGE_TYPES = {
  ACCOUNT_NOTIFICATION: 'accountNotification',
  LOGS_NOTIFICATION: 'logsNotification',
  SIGNATURE_NOTIFICATION: 'signatureNotification',
};

/**
 * Default token metadata for common tokens
 */
export const DEFAULT_TOKEN_METADATA = {
  [TOKEN_ADDRESSES.SOL]: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  [TOKEN_ADDRESSES.USDC]: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  [TOKEN_ADDRESSES.BONK]: {
    name: 'Bonk',
    symbol: 'BONK',
    decimals: 5,
    logo: 'https://arweave.net/hQB3q5Qj7yP8i0JqX7qX7qX7qX7qX7qX7qX7qX7qX7',
  },
}; 