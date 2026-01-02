/**
 * HealthPay Ledger V2 - Sprint 4
 * MedCard Command Handler
 * 
 * Processes commands and publishes events to Kafka
 */

import { Kafka, Producer, KafkaConfig } from 'kafkajs';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { MedCardAggregate, MedCardDomainError, MedCardTier } from '../domain/medcard-aggregate';
import { MedCardEvent, MedCardEventType } from '../domain/medcard-events';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface MedCardCommandHandlerConfig {
  kafka: {
    brokers: string[];
    clientId: string;
    topic: string;
  };
  eventStore: {
    connectionString: string;
  };
}

// -----------------------------------------------------------------------------
// Command Types
// -----------------------------------------------------------------------------

export interface CreateMedCardCommand {
  userId: string;
  cardType: MedCardTier;
  insuranceProvider?: string;
  policyNumber?: string;
  monthlyLimit: number;
  copaymentPercentage: number;
  primaryHolder: {
    nationalId: string;
    name: string;
    dateOfBirth: string;
    phoneNumber: string;
  };
  expiryDate: string;
  metadata: { userId: string; ipAddress?: string; userAgent?: string };
}

export interface ActivateMedCardCommand {
  medCardId: string;
  activatedBy: string;
  reason?: string;
  userId: string;
}

export interface SuspendMedCardCommand {
  medCardId: string;
  suspendedBy: string;
  reason: 'fraud_suspected' | 'payment_overdue' | 'policy_expired' | 'user_request' | 'admin_action';
  notes?: string;
  userId: string;
}

export interface CloseMedCardCommand {
  medCardId: string;
  closedBy: string;
  reason: 'user_request' | 'policy_cancelled' | 'fraud_confirmed' | 'death' | 'admin_closure';
  refundAmount: number;
  notes?: string;
  userId: string;
}

export interface UpdateMedCardLimitCommand {
  medCardId: string;
  newLimit: number;
  effectiveDate: string;
  updatedBy: string;
  reason: string;
  userId: string;
}

export interface AddBeneficiaryCommand {
  medCardId: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';
  nationalId: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  addedBy: string;
  userId: string;
}

export interface RemoveBeneficiaryCommand {
  medCardId: string;
  beneficiaryId: string;
  removedBy: string;
  reason: string;
  userId: string;
}

export interface ClaimPrescriptionCommand {
  medCardId: string;
  prescriptionId: string;
  pharmacyId: string;
  beneficiaryId: string;
  totalAmount: number;
  items: Array<{
    drugCode: string;
    drugName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  userId: string;
  pharmacyLocation?: string;
}

export interface FileInsuranceClaimCommand {
  medCardId: string;
  claimId: string;
  providerId: string;
  providerType: 'pharmacy' | 'clinic' | 'hospital' | 'lab' | 'diagnostic_center';
  beneficiaryId: string;
  claimType: 'prescription' | 'consultation' | 'procedure' | 'hospitalization' | 'diagnostic';
  totalAmount: number;
  requestedCoverage: number;
  documents: Array<{ documentType: string; documentUrl: string }>;
  userId: string;
}

export interface UpgradeMedCardCommand {
  medCardId: string;
  newTier: MedCardTier;
  newLimit: number;
  newCopayment: number;
  effectiveDate: string;
  upgradedBy: string;
  reason: string;
  userId: string;
}

// -----------------------------------------------------------------------------
// Command Result
// -----------------------------------------------------------------------------

export interface CommandResult {
  success: boolean;
  medCardId?: string;
  events?: MedCardEvent[];
  error?: string;
}

// -----------------------------------------------------------------------------
// MedCard Command Handler
// -----------------------------------------------------------------------------

export class MedCardCommandHandler {
  private kafka: Kafka;
  private producer: Producer;
  private eventStorePool: Pool;
  private config: MedCardCommandHandlerConfig;

  constructor(config: MedCardCommandHandlerConfig) {
    this.config = config;

    // Initialize Kafka producer
    const kafkaConfig: KafkaConfig = {
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      transactionalId: `medcard-command-handler-${uuidv4()}`,
    });

