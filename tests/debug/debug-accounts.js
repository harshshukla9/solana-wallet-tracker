#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';

async function debugAccounts() {
  try {
    logger.info('=== DEBUGGING ACCOUNT STRUCTURE ===');
    
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const address = '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9';
    
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit: 1 },
      'confirmed'
    );
    
    if (signatures.length > 0) {
      const sig = signatures[0];
      logger.info(`Transaction: ${sig.signature}`);
      
      const transaction = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (transaction) {
        const accounts = transaction.transaction.message.accountKeys;
        logger.info(`\nAccount structure:`);
        logger.info(`Type: ${typeof accounts}`);
        logger.info(`Is Array: ${Array.isArray(accounts)}`);
        logger.info(`Length: ${accounts.length}`);
        
        logger.info(`\nFirst 5 accounts:`);
        for (let i = 0; i < Math.min(5, accounts.length); i++) {
          const account = accounts[i];
          const isOurAddress = account === address;
          const marker = isOurAddress ? '👤' : '  ';
          logger.info(`${marker} [${i}] ${account}`);
        }
        
        logger.info(`\nLooking for our address: ${address}`);
        const found = accounts.some(acc => acc === address);
        logger.info(`Found in accounts: ${found}`);
        
        logger.info(`\nAll accounts:`);
        accounts.forEach((acc, i) => {
          const isOurAddress = acc === address;
          const marker = isOurAddress ? '👤' : '  ';
          logger.info(`${marker} [${i}] ${acc}`);
        });
      }
    }
    
  } catch (error) {
    logger.error('Error:', error);
  }
}

debugAccounts(); 