/**
 * HealthPay Ledger V2 - Sprint 4
 * MedCard Aggregate
 * 
 * Digital health card domain aggregate with full business logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MedCardEvent,
  MedCardEventType,
  MedCardCreatedEvent,
  MedCardActivatedEvent,
  MedCardSuspendedEvent,
  MedCardClosedEvent,
  MedCardLimitUpdatedEvent,
  MedCardBeneficiaryAddedEvent,
  MedCardBeneficiaryRemovedEvent,
  MedCardPrescriptionClaimedEvent,
  MedCardInsuranceClaimFiledEvent,
  MedCardCopaymentChargedEvent,
  MedCardUpgradedEvent,
  MedCardDowngradedEvent,
} from './medcard-events';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export enum MedCardStatus {
  PENDING_ACTIVATION = 'pending_activation',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum MedCardTier {
  BASIC = 'basic',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export interface PrimaryHolder {
  nationalId: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
}

export interface Beneficiary {
  id: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';
  nationalId: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  addedAt: string;
}

export interface PrescriptionClaim {
  id: string;
  pharmacyId: string;
  beneficiaryId: string;
  totalAmount: number;
  coveredAmount: number;
  copaymentAmount: number;
  claimedAt: string;
}

export interface InsuranceClaim {
  id: string;
  providerId: string;
  providerType: string;
  beneficiaryId: string;
  claimType: string;
  totalAmount: number;
  requestedCoverage: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  filedAt: string;
}

// -----------------------------------------------------------------------------
// Aggregate State
// -----------------------------------------------------------------------------

export interface MedCardState {
  id: string;
  userId: string;
  cardNumber: string;
  cardType: MedCardTier;
  status: MedCardStatus;
  
  insuranceProvider?: string;
  policyNumber?: string;
  
  monthlyLimit: number;
  currentMonthSpent: number;
  copaymentPercentage: number;
  
  primaryHolder: PrimaryHolder;
  beneficiaries: Map<string, Beneficiary>;
  
  prescriptionClaims: PrescriptionClaim[];
  insuranceClaims: InsuranceClaim[];
  
  expiryDate: string;
  createdAt: string;
  activatedAt?: string;
  suspendedAt?: string;
  closedAt?: string;
  
  version: number;
}

// -----------------------------------------------------------------------------
// Domain Errors
// -----------------------------------------------------------------------------

export class MedCardDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MedCardDomainError';
  }
}

// -----------------------------------------------------------------------------
// MedCard Aggregate
// -----------------------------------------------------------------------------

export class MedCardAggregate {
  private state: MedCardState;
  private uncommittedEvents: MedCardEvent[] = [];

  constructor(id?: string) {
    this.state = {
      id: id || uuidv4(),
      userId: '',
      cardNumber: '',
      cardType: MedCardTier.BASIC,
      status: MedCardStatus.PENDING_ACTIVATION,
      monthlyLimit: 0,
      currentMonthSpent: 0,
      copaymentPercentage: 0,
      primaryHolder: {
        nationalId: '',
        name: '',
        dateOfBirth: '',
        phoneNumber: '',
      },
      beneficiaries: new Map(),
      prescriptionClaims: [],
      insuranceClaims: [],
      expiryDate: '',
      createdAt: '',
      version: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  getId(): string {
    return this.state.id;
  }

  getState(): Readonly<MedCardState> {
    return { ...this.state };
  }

  getVersion(): number {
    return this.state.version;
  }

  getUncommittedEvents(): MedCardEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  // ---------------------------------------------------------------------------
  // Command: Create MedCard
  // ---------------------------------------------------------------------------

  create(params: {
    userId: string;
    cardType: MedCardTier;
    insuranceProvider?: string;
    policyNumber?: string;
    monthlyLimit: number;
    copaymentPercentage: number;
    primaryHolder: PrimaryHolder;
    expiryDate: string;
    correlationId: string;
    metadata: { userId: string; ipAddress?: string; userAgent?: string };
  }): void {
    // Validation
    if (this.state.version > 0) {
      throw new MedCardDomainError('MedCard already exists');
    }

    if (params.monthlyLimit < 0) {
      throw new MedCardDomainError('Monthly limit cannot be negative');
    }

    if (params.copaymentPercentage < 0 || params.copaymentPercentage > 100) {
      throw new MedCardDomainError('Copayment percentage must be between 0-100');
    }

    if (!this.isValidNationalId(params.primaryHolder.nationalId)) {
      throw new MedCardDomainError('Invalid Egyptian National ID');
    }

    if (!this.isValidPhoneNumber(params.primaryHolder.phoneNumber)) {
      throw new MedCardDomainError('Invalid Egyptian phone number');
    }

    const expiryDate = new Date(params.expiryDate);
    if (expiryDate <= new Date()) {
      throw new MedCardDomainError('Expiry date must be in the future');
    }

    // Generate card number
    const cardNumber = this.generateCardNumber();

    // Create event
    const event: MedCardCreatedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_CREATED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        userId: params.userId,
        cardNumber,
        cardType: params.cardType,
        insuranceProvider: params.insuranceProvider,
        policyNumber: params.policyNumber,
        monthlyLimit: params.monthlyLimit,
        copaymentPercentage: params.copaymentPercentage,
        primaryHolder: params.primaryHolder,
        expiryDate: params.expiryDate,
        status: 'pending_activation',
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.metadata.userId,
        ipAddress: params.metadata.ipAddress,
        userAgent: params.metadata.userAgent,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Activate MedCard
  // ---------------------------------------------------------------------------

  activate(params: {
    activatedBy: string;
    reason?: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.PENDING_ACTIVATION) {
      throw new MedCardDomainError(`Cannot activate card in ${this.state.status} status`);
    }

    const event: MedCardActivatedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_ACTIVATED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        activatedAt: new Date().toISOString(),
        activatedBy: params.activatedBy,
        reason: params.reason,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Suspend MedCard
  // ---------------------------------------------------------------------------

  suspend(params: {
    suspendedBy: string;
    reason: 'fraud_suspected' | 'payment_overdue' | 'policy_expired' | 'user_request' | 'admin_action';
    notes?: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError(`Cannot suspend card in ${this.state.status} status`);
    }

    const event: MedCardSuspendedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_SUSPENDED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        suspendedAt: new Date().toISOString(),
        suspendedBy: params.suspendedBy,
        reason: params.reason,
        notes: params.notes,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Close MedCard
  // ---------------------------------------------------------------------------

  close(params: {
    closedBy: string;
    reason: 'user_request' | 'policy_cancelled' | 'fraud_confirmed' | 'death' | 'admin_closure';
    refundAmount: number;
    notes?: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status === MedCardStatus.CLOSED) {
      throw new MedCardDomainError('Card is already closed');
    }

    if (params.refundAmount < 0) {
      throw new MedCardDomainError('Refund amount cannot be negative');
    }

    const event: MedCardClosedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_CLOSED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        closedAt: new Date().toISOString(),
        closedBy: params.closedBy,
        reason: params.reason,
        finalBalance: this.getRemainingLimit(),
        refundAmount: params.refundAmount,
        notes: params.notes,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Update Limit
  // ---------------------------------------------------------------------------

  updateLimit(params: {
    newLimit: number;
    effectiveDate: string;
    updatedBy: string;
    reason: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError('Can only update limit for active cards');
    }

    if (params.newLimit < 0) {
      throw new MedCardDomainError('Limit cannot be negative');
    }

    const event: MedCardLimitUpdatedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_LIMIT_UPDATED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        previousLimit: this.state.monthlyLimit,
        newLimit: params.newLimit,
        effectiveDate: params.effectiveDate,
        updatedBy: params.updatedBy,
        reason: params.reason,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Add Beneficiary
  // ---------------------------------------------------------------------------

  addBeneficiary(params: {
    relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';
    nationalId: string;
    name: string;
    dateOfBirth: string;
    phoneNumber: string;
    addedBy: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError('Can only add beneficiaries to active cards');
    }

    if (!this.isValidNationalId(params.nationalId)) {
      throw new MedCardDomainError('Invalid Egyptian National ID');
    }

    if (!this.isValidPhoneNumber(params.phoneNumber)) {
      throw new MedCardDomainError('Invalid Egyptian phone number');
    }

    // Check if beneficiary already exists
    for (const beneficiary of this.state.beneficiaries.values()) {
      if (beneficiary.nationalId === params.nationalId) {
        throw new MedCardDomainError('Beneficiary with this National ID already exists');
      }
    }

    const beneficiaryId = uuidv4();

    const event: MedCardBeneficiaryAddedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_BENEFICIARY_ADDED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        beneficiaryId,
        relationship: params.relationship,
        nationalId: params.nationalId,
        name: params.name,
        dateOfBirth: params.dateOfBirth,
        phoneNumber: params.phoneNumber,
        addedBy: params.addedBy,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Remove Beneficiary
  // ---------------------------------------------------------------------------

  removeBeneficiary(params: {
    beneficiaryId: string;
    removedBy: string;
    reason: string;
    correlationId: string;
    userId: string;
  }): void {
    if (!this.state.beneficiaries.has(params.beneficiaryId)) {
      throw new MedCardDomainError('Beneficiary not found');
    }

    const event: MedCardBeneficiaryRemovedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_BENEFICIARY_REMOVED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        beneficiaryId: params.beneficiaryId,
        removedBy: params.removedBy,
        reason: params.reason,
        removedAt: new Date().toISOString(),
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Claim Prescription
  // ---------------------------------------------------------------------------

  claimPrescription(params: {
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
    correlationId: string;
    userId: string;
    pharmacyLocation?: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError('Card must be active to claim prescriptions');
    }

    // Verify beneficiary
    if (params.beneficiaryId !== this.state.userId && !this.state.beneficiaries.has(params.beneficiaryId)) {
      throw new MedCardDomainError('Invalid beneficiary');
    }

    // Calculate coverage
    const coveredAmount = params.totalAmount * (1 - this.state.copaymentPercentage / 100);
    const copaymentAmount = params.totalAmount - coveredAmount;

    // Check if within limit
    const projectedSpent = this.state.currentMonthSpent + coveredAmount;
    if (projectedSpent > this.state.monthlyLimit) {
      throw new MedCardDomainError(
        `Claim exceeds monthly limit. Limit: ${this.state.monthlyLimit}, Already spent: ${this.state.currentMonthSpent}, Claim amount: ${coveredAmount}`
      );
    }

    const event: MedCardPrescriptionClaimedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_PRESCRIPTION_CLAIMED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        prescriptionId: params.prescriptionId,
        pharmacyId: params.pharmacyId,
        beneficiaryId: params.beneficiaryId,
        totalAmount: params.totalAmount,
        coveredAmount,
        copaymentAmount,
        items: params.items,
        claimedAt: new Date().toISOString(),
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
        pharmacyLocation: params.pharmacyLocation,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: File Insurance Claim
  // ---------------------------------------------------------------------------

  fileInsuranceClaim(params: {
    claimId: string;
    providerId: string;
    providerType: 'pharmacy' | 'clinic' | 'hospital' | 'lab' | 'diagnostic_center';
    beneficiaryId: string;
    claimType: 'prescription' | 'consultation' | 'procedure' | 'hospitalization' | 'diagnostic';
    totalAmount: number;
    requestedCoverage: number;
    documents: Array<{ documentType: string; documentUrl: string }>;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError('Card must be active to file claims');
    }

    if (params.beneficiaryId !== this.state.userId && !this.state.beneficiaries.has(params.beneficiaryId)) {
      throw new MedCardDomainError('Invalid beneficiary');
    }

    if (params.requestedCoverage > params.totalAmount) {
      throw new MedCardDomainError('Requested coverage cannot exceed total amount');
    }

    const event: MedCardInsuranceClaimFiledEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_INSURANCE_CLAIM_FILED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        claimId: params.claimId,
        providerId: params.providerId,
        providerType: params.providerType,
        beneficiaryId: params.beneficiaryId,
        claimType: params.claimType,
        totalAmount: params.totalAmount,
        requestedCoverage: params.requestedCoverage,
        documents: params.documents,
        filedAt: new Date().toISOString(),
        status: 'pending',
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Command: Upgrade Card
  // ---------------------------------------------------------------------------

  upgrade(params: {
    newTier: MedCardTier;
    newLimit: number;
    newCopayment: number;
    effectiveDate: string;
    upgradedBy: string;
    reason: string;
    correlationId: string;
    userId: string;
  }): void {
    if (this.state.status !== MedCardStatus.ACTIVE) {
      throw new MedCardDomainError('Can only upgrade active cards');
    }

    const tierOrder = [MedCardTier.BASIC, MedCardTier.SILVER, MedCardTier.GOLD, MedCardTier.PLATINUM];
    if (tierOrder.indexOf(params.newTier) <= tierOrder.indexOf(this.state.cardType)) {
      throw new MedCardDomainError('New tier must be higher than current tier');
    }

    const event: MedCardUpgradedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_UPGRADED,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      version: this.state.version + 1,
      data: {
        previousTier: this.state.cardType,
        newTier: params.newTier,
        previousLimit: this.state.monthlyLimit,
        newLimit: params.newLimit,
        previousCopayment: this.state.copaymentPercentage,
        newCopayment: params.newCopayment,
        effectiveDate: params.effectiveDate,
        upgradedBy: params.upgradedBy,
        reason: params.reason,
      },
      metadata: {
        correlationId: params.correlationId,
        userId: params.userId,
      },
    };

    this.apply(event);
  }

  // ---------------------------------------------------------------------------
  // Event Application
  // ---------------------------------------------------------------------------

  apply(event: MedCardEvent): void {
    switch (event.eventType) {
      case MedCardEventType.MEDCARD_CREATED:
        this.applyCreated(event);
        break;
      case MedCardEventType.MEDCARD_ACTIVATED:
        this.applyActivated(event);
        break;
      case MedCardEventType.MEDCARD_SUSPENDED:
        this.applySuspended(event);
        break;
      case MedCardEventType.MEDCARD_CLOSED:
        this.applyClosed(event);
        break;
      case MedCardEventType.MEDCARD_LIMIT_UPDATED:
        this.applyLimitUpdated(event);
        break;
      case MedCardEventType.MEDCARD_BENEFICIARY_ADDED:
        this.applyBeneficiaryAdded(event);
        break;
      case MedCardEventType.MEDCARD_BENEFICIARY_REMOVED:
        this.applyBeneficiaryRemoved(event);
        break;
      case MedCardEventType.MEDCARD_PRESCRIPTION_CLAIMED:
        this.applyPrescriptionClaimed(event);
        break;
      case MedCardEventType.MEDCARD_INSURANCE_CLAIM_FILED:
        this.applyInsuranceClaimFiled(event);
        break;
      case MedCardEventType.MEDCARD_UPGRADED:
        this.applyUpgraded(event);
        break;
      default:
        // Ignore unknown events for forward compatibility
        break;
    }

    this.state.version = event.version;
    this.uncommittedEvents.push(event);
  }

  private applyCreated(event: MedCardCreatedEvent): void {
    this.state.userId = event.data.userId;
    this.state.cardNumber = event.data.cardNumber;
    this.state.cardType = event.data.cardType as MedCardTier;
    this.state.insuranceProvider = event.data.insuranceProvider;
    this.state.policyNumber = event.data.policyNumber;
    this.state.monthlyLimit = event.data.monthlyLimit;
    this.state.copaymentPercentage = event.data.copaymentPercentage;
    this.state.primaryHolder = event.data.primaryHolder;
    this.state.expiryDate = event.data.expiryDate;
    this.state.status = MedCardStatus.PENDING_ACTIVATION;
    this.state.createdAt = event.timestamp;
  }

  private applyActivated(event: MedCardActivatedEvent): void {
    this.state.status = MedCardStatus.ACTIVE;
    this.state.activatedAt = event.data.activatedAt;
  }

  private applySuspended(event: MedCardSuspendedEvent): void {
    this.state.status = MedCardStatus.SUSPENDED;
    this.state.suspendedAt = event.data.suspendedAt;
  }

  private applyClosed(event: MedCardClosedEvent): void {
    this.state.status = MedCardStatus.CLOSED;
    this.state.closedAt = event.data.closedAt;
  }

  private applyLimitUpdated(event: MedCardLimitUpdatedEvent): void {
    this.state.monthlyLimit = event.data.newLimit;
  }

  private applyBeneficiaryAdded(event: MedCardBeneficiaryAddedEvent): void {
    this.state.beneficiaries.set(event.data.beneficiaryId, {
      id: event.data.beneficiaryId,
      relationship: event.data.relationship,
      nationalId: event.data.nationalId,
      name: event.data.name,
      dateOfBirth: event.data.dateOfBirth,
      phoneNumber: event.data.phoneNumber,
      addedAt: event.timestamp,
    });
  }

  private applyBeneficiaryRemoved(event: MedCardBeneficiaryRemovedEvent): void {
    this.state.beneficiaries.delete(event.data.beneficiaryId);
  }

  private applyPrescriptionClaimed(event: MedCardPrescriptionClaimedEvent): void {
    this.state.currentMonthSpent += event.data.coveredAmount;
    this.state.prescriptionClaims.push({
      id: event.data.prescriptionId,
      pharmacyId: event.data.pharmacyId,
      beneficiaryId: event.data.beneficiaryId,
      totalAmount: event.data.totalAmount,
      coveredAmount: event.data.coveredAmount,
      copaymentAmount: event.data.copaymentAmount,
      claimedAt: event.data.claimedAt,
    });
  }

  private applyInsuranceClaimFiled(event: MedCardInsuranceClaimFiledEvent): void {
    this.state.insuranceClaims.push({
      id: event.data.claimId,
      providerId: event.data.providerId,
      providerType: event.data.providerType,
      beneficiaryId: event.data.beneficiaryId,
      claimType: event.data.claimType,
      totalAmount: event.data.totalAmount,
      requestedCoverage: event.data.requestedCoverage,
      status: 'pending',
      filedAt: event.data.filedAt,
    });
  }

  private applyUpgraded(event: MedCardUpgradedEvent): void {
    this.state.cardType = event.data.newTier as MedCardTier;
    this.state.monthlyLimit = event.data.newLimit;
    this.state.copaymentPercentage = event.data.newCopayment;
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private generateCardNumber(): string {
    // Format: MC + 12 random digits
    const randomDigits = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, '0');
    return `MC${randomDigits}`;
  }

  private isValidNationalId(nationalId: string): boolean {
    return /^[0-9]{14}$/.test(nationalId);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    return /^\+20[0-9]{10}$/.test(phoneNumber);
  }

  private getRemainingLimit(): number {
    return Math.max(0, this.state.monthlyLimit - this.state.currentMonthSpent);
  }

  // ---------------------------------------------------------------------------
  // Rehydration
  // ---------------------------------------------------------------------------

  static rehydrate(events: MedCardEvent[]): MedCardAggregate {
    if (events.length === 0) {
      throw new MedCardDomainError('Cannot rehydrate from empty event list');
    }

    const aggregate = new MedCardAggregate(events[0].aggregateId);

    for (const event of events) {
      aggregate.apply(event);
    }

    aggregate.clearUncommittedEvents();
    return aggregate;
  }
}
