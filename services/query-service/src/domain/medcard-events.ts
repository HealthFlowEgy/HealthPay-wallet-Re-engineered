/**
 * HealthPay Ledger V2 - Sprint 4
 * MedCard Domain Events
 * 
 * Digital health card event definitions with full lifecycle support
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Event Types
// -----------------------------------------------------------------------------

export enum MedCardEventType {
  // Lifecycle events
  MEDCARD_CREATED = 'medcard.created',
  MEDCARD_ACTIVATED = 'medcard.activated',
  MEDCARD_SUSPENDED = 'medcard.suspended',
  MEDCARD_CLOSED = 'medcard.closed',
  
  // Card operations
  MEDCARD_LIMIT_UPDATED = 'medcard.limit.updated',
  MEDCARD_BENEFICIARY_ADDED = 'medcard.beneficiary.added',
  MEDCARD_BENEFICIARY_REMOVED = 'medcard.beneficiary.removed',
  
  // Usage events
  MEDCARD_PRESCRIPTION_CLAIMED = 'medcard.prescription.claimed',
  MEDCARD_INSURANCE_CLAIM_FILED = 'medcard.insurance.claim.filed',
  MEDCARD_COPAYMENT_CHARGED = 'medcard.copayment.charged',
  
  // Admin events
  MEDCARD_UPGRADED = 'medcard.upgraded',
  MEDCARD_DOWNGRADED = 'medcard.downgraded',
}

// -----------------------------------------------------------------------------
// Event Schemas
// -----------------------------------------------------------------------------

export const MedCardCreatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_CREATED),
  aggregateId: z.string().uuid(), // medcard_id
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    userId: z.string().uuid(),
    cardNumber: z.string().regex(/^MC\d{12}$/), // MC + 12 digits
    cardType: z.enum(['basic', 'silver', 'gold', 'platinum']),
    insuranceProvider: z.string().optional(),
    policyNumber: z.string().optional(),
    monthlyLimit: z.number().nonnegative(),
    copaymentPercentage: z.number().min(0).max(100),
    primaryHolder: z.object({
      nationalId: z.string().regex(/^[0-9]{14}$/),
      name: z.string(),
      dateOfBirth: z.string().date(),
      phoneNumber: z.string().regex(/^\+20[0-9]{10}$/),
    }),
    expiryDate: z.string().date(),
    status: z.literal('pending_activation'),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
  }),
});

export const MedCardActivatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_ACTIVATED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    activatedAt: z.string().datetime(),
    activatedBy: z.string().uuid(), // admin user or system
    reason: z.string().optional(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardSuspendedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_SUSPENDED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    suspendedAt: z.string().datetime(),
    suspendedBy: z.string().uuid(),
    reason: z.enum(['fraud_suspected', 'payment_overdue', 'policy_expired', 'user_request', 'admin_action']),
    notes: z.string().optional(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardClosedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_CLOSED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    closedAt: z.string().datetime(),
    closedBy: z.string().uuid(),
    reason: z.enum(['user_request', 'policy_cancelled', 'fraud_confirmed', 'death', 'admin_closure']),
    finalBalance: z.number(),
    refundAmount: z.number().nonnegative(),
    notes: z.string().optional(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardLimitUpdatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_LIMIT_UPDATED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    previousLimit: z.number().nonnegative(),
    newLimit: z.number().nonnegative(),
    effectiveDate: z.string().date(),
    updatedBy: z.string().uuid(),
    reason: z.string(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardBeneficiaryAddedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_BENEFICIARY_ADDED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    beneficiaryId: z.string().uuid(),
    relationship: z.enum(['spouse', 'child', 'parent', 'sibling', 'dependent']),
    nationalId: z.string().regex(/^[0-9]{14}$/),
    name: z.string(),
    dateOfBirth: z.string().date(),
    phoneNumber: z.string().regex(/^\+20[0-9]{10}$/),
    addedBy: z.string().uuid(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardBeneficiaryRemovedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_BENEFICIARY_REMOVED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    beneficiaryId: z.string().uuid(),
    removedBy: z.string().uuid(),
    reason: z.string(),
    removedAt: z.string().datetime(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardPrescriptionClaimedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_PRESCRIPTION_CLAIMED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    prescriptionId: z.string().uuid(),
    pharmacyId: z.string(),
    beneficiaryId: z.string().uuid(),
    totalAmount: z.number().positive(),
    coveredAmount: z.number().nonnegative(),
    copaymentAmount: z.number().nonnegative(),
    items: z.array(z.object({
      drugCode: z.string(),
      drugName: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      totalPrice: z.number().positive(),
    })),
    claimedAt: z.string().datetime(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
    pharmacyLocation: z.string().optional(),
  }),
});

export const MedCardInsuranceClaimFiledEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_INSURANCE_CLAIM_FILED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    claimId: z.string().uuid(),
    providerId: z.string(),
    providerType: z.enum(['pharmacy', 'clinic', 'hospital', 'lab', 'diagnostic_center']),
    beneficiaryId: z.string().uuid(),
    claimType: z.enum(['prescription', 'consultation', 'procedure', 'hospitalization', 'diagnostic']),
    totalAmount: z.number().positive(),
    requestedCoverage: z.number().positive(),
    documents: z.array(z.object({
      documentType: z.string(),
      documentUrl: z.string().url(),
    })),
    filedAt: z.string().datetime(),
    status: z.literal('pending'),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardCopaymentChargedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_COPAYMENT_CHARGED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    transactionId: z.string().uuid(),
    relatedClaimId: z.string().uuid().optional(),
    amount: z.number().positive(),
    percentage: z.number().min(0).max(100),
    paymentMethod: z.enum(['wallet', 'card', 'cash']),
    paidAt: z.string().datetime(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardUpgradedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_UPGRADED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    previousTier: z.enum(['basic', 'silver', 'gold', 'platinum']),
    newTier: z.enum(['basic', 'silver', 'gold', 'platinum']),
    previousLimit: z.number().nonnegative(),
    newLimit: z.number().nonnegative(),
    previousCopayment: z.number().min(0).max(100),
    newCopayment: z.number().min(0).max(100),
    effectiveDate: z.string().date(),
    upgradedBy: z.string().uuid(),
    reason: z.string(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

export const MedCardDowngradedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(MedCardEventType.MEDCARD_DOWNGRADED),
  aggregateId: z.string().uuid(),
  aggregateType: z.literal('medcard'),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.object({
    previousTier: z.enum(['basic', 'silver', 'gold', 'platinum']),
    newTier: z.enum(['basic', 'silver', 'gold', 'platinum']),
    previousLimit: z.number().nonnegative(),
    newLimit: z.number().nonnegative(),
    previousCopayment: z.number().min(0).max(100),
    newCopayment: z.number().min(0).max(100),
    effectiveDate: z.string().date(),
    downgradedBy: z.string().uuid(),
    reason: z.string(),
  }),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().uuid(),
  }),
});

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type MedCardCreatedEvent = z.infer<typeof MedCardCreatedEventSchema>;
export type MedCardActivatedEvent = z.infer<typeof MedCardActivatedEventSchema>;
export type MedCardSuspendedEvent = z.infer<typeof MedCardSuspendedEventSchema>;
export type MedCardClosedEvent = z.infer<typeof MedCardClosedEventSchema>;
export type MedCardLimitUpdatedEvent = z.infer<typeof MedCardLimitUpdatedEventSchema>;
export type MedCardBeneficiaryAddedEvent = z.infer<typeof MedCardBeneficiaryAddedEventSchema>;
export type MedCardBeneficiaryRemovedEvent = z.infer<typeof MedCardBeneficiaryRemovedEventSchema>;
export type MedCardPrescriptionClaimedEvent = z.infer<typeof MedCardPrescriptionClaimedEventSchema>;
export type MedCardInsuranceClaimFiledEvent = z.infer<typeof MedCardInsuranceClaimFiledEventSchema>;
export type MedCardCopaymentChargedEvent = z.infer<typeof MedCardCopaymentChargedEventSchema>;
export type MedCardUpgradedEvent = z.infer<typeof MedCardUpgradedEventSchema>;
export type MedCardDowngradedEvent = z.infer<typeof MedCardDowngradedEventSchema>;

export type MedCardEvent =
  | MedCardCreatedEvent
  | MedCardActivatedEvent
  | MedCardSuspendedEvent
  | MedCardClosedEvent
  | MedCardLimitUpdatedEvent
  | MedCardBeneficiaryAddedEvent
  | MedCardBeneficiaryRemovedEvent
  | MedCardPrescriptionClaimedEvent
  | MedCardInsuranceClaimFiledEvent
  | MedCardCopaymentChargedEvent
  | MedCardUpgradedEvent
  | MedCardDowngradedEvent;
