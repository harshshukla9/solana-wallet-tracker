#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';
import { transactionParser } from './src/monitors/transaction-parser.js';

async function simpleMonitor() {
  try {
    logger.info('=== SIMPLE MONITOR STARTED ===');
    logger.info('Waiting for new transactions...');
    logger.info('Press Ctrl+C to stop');
    
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const addresses = [
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    ];
    
    const lastSignatures = new Map();
    
    // Initialize with current signatures
    for (const address of addresses) {
      const publicKey = new PublicKey(address);
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1 });
      if (signatures.length > 0) {
        lastSignatures.set(address, signatures[0].signature);
      }
    }
    
    logger.info(`Monitoring ${addresses.length} addresses...`);
    
    // Poll for new transactions
    setInterval(async () => {
      for (const address of addresses) {
        try {
          const publicKey = new PublicKey(address);
          const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 5 });
          
          if (signatures.length > 0) {
            const latestSig = signatures[0].signature;
            const lastSig = lastSignatures.get(address);
            
            if (lastSig !== latestSig) {
              logger.info(`🆕 New transaction detected for ${address}`);
              logger.info(`Signature: ${latestSig}`);
              logger.info(`Time: ${new Date(signatures[0].blockTime * 1000).toLocaleString()}`);
              
              // Get transaction details
              const transaction = await connection.getTransaction(latestSig, {
                maxSupportedTransactionVersion: 0,
              });
              
              if (transaction) {
                const parsedData = await transactionParser.parseTransaction(transaction, address);
                
                if (parsedData) {
                  logger.success('✅ RELEVANT TRANSACTION DETECTED!');
                  logger.info(`Type: ${parsedData.type}`);
                  logger.info(`Platform: ${parsedData.platform}`);
                  if (parsedData.swap) logger.info(`Swap: ${parsedData.swap}`);
                  if (parsedData.transfer) logger.info(`Transfer: ${parsedData.transfer}`);
                  if (parsedData.value) logger.info(`Value: ${parsedData.value}`);
                  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } else {
                  logger.warn('⚠️ Transaction found but not relevant to monitoring');
                }
              }
              
              lastSignatures.set(address, latestSig);
            }
          }
        } catch (error) {
          logger.error(`Error checking ${address}:`, error.message);
        }
      }
    }, 10000); // Check every 10 seconds
    
  } catch (error) {
    logger.error('Monitor failed:', error);
  }
}

simpleMonitor(); 