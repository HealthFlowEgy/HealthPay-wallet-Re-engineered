// ✅ FIXED: Proper Event Store Implementation
// Location: services/command-service/src/infrastructure/event-store.ts

import { Pool, PoolClient } from 'pg'
import { DomainEvent } from '../domain/events'
import { WalletAggregate } from '../domain/wallet-aggregate'

interface EventRecord {
  event_id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  event_data: any
  event_metadata: any
  version: number
  occurred_at: Date
}

export class PostgresEventStore {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Save events to event store
   * Uses optimistic concurrency control to prevent conflicts
   */
  async save(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')

      // Check current version for optimistic locking
      const versionResult = await client.query(
        'SELECT COALESCE(MAX(version), 0) as current_version FROM events WHERE aggregate_id = $1',
        [aggregateId]
      )
      
      const currentVersion = versionResult.rows[0].current_version

      // Concurrency check
      if (currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict: Expected version ${expectedVersion}, but found ${currentVersion}`
        )
      }

      // Insert events
      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        const version = expectedVersion + i + 1

        await client.query(
          `INSERT INTO events (
            event_id,
            aggregate_id,
            aggregate_type,
            event_type,
            event_data,
            event_metadata,
            version,
            occurred_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            event.eventId,
            aggregateId,
            'Wallet',
            event.type,
            JSON.stringify(event),
            JSON.stringify(event.metadata || {}),
            version,
            event.occurredAt
          ]
        )

        // Publish event to message queue for read-side projection
        await this.publishEvent(event, client)
      }

      await client.query('COMMIT')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Load all events for an aggregate
   */
  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const result = await this.pool.query<EventRecord>(
      `SELECT 
        event_id,
        aggregate_id,
        event_type,
        event_data,
        event_metadata,
        version,
        occurred_at
      FROM events
      WHERE aggregate_id = $1
      ORDER BY version ASC`,
      [aggregateId]
    )

    return result.rows.map(row => this.deserializeEvent(row))
  }

  /**
   * Get events after a specific version (for projections)
   */
  async getEventsAfterVersion(afterVersion: number, limit: number = 100): Promise<DomainEvent[]> {
    const result = await this.pool.query<EventRecord>(
      `SELECT 
        event_id,
        aggregate_id,
        event_type,
        event_data,
        event_metadata,
        version,
        occurred_at
      FROM events
      WHERE version > $1
      ORDER BY version ASC
      LIMIT $2`,
      [afterVersion, limit]
    )

    return result.rows.map(row => this.deserializeEvent(row))
  }

  /**
   * Get events by type (for specific projections)
   */
  async getEventsByType(eventType: string, limit: number = 100): Promise<DomainEvent[]> {
    const result = await this.pool.query<EventRecord>(
      `SELECT 
        event_id,
        aggregate_id,
        event_type,
        event_data,
        event_metadata,
        version,
        occurred_at
      FROM events
      WHERE event_type = $1
      ORDER BY occurred_at DESC
      LIMIT $2`,
      [eventType, limit]
    )

    return result.rows.map(row => this.deserializeEvent(row))
  }

  /**
   * Create snapshot for performance optimization
   */
  async createSnapshot(aggregateId: string, state: any, version: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO snapshots (
        aggregate_id,
        aggregate_type,
        state,
        version,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (aggregate_id)
      DO UPDATE SET
        state = EXCLUDED.state,
        version = EXCLUDED.version,
        created_at = EXCLUDED.created_at`,
      [aggregateId, 'Wallet', JSON.stringify(state), version]
    )
  }

  /**
   * Load snapshot
   */
  async getSnapshot(aggregateId: string): Promise<{ state: any; version: number } | null> {
    const result = await this.pool.query(
      'SELECT state, version FROM snapshots WHERE aggregate_id = $1',
      [aggregateId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return {
      state: result.rows[0].state,
      version: result.rows[0].version
    }
  }

  /**
   * Publish event to message queue
   */
  private async publishEvent(event: DomainEvent, client: PoolClient): Promise<void> {
    // Insert into outbox table for reliable message delivery
    await client.query(
      `INSERT INTO event_outbox (
        event_id,
        event_type,
        event_data,
        published
      ) VALUES ($1, $2, $3, false)`,
      [event.eventId, event.type, JSON.stringify(event)]
    )
  }

  /**
   * Deserialize event from database record
   */
  private deserializeEvent(record: EventRecord): DomainEvent {
    return {
      ...record.event_data,
      eventId: record.event_id,
      type: record.event_type,
      occurredAt: record.occurred_at,
      metadata: record.event_metadata
    }
  }
}

/**
 * ✅ FIXED: Aggregate Repository with Event Sourcing
 */
export class AggregateRepository {
  constructor(
    private eventStore: PostgresEventStore,
    private snapshotInterval: number = 100 // Create snapshot every 100 events
  ) {}

  /**
   * Load aggregate from event store
   */
  async load(aggregateId: string): Promise<WalletAggregate | null> {
    // Try to load from snapshot first (performance optimization)
    const snapshot = await this.eventStore.getSnapshot(aggregateId)
    
    let aggregate: WalletAggregate
    let eventsToReplay: DomainEvent[]
    let currentVersion: number

    if (snapshot) {
      // Load from snapshot
      aggregate = new WalletAggregate()
      aggregate.loadFromSnapshot(snapshot.state, snapshot.version)
      currentVersion = snapshot.version

      // Load events after snapshot
      eventsToReplay = await this.eventStore.getEvents(aggregateId)
      eventsToReplay = eventsToReplay.filter(e => e.metadata.version > snapshot.version)
    } else {
      // Load all events
      eventsToReplay = await this.eventStore.getEvents(aggregateId)
      
      if (eventsToReplay.length === 0) {
        return null // Aggregate doesn't exist
      }

      aggregate = new WalletAggregate()
      currentVersion = 0
    }

    // Replay events
    aggregate.loadFromHistory(eventsToReplay)

    // Create snapshot if needed
    if (eventsToReplay.length >= this.snapshotInterval) {
      await this.eventStore.createSnapshot(
        aggregateId,
        aggregate.getState(),
        currentVersion + eventsToReplay.length
      )
    }

    return aggregate
  }

  /**
   * Save aggregate
   */
  async save(aggregate: WalletAggregate): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents()
    
    if (uncommittedEvents.length === 0) {
      return // Nothing to save
    }

    const aggregateId = aggregate.getId()
    const expectedVersion = aggregate.getVersion() - uncommittedEvents.length

    await this.eventStore.save(aggregateId, uncommittedEvents, expectedVersion)

    aggregate.markEventsAsCommitted()
  }
}

/**
 * Database schema for event store
 */
export const EVENT_STORE_SCHEMA = `
  -- Events table
  CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    event_metadata JSONB,
    version INTEGER NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    UNIQUE(aggregate_id, version)
  );

  CREATE INDEX idx_events_aggregate ON events(aggregate_id, version);
  CREATE INDEX idx_events_type ON events(event_type);
  CREATE INDEX idx_events_occurred ON events(occurred_at DESC);

  -- Snapshots table for performance
  CREATE TABLE IF NOT EXISTS snapshots (
    aggregate_id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    state JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL
  );

  -- Event outbox for reliable messaging
  CREATE TABLE IF NOT EXISTS event_outbox (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_outbox_unpublished ON event_outbox(published, created_at) 
  WHERE published = false;
`;