    // Initialize Event Store connection
    this.eventStorePool = new Pool({
      connectionString: config.eventStore.connectionString,
      max: 20,
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    await this.producer.connect();
    console.log('MedCard Command Handler started');
  }

  async stop(): Promise<void> {
    await this.producer.disconnect();
    await this.eventStorePool.end();
    console.log('MedCard Command Handler stopped');
  }

  // ---------------------------------------------------------------------------
  // Command Handlers
  // ---------------------------------------------------------------------------

  async handleCreateMedCard(command: CreateMedCardCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      // Create new aggregate
      const aggregate = new MedCardAggregate();

      // Execute command
      aggregate.create({
        ...command,
        correlationId,
      });

      // Persist and publish events
      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error creating MedCard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleActivateMedCard(command: ActivateMedCardCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      // Load aggregate
      const aggregate = await this.loadAggregate(command.medCardId);

      // Execute command
      aggregate.activate({
        activatedBy: command.activatedBy,
        reason: command.reason,
        correlationId,
        userId: command.userId,
      });

      // Persist and publish events
      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error activating MedCard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleSuspendMedCard(command: SuspendMedCardCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.suspend({
        suspendedBy: command.suspendedBy,
        reason: command.reason,
        notes: command.notes,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error suspending MedCard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleCloseMedCard(command: CloseMedCardCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.close({
        closedBy: command.closedBy,
        reason: command.reason,
        refundAmount: command.refundAmount,
        notes: command.notes,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error closing MedCard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleUpdateLimit(command: UpdateMedCardLimitCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.updateLimit({
        newLimit: command.newLimit,
        effectiveDate: command.effectiveDate,
        updatedBy: command.updatedBy,
        reason: command.reason,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error updating limit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleAddBeneficiary(command: AddBeneficiaryCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.addBeneficiary({
        relationship: command.relationship,
        nationalId: command.nationalId,
        name: command.name,
        dateOfBirth: command.dateOfBirth,
        phoneNumber: command.phoneNumber,
        addedBy: command.addedBy,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleRemoveBeneficiary(command: RemoveBeneficiaryCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.removeBeneficiary({
        beneficiaryId: command.beneficiaryId,
        removedBy: command.removedBy,
        reason: command.reason,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error removing beneficiary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleClaimPrescription(command: ClaimPrescriptionCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.claimPrescription({
        prescriptionId: command.prescriptionId,
        pharmacyId: command.pharmacyId,
        beneficiaryId: command.beneficiaryId,
        totalAmount: command.totalAmount,
        items: command.items,
        correlationId,
        userId: command.userId,
        pharmacyLocation: command.pharmacyLocation,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error claiming prescription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleFileInsuranceClaim(command: FileInsuranceClaimCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.fileInsuranceClaim({
        claimId: command.claimId,
        providerId: command.providerId,
        providerType: command.providerType,
        beneficiaryId: command.beneficiaryId,
        claimType: command.claimType,
        totalAmount: command.totalAmount,
        requestedCoverage: command.requestedCoverage,
        documents: command.documents,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error filing insurance claim:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleUpgradeMedCard(command: UpgradeMedCardCommand): Promise<CommandResult> {
    const correlationId = uuidv4();

    try {
      const aggregate = await this.loadAggregate(command.medCardId);

      aggregate.upgrade({
        newTier: command.newTier,
        newLimit: command.newLimit,
        newCopayment: command.newCopayment,
        effectiveDate: command.effectiveDate,
        upgradedBy: command.upgradedBy,
        reason: command.reason,
        correlationId,
        userId: command.userId,
      });

      await this.persistAndPublish(aggregate);

      return {
        success: true,
        medCardId: aggregate.getId(),
        events: aggregate.getUncommittedEvents(),
      };
    } catch (error) {
      console.error('Error upgrading MedCard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private async loadAggregate(medCardId: string): Promise<MedCardAggregate> {
    // Load events from event store
    const result = await this.eventStorePool.query(
      `SELECT event_data FROM events
       WHERE aggregate_id = $1 AND aggregate_type = 'medcard'
       ORDER BY version ASC`,
      [medCardId]
    );

    if (result.rows.length === 0) {
      throw new MedCardDomainError(`MedCard not found: ${medCardId}`);
    }

    const events = result.rows.map(row => row.event_data as MedCardEvent);
    return MedCardAggregate.rehydrate(events);
  }

  private async persistAndPublish(aggregate: MedCardAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    const client = await this.eventStorePool.connect();

    try {
      await client.query('BEGIN');

      // Persist events to event store
      for (const event of events) {
        await client.query(
          `INSERT INTO events (
            event_id, aggregate_id, aggregate_type, event_type, version, event_data, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            event.eventId,
            event.aggregateId,
            event.aggregateType,
            event.eventType,
            event.version,
            JSON.stringify(event),
            event.timestamp,
          ]
        );
      }

      await client.query('COMMIT');

      // Publish to Kafka
      await this.publishEvents(events);

      // Clear uncommitted events
      aggregate.clearUncommittedEvents();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async publishEvents(events: MedCardEvent[]): Promise<void> {
    const messages = events.map(event => ({
      key: event.aggregateId,
      value: JSON.stringify(event),
      headers: {
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        version: event.version.toString(),
      },
    }));

    await this.producer.send({
      topic: this.config.kafka.topic,
      messages,
    });
  }
}
