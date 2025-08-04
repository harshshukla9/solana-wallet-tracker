#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';
import { transactionParser } from './src/monitors/transaction-parser.js';

async function testActiveMonitor() {
  try {
    logger.info('=== TESTING ACTIVE MONITORING ===');
    
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const addresses = [
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'EKpQGSJtjMFqKZ1KQanSqYXRcF8fB8zEHYMkLdCmvj7',   // WIF
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',   // JUP
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'   // SAMO
    ];
    
    logger.info(`Testing ${addresses.length} active addresses...`);
    
    for (const address of addresses) {
      logger.info(`\n--- Testing ${address} ---`);
      
      const publicKey = new PublicKey(address);
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 3 },
        'confirmed'
      );
      
      logger.info(`Found ${signatures.length} recent transactions`);
      
      for (let i = 0; i < signatures.length; i++) {
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

testActiveMonitor(); 