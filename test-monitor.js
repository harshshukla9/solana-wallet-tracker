#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';

async function testMonitoring() {
  try {
    logger.info('Testing Solana monitoring...');
    
    // Test connection
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    logger.success(`Connected to Solana RPC (version: ${version['solana-core']})`);
    
    // Test address
    const testAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const publicKey = new PublicKey(testAddress);
    
    logger.info(`Checking recent transactions for: ${testAddress}`);
    
    // Get recent signatures
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit: 5 },
      'confirmed'
    );
    
    logger.success(`Found ${signatures.length} recent transactions`);
    
    for (let i = 0; i < Math.min(signatures.length, 3); i++) {
      const sig = signatures[i];
      logger.info(`Transaction ${i + 1}: ${sig.signature}`);
      logger.info(`  Block Time: ${new Date(sig.blockTime * 1000).toLocaleString()}`);
      logger.info(`  Slot: ${sig.slot}`);
    }
    
    // Test getting transaction details
    if (signatures.length > 0) {
      const firstSig = signatures[0].signature;
      logger.info(`Getting details for: ${firstSig}`);
      
      const transaction = await connection.getTransaction(firstSig, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (transaction) {
        logger.success('Transaction details retrieved successfully');
        logger.info(`  Block Time: ${new Date(transaction.blockTime * 1000).toLocaleString()}`);
        logger.info(`  Fee: ${transaction.meta.fee}`);
        logger.info(`  Instructions: ${transaction.transaction.message.instructions.length}`);
      } else {
        logger.warn('Transaction not found');
      }
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

testMonitoring(); 