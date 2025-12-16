/**
 * Event Store Service
 * 
 * Handles publishing events to Kafka and idempotency tracking
 */

import { Kafka, Producer, Partitioners, CompressionTypes } from 'kafkajs';
import { DomainEvent, EventEnvelope } from '../domain/events';
import pino from 'pino';

const logger = pino({ name: 'event-store' });

export interface EventStoreConfig {
  kafka: {
    brokers: string[];
    clientId: string;
    topic: string;
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
  };
  idempotency?: {
    enabled: boolean;
    storageType: 'memory' | 'redis';  // For now, just memory
  };
}

export class EventStore {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private topic: string;
  private publishedEventIds: Set<string> = new Set();  // Simple in-memory dedup
  private isConnected = false;

  constructor(private config: EventStoreConfig) {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      ssl: config.kafka.ssl,
      sasl: config.kafka.sasl
    });

    this.topic = config.kafka.topic;
  }

  /**
   * Initialize connection to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
      transactionalId: `event-store-${this.config.kafka.clientId}`,
      maxInFlightRequests: 5,
      idempotent: true
    });

    await this.producer.connect();
    this.isConnected = true;

    logger.info({
      brokers: this.config.kafka.brokers,
      topic: this.topic
    }, 'Event store connected to Kafka');
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Event store disconnected from Kafka');
    }
  }

  /**
   * Publish a single event
   */
  async publishEvent(event: DomainEvent, aggregateVersion: number): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Event store not connected');
    }

    // Check for duplicate (idempotency)
    if (this.config.idempotency?.enabled && this.publishedEventIds.has(event.eventId)) {
      logger.warn({ eventId: event.eventId }, 'Duplicate event detected, skipping');
      return;
    }

    const envelope = this.createEnvelope(event, aggregateVersion);

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: event.aggregateId,  // Partition by aggregate ID for ordering
          value: JSON.stringify(envelope),
          headers: {
            'event-type': event.eventType,
            'aggregate-type': event.aggregateType,
            'event-version': String(event.eventVersion),
            'causation-id': event.causationId || '',
            'correlation-id': event.correlationId || ''
          }
        }
      ],
      compression: CompressionTypes.GZIP
    });

    // Track published event
    if (this.config.idempotency?.enabled) {
      this.publishedEventIds.add(event.eventId);
      
      // Prevent unbounded memory growth (keep last 100k)
      if (this.publishedEventIds.size > 100000) {
        const firstKey = this.publishedEventIds.values().next().value;
        this.publishedEventIds.delete(firstKey);
      }
    }

    logger.debug({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateVersion
    }, 'Event published');
  }

  /**
   * Publish multiple events (transaction)
   */
  async publishEvents(
    events: DomainEvent[],
    aggregateVersions: number[]
  ): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Event store not connected');
    }

    if (events.length !== aggregateVersions.length) {
      throw new Error('Events and versions arrays must have same length');
    }

    // Start transaction
    const transaction = await this.producer.transaction();

    try {
      const messages = events.map((event, index) => {
        const envelope = this.createEnvelope(event, aggregateVersions[index]);
        
        return {
          key: event.aggregateId,
          value: JSON.stringify(envelope),
          headers: {
            'event-type': event.eventType,
            'aggregate-type': event.aggregateType,
            'event-version': String(event.eventVersion),
            'causation-id': event.causationId || '',
            'correlation-id': event.correlationId || ''
          }
        };
      });

      await transaction.send({
        topic: this.topic,
        messages,
        compression: CompressionTypes.GZIP
      });

      await transaction.commit();

      // Track published events
      if (this.config.idempotency?.enabled) {
        events.forEach(e => this.publishedEventIds.add(e.eventId));
      }

      logger.info({
        eventCount: events.length,
        aggregateId: events[0]?.aggregateId
      }, 'Events published in transaction');

    } catch (error) {
      await transaction.abort();
      logger.error({ error }, 'Failed to publish events, transaction aborted');
      throw error;
    }
  }

  /**
   * Publish events with batching for high throughput
   */
  async publishBatch(
    eventBatches: Array<{ event: DomainEvent; version: number }>
  ): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Event store not connected');
    }

    const messages = eventBatches.map(({ event, version }) => {
      const envelope = this.createEnvelope(event, version);
      
      return {
        key: event.aggregateId,
        value: JSON.stringify(envelope),
        headers: {
          'event-type': event.eventType,
          'aggregate-type': event.aggregateType,
          'event-version': String(event.eventVersion)
        }
      };
    });

    await this.producer.send({
      topic: this.topic,
      messages,
      compression: CompressionTypes.GZIP
    });

    logger.info({ batchSize: messages.length }, 'Event batch published');
  }

  /**
   * Create event envelope
   */
  private createEnvelope(event: DomainEvent, aggregateVersion: number): EventEnvelope {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      eventVersion: event.eventVersion,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      aggregateVersion,
      timestamp: event.timestamp,
      causationId: event.causationId,
      correlationId: event.correlationId,
      userId: event.userId,
      payload: event,
      metadata: event.metadata
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; connected: boolean }> {
    try {
      if (!this.producer || !this.isConnected) {
        return { status: 'unhealthy', connected: false };
      }

      // Try to get metadata (lightweight check)
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return { status: 'healthy', connected: true };
    } catch (error) {
      logger.error({ error }, 'Event store health check failed');
      return { status: 'unhealthy', connected: false };
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      isConnected: this.isConnected,
      publishedEventCount: this.publishedEventIds.size,
      topic: this.topic,
      brokers: this.config.kafka.brokers
    };
  }
}
