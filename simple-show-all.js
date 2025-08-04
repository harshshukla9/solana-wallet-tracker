#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from './src/utils/logger.js';
import { config } from './src/config/config.js';

async function showAllTransactions() {
  try {
    logger.info('=== SHOWING ALL TRANSACTIONS ===');
    
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    const addresses = [
      '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', // Active Wallet 1
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', // Active Wallet 2
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'  // Original whale
    ];
    
    for (const address of addresses) {
      logger.info(`\n🔍 Monitoring: ${address}`);
      
      const publicKey = new PublicKey(address);
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 3 },
        'confirmed'
      );
      
      logger.info(`Found ${signatures.length} recent transactions`);
      
      for (let i = 0; i < signatures.length; i++) {
        const sig = signatures[i];
        const time = new Date(sig.blockTime * 1000).toLocaleString();
        
        logger.success(`\n📝 Transaction ${i + 1}:`);
        logger.info(`   Signature: ${sig.signature}`);
        logger.info(`   Time: ${time}`);
        logger.info(`   Status: ${sig.confirmationStatus}`);
        
        // Get transaction details
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (transaction) {
          const accounts = transaction.transaction.message.accountKeys;
          const instructions = transaction.transaction.message.instructions;
          
          logger.info(`   Accounts involved: ${accounts.length}`);
          logger.info(`   Instructions: ${instructions.length}`);
          
          // Check if our address is the fee payer (first account)
          const isFeePayer = accounts.length > 0 && accounts[0] === address;
          logger.info(`   Is fee payer: ${isFeePayer ? '✅ YES' : '❌ NO'}`);
          
          // Show first few accounts
          logger.info(`   First 3 accounts:`);
          for (let j = 0; j < Math.min(3, accounts.length); j++) {
            const isOurAddress = accounts[j] === address;
            const marker = isOurAddress ? '👤' : '  ';
            logger.info(`     ${marker} ${accounts[j]}`);
          }
          
          logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
      }
    }
    
    logger.info('\n=== COMPLETE ===');
    
  } catch (error) {
    logger.error('Error:', error);
  }
}

showAllTransactions(); 