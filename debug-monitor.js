#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';
import { transactionParser } from './src/monitors/transaction-parser.js';

async function debugMonitoring() {
  try {
    logger.info('=== DEBUG MONITORING ===');
    
    // Test connection
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    logger.success(`Connected to Solana RPC (version: ${version['solana-core']})`);
    
    // Test addresses
    const testAddresses = [
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'
    ];
    
    for (const address of testAddresses) {
      logger.info(`\n--- Testing Address: ${address} ---`);
      
      const publicKey = new PublicKey(address);
      
      // Get recent signatures
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 3 },
        'confirmed'
      );
      
      logger.info(`Found ${signatures.length} recent transactions`);
      
      for (let i = 0; i < signatures.length; i++) {
        const sig = signatures[i];
        logger.info(`\nTransaction ${i + 1}: ${sig.signature}`);
        logger.info(`Block Time: ${new Date(sig.blockTime * 1000).toLocaleString()}`);
        
        // Get transaction details
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (transaction) {
          logger.success('✓ Transaction details retrieved');
          
          // Test parsing
          const parsedData = await transactionParser.parseTransaction(transaction, address);
          
          if (parsedData) {
            logger.success('✓ Transaction parsed successfully');
            logger.info(`Type: ${parsedData.type}`);
            logger.info(`Platform: ${parsedData.platform}`);
            if (parsedData.swap) logger.info(`Swap: ${parsedData.swap}`);
            if (parsedData.transfer) logger.info(`Transfer: ${parsedData.transfer}`);
            if (parsedData.value) logger.info(`Value: ${parsedData.value}`);
          } else {
            logger.warn('✗ Transaction parsing returned null (not relevant)');
          }
        } else {
          logger.warn('✗ Transaction not found');
        }
      }
    }
    
    logger.info('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    logger.error('Debug failed:', error);
  }
}

debugMonitoring(); 