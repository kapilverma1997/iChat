/**
 * RabbitMQ Consumer Service
 * 
 * This service runs as a separate process to consume messages from RabbitMQ.
 * It handles:
 * - Message delivery to online users via Socket.IO
 * - Message storage in MongoDB
 * - Read receipt processing
 * - Presence updates
 * 
 * Run this as a separate service:
 * node services/rabbitmq-consumer.js
 * 
 * Or use PM2:
 * pm2 start services/rabbitmq-consumer.js --name rabbitmq-consumer
 */

import dotenv from 'dotenv';
import { initRabbitMQ } from '../lib/rabbitmq.js';
import { startAllConsumers } from '../lib/messageConsumer.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Graceful shutdown handler
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  try {
    const { closeRabbitMQ } = await import('../lib/rabbitmq.js');
    await closeRabbitMQ();
    console.log('RabbitMQ connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

// Retry connection with exponential backoff
async function retryConnection(maxRetries = 5, initialDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} to connect to RabbitMQ...`);
      await initRabbitMQ();
      return true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Connection refused. Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('\n❌ Failed to connect to RabbitMQ after', maxRetries, 'attempts');
          console.error('\n📋 RabbitMQ is not running. Please install and start RabbitMQ:');
          console.error('\n   Windows (using Chocolatey):');
          console.error('   > choco install rabbitmq');
          console.error('   > rabbitmq-service start');
          console.error('\n   Windows (using Docker):');
          console.error('   > docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management');
          console.error('\n   macOS (using Homebrew):');
          console.error('   > brew install rabbitmq');
          console.error('   > brew services start rabbitmq');
          console.error('\n   Linux (Ubuntu/Debian):');
          console.error('   > sudo apt-get install rabbitmq-server');
          console.error('   > sudo systemctl start rabbitmq-server');
          console.error('\n   Or use Docker:');
          console.error('   > docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management');
          console.error('\n   After starting RabbitMQ, run this command again:');
          console.error('   > npm run consumer:dev');
          console.error('\n   Management UI will be available at: http://localhost:15672');
          console.error('   Default credentials: guest / guest');
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  return false;
}

// Start the consumer service
async function start() {
  try {
    console.log('🚀 Starting RabbitMQ Consumer Service...');
    console.log('📡 Connecting to RabbitMQ...');
    
    // Retry connection with exponential backoff
    await retryConnection();
    
    // Start all consumers
    await startAllConsumers();
    
    console.log('✅ RabbitMQ Consumer Service is running');
    console.log('Press Ctrl+C to stop');
  } catch (error) {
    console.error('\n❌ Failed to start RabbitMQ Consumer Service:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure RabbitMQ is running before starting the consumer service.');
    }
    process.exit(1);
  }
}

// Start the service
start();

