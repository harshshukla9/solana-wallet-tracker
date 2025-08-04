#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';
import { transactionParser } from './src/monitors/transaction-parser.js';

async function testWalletMonitor() {
  try {
    logger.info('=== TESTING WALLET ADDRESSES ===');
    
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const addresses = [
      '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', // Active Wallet 1
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', // Active Wallet 2
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'  // Original whale
    ];
    
    logger.info(`Testing ${addresses.length} wallet addresses...`);
    
    for (const address of addresses) {
      logger.info(`\n--- Testing Wallet: ${address} ---`);
      
      const publicKey = new PublicKey(address);
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 5 },
        'confirmed'
      );
      
      logger.info(`Found ${signatures.length} recent transactions`);
      
      for (let i = 0; i < Math.min(signatures.length, 3); i++) {
        const sig = signatures[i];
        logger.info(`\nTransaction ${i + 1}: ${sig.signature}`);
        logger.info(`Time: ${new Date(sig.blockTime * 1000).toLocaleString()}`);
        
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (transaction) {
          const parsedData = await transactionParser.parseTransaction(transaction, address);
          
          if (parsedData) {
            logger.success('✅ TRANSACTION PARSED SUCCESSFULLY!');
            logger.info(`Type: ${parsedData.type}`);
            logger.info(`Platform: ${parsedData.platform}`);
            if (parsedData.swap) logger.info(`Swap: ${parsedData.swap}`);
            if (parsedData.transfer) logger.info(`Transfer: ${parsedData.transfer}`);
            if (parsedData.activity) logger.info(`Activity: ${parsedData.activity}`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          } else {
            logger.warn('⚠️ Transaction found but parser returned null');
          }
        }
      }
    }
    
    logger.info('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

testWalletMonitor(); 