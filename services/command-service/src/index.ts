/**
 * Main Application Entry Point
 */

import express from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import { EventStore, EventStoreConfig } from './eventstore/event-store';
import { CommandHandler } from './commands/command-handler';
import { createCommandApi } from './api/command-api';
import { metrics } from './utils/metrics';

// Load environment variables
dotenv.config();

const logger = pino({
  name: 'healthpay-command-service',
  level: process.env.LOG_LEVEL || 'info'
});

// =============================================================================
// Configuration
// =============================================================================

const config: EventStoreConfig = {
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:19092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'healthpay-command-service',
    topic: process.env.KAFKA_TOPIC || 'healthpay.events.wallet',
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: process.env.KAFKA_SASL_USERNAME ? {
      mechanism: 'plain',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD || ''
    } : undefined
  },
  idempotency: {
    enabled: process.env.IDEMPOTENCY_ENABLED !== 'false',
    storageType: 'memory'
  }
};

const PORT = parseInt(process.env.PORT || '3000');

// =============================================================================
// Application Setup
// =============================================================================

class Application {
  private app: express.Application;
  private eventStore: EventStore;
  private commandHandler: CommandHandler;

  constructor() {
    this.app = express();
    this.eventStore = new EventStore(config);
    this.commandHandler = new CommandHandler(this.eventStore);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    // Connect to Kafka
    logger.info('Connecting to Kafka...');
    await this.eventStore.connect();
    logger.info('Connected to Kafka');

    // Setup Express middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration
        }, 'Request completed');
      });

      next();
    });

    // Mount command API
    this.app.use('/api/v2', createCommandApi(this.commandHandler));

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send(await metrics.getMetrics());
    });

    // Health endpoint
    this.app.get('/health', async (req, res) => {
      const eventStoreHealth = await this.eventStore.healthCheck();
      
      const health = {
        status: eventStoreHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        components: {
          eventStore: eventStoreHealth
        }
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error({ err }, 'Unhandled error');
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'production' 
            ? 'An internal error occurred'
            : err.message
        }
      });
    });
  }

  /**
   * Start the HTTP server
   */
  async start() {
    await this.initialize();

    this.app.listen(PORT, () => {
      logger.info({
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        kafka: config.kafka.brokers
      }, 'HealthPay Command Service started');
    });
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    logger.info('Shutting down...');
    
    await this.eventStore.disconnect();
    
    logger.info('Shutdown complete');
    process.exit(0);
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const app = new Application();

  // Handle shutdown signals
  process.on('SIGTERM', () => app.shutdown());
  process.on('SIGINT', () => app.shutdown());

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
  });

  // Start application
  await app.start();
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    logger.fatal({ error }, 'Failed to start application');
    process.exit(1);
  });
}

export { Application };
