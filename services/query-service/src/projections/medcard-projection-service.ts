/**
 * HealthPay Ledger V2 - Sprint 4
 * MedCard Projection Service
 * 
 * Consumes MedCard events from Kafka and projects to read models
 * - ScyllaDB: Real-time MedCard balances and monthly spending
 * - PostgreSQL: Complete MedCard details, beneficiaries, claims
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { Client as ScyllaClient } from 'cassandra-driver';
import { Pool } from 'pg';
import { MedCardEvent, MedCardEventType } from '../domain/medcard-events';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface MedCardProjectionConfig {
  kafka: {
    brokers: string[];
    groupId: string;
    topic: string;
  };
  scylla: {
    contactPoints: string[];
    keyspace: string;
    localDataCenter: string;
  };
  postgres: {
    connectionString: string;
  };
}

// -----------------------------------------------------------------------------
// Projection Statistics
// -----------------------------------------------------------------------------

interface ProjectionStats {
  eventsProcessed: number;
  lastEventTimestamp: string;
  errors: number;
  lag: number;
  byEventType: Map<string, number>;
}

// -----------------------------------------------------------------------------
// MedCard Projection Service
// -----------------------------------------------------------------------------

export class MedCardProjectionService {
  private consumer: Consumer;
  private scyllaClient: ScyllaClient;
  private postgresPool: Pool;
  private config: MedCardProjectionConfig;
  private isRunning: boolean = false;
  private stats: ProjectionStats;

  constructor(config: MedCardProjectionConfig) {
    this.config = config;

    // Initialize Kafka consumer
    const kafka = new Kafka({
      clientId: 'medcard-projection-service',
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = kafka.consumer({
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    // Initialize ScyllaDB client
    this.scyllaClient = new ScyllaClient({
      contactPoints: config.scylla.contactPoints,
      localDataCenter: config.scylla.localDataCenter,
      keyspace: config.scylla.keyspace,
    });

    // Initialize PostgreSQL pool
    this.postgresPool = new Pool({
      connectionString: config.postgres.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
    });

    // Initialize stats
    this.stats = {
      eventsProcessed: 0,
      lastEventTimestamp: '',
      errors: 0,
      lag: 0,
      byEventType: new Map(),
    };
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    console.log('Starting MedCard Projection Service...');

    // Connect to databases
    await this.scyllaClient.connect();
    console.log('✅ Connected to ScyllaDB');

    await this.postgresPool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');

    // Subscribe to Kafka
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.config.kafka.topic,
      fromBeginning: false,
    });
    console.log(`✅ Subscribed to Kafka topic: ${this.config.kafka.topic}`);

    // Start consuming
    this.isRunning = true;
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    console.log('🚀 MedCard Projection Service is running');
  }

  async stop(): Promise<void> {
    console.log('Stopping MedCard Projection Service...');
    this.isRunning = false;

    await this.consumer.disconnect();
    await this.scyllaClient.shutdown();
    await this.postgresPool.end();

    console.log('✅ MedCard Projection Service stopped');
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;

    try {
      // Parse event
      const event = JSON.parse(message.value?.toString() || '{}') as MedCardEvent;

      // Validate event type
      if (!this.isMedCardEvent(event.eventType)) {
        console.log(`Skipping non-MedCard event: ${event.eventType}`);
        return;
      }

      console.log(`Processing event: ${event.eventType} for aggregate: ${event.aggregateId}`);

      // Project to read models
      await this.projectEvent(event);

      // Update stats
      this.stats.eventsProcessed++;
      this.stats.lastEventTimestamp = event.timestamp;
      const count = this.stats.byEventType.get(event.eventType) || 0;
      this.stats.byEventType.set(event.eventType, count + 1);

    } catch (error) {
      console.error('Error processing message:', error);
      this.stats.errors++;
      // Don't throw - continue processing
    }
  }

  private async projectEvent(event: MedCardEvent): Promise<void> {
    switch (event.eventType) {
      case MedCardEventType.MEDCARD_CREATED:
        await this.projectMedCardCreated(event);
        break;
      case MedCardEventType.MEDCARD_ACTIVATED:
        await this.projectMedCardActivated(event);
        break;
      case MedCardEventType.MEDCARD_SUSPENDED:
        await this.projectMedCardSuspended(event);
        break;
      case MedCardEventType.MEDCARD_CLOSED:
        await this.projectMedCardClosed(event);
        break;
      case MedCardEventType.MEDCARD_LIMIT_UPDATED:
        await this.projectMedCardLimitUpdated(event);
        break;
      case MedCardEventType.MEDCARD_BENEFICIARY_ADDED:
        await this.projectBeneficiaryAdded(event);
        break;
      case MedCardEventType.MEDCARD_BENEFICIARY_REMOVED:
        await this.projectBeneficiaryRemoved(event);
        break;
      case MedCardEventType.MEDCARD_PRESCRIPTION_CLAIMED:
        await this.projectPrescriptionClaimed(event);
        break;
      case MedCardEventType.MEDCARD_INSURANCE_CLAIM_FILED:
        await this.projectInsuranceClaimFiled(event);
        break;
      case MedCardEventType.MEDCARD_COPAYMENT_CHARGED:
        await this.projectCopaymentCharged(event);
        break;
      case MedCardEventType.MEDCARD_UPGRADED:
        await this.projectMedCardUpgraded(event);
        break;
      case MedCardEventType.MEDCARD_DOWNGRADED:
        await this.projectMedCardDowngraded(event);
        break;
      default:
        console.log(`Unknown MedCard event type: ${event.eventType}`);
    }
  }

  // ---------------------------------------------------------------------------
  // ScyllaDB Projections (Real-time Balances)
  // ---------------------------------------------------------------------------

  private async updateScyllaBalance(
    medCardId: string,
    currentMonthSpent: number,
    monthlyLimit: number,
    timestamp: string
  ): Promise<void> {
    const query = `
      INSERT INTO medcard_monthly_spend (
        medcard_id, month, total_spent, monthly_limit, last_updated
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const month = timestamp.substring(0, 7); // YYYY-MM format
    
    await this.scyllaClient.execute(query, [
      medCardId,
      month,
      currentMonthSpent,
      monthlyLimit,
      new Date(timestamp),
    ], { prepare: true });
  }

  // ---------------------------------------------------------------------------
  // PostgreSQL Projections (Detailed Read Models)
  // ---------------------------------------------------------------------------

  private async projectMedCardCreated(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_CREATED) return;

    const client = await this.postgresPool.connect();
    
    try {
      // Insert into medcards table
      await client.query(
        `INSERT INTO medcards (
          id, user_id, card_number, card_type, status,
          monthly_limit, current_month_spent, copayment_percentage,
          primary_holder, insurance_provider, policy_number,
          expiry_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          event.aggregateId,
          event.data.userId,
          event.data.cardNumber,
          event.data.cardType,
          event.data.status,
          event.data.monthlyLimit,
          0, // current_month_spent starts at 0
          event.data.copaymentPercentage,
          JSON.stringify(event.data.primaryHolder),
          event.data.insuranceProvider,
          event.data.policyNumber,
          event.data.expiryDate,
          event.timestamp,
          event.timestamp,
        ]
      );

      // Initialize ScyllaDB balance
      await this.updateScyllaBalance(
        event.aggregateId,
        0,
        event.data.monthlyLimit,
        event.timestamp
      );

      console.log(`✅ Created MedCard projection: ${event.aggregateId}`);
    } finally {
      client.release();
    }
  }

  private async projectMedCardActivated(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_ACTIVATED) return;

    await this.postgresPool.query(
      `UPDATE medcards 
       SET status = 'active', updated_at = $2
       WHERE id = $1`,
      [event.aggregateId, event.timestamp]
    );

    console.log(`✅ Activated MedCard: ${event.aggregateId}`);
  }

  private async projectMedCardSuspended(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_SUSPENDED) return;

    await this.postgresPool.query(
      `UPDATE medcards 
       SET status = 'suspended', updated_at = $2
       WHERE id = $1`,
      [event.aggregateId, event.timestamp]
    );

    console.log(`✅ Suspended MedCard: ${event.aggregateId}`);
  }

  private async projectMedCardClosed(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_CLOSED) return;

    await this.postgresPool.query(
      `UPDATE medcards 
       SET status = 'closed', updated_at = $2
       WHERE id = $1`,
      [event.aggregateId, event.timestamp]
    );

    console.log(`✅ Closed MedCard: ${event.aggregateId}`);
  }

  private async projectMedCardLimitUpdated(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_LIMIT_UPDATED) return;

    // Update PostgreSQL
    await this.postgresPool.query(
      `UPDATE medcards 
       SET monthly_limit = $2, updated_at = $3
       WHERE id = $1`,
      [event.aggregateId, event.data.newLimit, event.timestamp]
    );

    // Update ScyllaDB
    const result = await this.postgresPool.query(
      'SELECT current_month_spent FROM medcards WHERE id = $1',
      [event.aggregateId]
    );
    
    if (result.rows.length > 0) {
      await this.updateScyllaBalance(
        event.aggregateId,
        result.rows[0].current_month_spent,
        event.data.newLimit,
        event.timestamp
      );
    }

    console.log(`✅ Updated MedCard limit: ${event.aggregateId}`);
  }

  private async projectBeneficiaryAdded(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_BENEFICIARY_ADDED) return;

    await this.postgresPool.query(
      `INSERT INTO beneficiaries (
        id, medcard_id, relationship, national_id,
        name, date_of_birth, phone_number, added_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.data.beneficiaryId,
        event.aggregateId,
        event.data.relationship,
        event.data.nationalId,
        event.data.name,
        event.data.dateOfBirth,
        event.data.phoneNumber,
        event.timestamp,
      ]
    );

    console.log(`✅ Added beneficiary: ${event.data.beneficiaryId} to MedCard: ${event.aggregateId}`);
  }

  private async projectBeneficiaryRemoved(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_BENEFICIARY_REMOVED) return;

    await this.postgresPool.query(
      'DELETE FROM beneficiaries WHERE id = $1 AND medcard_id = $2',
      [event.data.beneficiaryId, event.aggregateId]
    );

    console.log(`✅ Removed beneficiary: ${event.data.beneficiaryId} from MedCard: ${event.aggregateId}`);
  }

  private async projectPrescriptionClaimed(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_PRESCRIPTION_CLAIMED) return;

    const client = await this.postgresPool.connect();

    try {
      await client.query('BEGIN');

      // Insert prescription claim
      await client.query(
        `INSERT INTO prescription_claims (
          id, medcard_id, prescription_id, pharmacy_id, beneficiary_id,
          total_amount, covered_amount, copayment_amount, claimed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          event.data.prescriptionId,
          event.aggregateId,
          event.data.prescriptionId,
          event.data.pharmacyId,
          event.data.beneficiaryId,
          event.data.totalAmount,
          event.data.coveredAmount,
          event.data.copaymentAmount,
          event.data.claimedAt,
        ]
      );

      // Insert prescription items
      for (const item of event.data.items) {
        await client.query(
          `INSERT INTO prescription_items (
            id, claim_id, drug_code, drug_name, quantity, unit_price, total_price
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [
            event.data.prescriptionId,
            item.drugCode,
            item.drugName,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );
      }

      // Update MedCard spent amount
      await client.query(
        `UPDATE medcards 
         SET current_month_spent = current_month_spent + $2,
             updated_at = $3
         WHERE id = $1`,
        [event.aggregateId, event.data.coveredAmount, event.timestamp]
      );

      // Get updated spend for ScyllaDB
      const result = await client.query(
        'SELECT current_month_spent, monthly_limit FROM medcards WHERE id = $1',
        [event.aggregateId]
      );

      await client.query('COMMIT');

      // Update ScyllaDB
      if (result.rows.length > 0) {
        await this.updateScyllaBalance(
          event.aggregateId,
          result.rows[0].current_month_spent,
          result.rows[0].monthly_limit,
          event.timestamp
        );
      }

      console.log(`✅ Projected prescription claim: ${event.data.prescriptionId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async projectInsuranceClaimFiled(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_INSURANCE_CLAIM_FILED) return;

    const client = await this.postgresPool.connect();

    try {
      await client.query('BEGIN');

      // Insert insurance claim
      await client.query(
        `INSERT INTO insurance_claims (
          id, medcard_id, provider_id, provider_type, beneficiary_id,
          claim_type, total_amount, requested_coverage, status, filed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          event.data.claimId,
          event.aggregateId,
          event.data.providerId,
          event.data.providerType,
          event.data.beneficiaryId,
          event.data.claimType,
          event.data.totalAmount,
          event.data.requestedCoverage,
          event.data.status,
          event.data.filedAt,
        ]
      );

      // Insert claim documents
      for (const doc of event.data.documents) {
        await client.query(
          `INSERT INTO claim_documents (
            id, claim_id, document_type, document_url
          ) VALUES (gen_random_uuid(), $1, $2, $3)`,
          [event.data.claimId, doc.documentType, doc.documentUrl]
        );
      }

      await client.query('COMMIT');

      console.log(`✅ Projected insurance claim: ${event.data.claimId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async projectCopaymentCharged(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_COPAYMENT_CHARGED) return;

    // This is typically already handled by prescription claim projection
    // But we can add additional tracking if needed
    console.log(`✅ Processed copayment: ${event.data.transactionId}`);
  }

  private async projectMedCardUpgraded(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_UPGRADED) return;

    await this.postgresPool.query(
      `UPDATE medcards 
       SET card_type = $2,
           monthly_limit = $3,
           copayment_percentage = $4,
           updated_at = $5
       WHERE id = $1`,
      [
        event.aggregateId,
        event.data.newTier,
        event.data.newLimit,
        event.data.newCopayment,
        event.timestamp,
      ]
    );

    console.log(`✅ Upgraded MedCard: ${event.aggregateId} to ${event.data.newTier}`);
  }

  private async projectMedCardDowngraded(event: MedCardEvent): Promise<void> {
    if (event.eventType !== MedCardEventType.MEDCARD_DOWNGRADED) return;

    await this.postgresPool.query(
      `UPDATE medcards 
       SET card_type = $2,
           monthly_limit = $3,
           copayment_percentage = $4,
           updated_at = $5
       WHERE id = $1`,
      [
        event.aggregateId,
        event.data.newTier,
        event.data.newLimit,
        event.data.newCopayment,
        event.timestamp,
      ]
    );

    console.log(`✅ Downgraded MedCard: ${event.aggregateId} to ${event.data.newTier}`);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private isMedCardEvent(eventType: string): boolean {
    return Object.values(MedCardEventType).includes(eventType as MedCardEventType);
  }

  getStats(): ProjectionStats {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    components: {
      scylla: 'up' | 'down';
      postgres: 'up' | 'down';
      kafka: 'up' | 'down';
    };
    stats: ProjectionStats;
  }> {
    const components = {
      scylla: 'down' as 'up' | 'down',
      postgres: 'down' as 'up' | 'down',
      kafka: 'down' as 'up' | 'down',
    };

    try {
      await this.scyllaClient.execute('SELECT now() FROM system.local');
      components.scylla = 'up';
    } catch {}

    try {
      await this.postgresPool.query('SELECT NOW()');
      components.postgres = 'up';
    } catch {}

    if (this.isRunning) {
      components.kafka = 'up';
    }

    const status = Object.values(components).every(c => c === 'up') ? 'healthy' : 'unhealthy';

    return {
      status,
      components,
      stats: this.getStats(),
    };
  }
}

// -----------------------------------------------------------------------------
// Main Entry Point
// -----------------------------------------------------------------------------

async function main() {
  const config: MedCardProjectionConfig = {
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:19092').split(','),
      groupId: process.env.KAFKA_GROUP_ID || 'medcard-projection-service-cg',
      topic: process.env.KAFKA_TOPIC || 'healthpay.events.medcard',
    },
    scylla: {
      contactPoints: (process.env.SCYLLA_HOSTS || 'localhost:9042').split(','),
      keyspace: process.env.SCYLLA_KEYSPACE || 'healthpay_balances',
      localDataCenter: process.env.SCYLLA_DATACENTER || 'datacenter1',
    },
    postgres: {
      connectionString:
        process.env.POSTGRES_URL ||
        'postgresql://healthpay:healthpay_dev@localhost:5432/healthpay_ledger',
    },
  };

  const service = new MedCardProjectionService(config);

  // Handle shutdown
  const shutdown = async () => {
    console.log('Shutdown signal received');
    await service.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start service
  await service.start();
}

if (require.main === module) {
  main().catch(console.error);
}

export { MedCardProjectionService };
