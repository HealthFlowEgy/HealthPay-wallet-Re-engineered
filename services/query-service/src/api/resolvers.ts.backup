/**
 * HealthPay Ledger V2 - Sprint 4
 * GraphQL Resolvers
 * 
 * Complete resolver implementation for all GraphQL operations
 */

import { Pool } from 'pg';
import { PubSub } from 'graphql-subscriptions';
import { MedCardCommandHandler, CreateMedCardCommand, ActivateMedCardCommand } from '../commands/medcard-command-handler';
import { MedCardTier } from '../domain/medcard-aggregate';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface ResolverContext {
  userId: string;
  commandHandler: MedCardCommandHandler;
  readDb: Pool;
  pubsub: PubSub;
}

// -----------------------------------------------------------------------------
// Query Resolvers
// -----------------------------------------------------------------------------

export const queryResolvers = {
  user: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  userByNationalId: async (_: any, { nationalId }: { nationalId: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM users WHERE national_id = $1',
      [nationalId]
    );
    return result.rows[0] || null;
  },

  userByPhone: async (_: any, { phoneNumber }: { phoneNumber: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );
    return result.rows[0] || null;
  },

  wallet: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM wallets WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  walletsByUser: async (_: any, { userId }: { userId: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  walletBalance: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT balance FROM wallet_balances WHERE wallet_id = $1',
      [id]
    );
    return result.rows[0]?.balance || 0;
  },

  transaction: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  transactionsByWallet: async (
    _: any,
    { walletId, limit = 50, offset = 0 }: { walletId: string; limit?: number; offset?: number },
    context: ResolverContext
  ) => {
    const result = await context.readDb.query(
      `SELECT * FROM transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );
    return result.rows;
  },

  medCard: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM medcards WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  medCardByCardNumber: async (_: any, { cardNumber }: { cardNumber: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM medcards WHERE card_number = $1',
      [cardNumber]
    );
    return result.rows[0] || null;
  },

  medCardsByUser: async (_: any, { userId }: { userId: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM medcards WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  payment: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  paymentsByWallet: async (
    _: any,
    { walletId, limit = 50, offset = 0 }: { walletId: string; limit?: number; offset?: number },
    context: ResolverContext
  ) => {
    const result = await context.readDb.query(
      `SELECT * FROM payments 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );
    return result.rows;
  },

  walletAnalytics: async (
    _: any,
    { walletId, startDate, endDate }: { walletId: string; startDate?: string; endDate?: string },
    context: ResolverContext
  ) => {
    const dateFilter = startDate && endDate
      ? 'AND created_at BETWEEN $2 AND $3'
      : '';
    const params = startDate && endDate
      ? [walletId, startDate, endDate]
      : [walletId];

    const result = await context.readDb.query(
      `SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits,
        COUNT(*) as transaction_count,
        AVG(ABS(amount)) as average_transaction,
        MAX(ABS(amount)) as largest_transaction
       FROM transactions 
       WHERE wallet_id = $1 ${dateFilter}`,
      params
    );

    const row = result.rows[0];
    return {
      totalCredits: parseFloat(row.total_credits) || 0,
      totalDebits: parseFloat(row.total_debits) || 0,
      transactionCount: parseInt(row.transaction_count) || 0,
      averageTransaction: parseFloat(row.average_transaction) || 0,
      largestTransaction: parseFloat(row.largest_transaction) || 0,
    };
  },

  medCardAnalytics: async (
    _: any,
    { medCardId, startDate, endDate }: { medCardId: string; startDate?: string; endDate?: string },
    context: ResolverContext
  ) => {
    const dateFilter = startDate && endDate
      ? 'AND claimed_at BETWEEN $2 AND $3'
      : '';
    const params = startDate && endDate
      ? [medCardId, startDate, endDate]
      : [medCardId];

    const result = await context.readDb.query(
      `SELECT 
        COUNT(*) as total_claims,
        SUM(total_amount) as total_spent,
        SUM(covered_amount) as total_covered,
        SUM(copayment_amount) as total_copayments,
        AVG(total_amount) as average_claim_amount
       FROM prescription_claims 
       WHERE medcard_id = $1 ${dateFilter}`,
      params
    );

    const row = result.rows[0];
    return {
      totalClaims: parseInt(row.total_claims) || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      totalCovered: parseFloat(row.total_covered) || 0,
      totalCopayments: parseFloat(row.total_copayments) || 0,
      averageClaimAmount: parseFloat(row.average_claim_amount) || 0,
    };
  },
};

// -----------------------------------------------------------------------------
// Mutation Resolvers
// -----------------------------------------------------------------------------

export const mutationResolvers = {
  // MedCard mutations
  createMedCard: async (_: any, { input }: { input: any }, context: ResolverContext) => {
    const command: CreateMedCardCommand = {
      userId: input.userId,
      cardType: input.cardType as MedCardTier,
      insuranceProvider: input.insuranceProvider,
      policyNumber: input.policyNumber,
      monthlyLimit: input.monthlyLimit,
      copaymentPercentage: input.copaymentPercentage,
      primaryHolder: input.primaryHolder,
      expiryDate: input.expiryDate,
      metadata: {
        userId: context.userId,
      },
    };

    const result = await context.commandHandler.handleCreateMedCard(command);

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard created successfully',
    };
  },

  activateMedCard: async (_: any, { medCardId }: { medCardId: string }, context: ResolverContext) => {
    const command: ActivateMedCardCommand = {
      medCardId,
      activatedBy: context.userId,
      userId: context.userId,
    };

    const result = await context.commandHandler.handleActivateMedCard(command);

    // Publish subscription event
    if (result.success) {
      const medCard = await context.readDb.query('SELECT * FROM medcards WHERE id = $1', [medCardId]);
      context.pubsub.publish('MED_CARD_STATUS_CHANGED', {
        medCardStatusChanged: medCard.rows[0],
      });
    }

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard activated successfully',
    };
  },

  suspendMedCard: async (
    _: any,
    { medCardId, reason, notes }: { medCardId: string; reason: string; notes?: string },
    context: ResolverContext
  ) => {
    const result = await context.commandHandler.handleSuspendMedCard({
      medCardId,
      suspendedBy: context.userId,
      reason: reason as any,
      notes,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard suspended successfully',
    };
  },

  closeMedCard: async (
    _: any,
    { medCardId, reason, refundAmount, notes }: { medCardId: string; reason: string; refundAmount: number; notes?: string },
    context: ResolverContext
  ) => {
    const result = await context.commandHandler.handleCloseMedCard({
      medCardId,
      closedBy: context.userId,
      reason: reason as any,
      refundAmount,
      notes,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard closed successfully',
    };
  },

  updateMedCardLimit: async (
    _: any,
    { medCardId, newLimit, effectiveDate, reason }: { medCardId: string; newLimit: number; effectiveDate: string; reason: string },
    context: ResolverContext
  ) => {
    const result = await context.commandHandler.handleUpdateLimit({
      medCardId,
      newLimit,
      effectiveDate,
      updatedBy: context.userId,
      reason,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard limit updated successfully',
    };
  },

  addBeneficiary: async (_: any, { input }: { input: any }, context: ResolverContext) => {
    const result = await context.commandHandler.handleAddBeneficiary({
      medCardId: input.medCardId,
      relationship: input.relationship,
      nationalId: input.nationalId,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      phoneNumber: input.phoneNumber,
      addedBy: context.userId,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'Beneficiary added successfully',
    };
  },

  removeBeneficiary: async (
    _: any,
    { medCardId, beneficiaryId, reason }: { medCardId: string; beneficiaryId: string; reason: string },
    context: ResolverContext
  ) => {
    const result = await context.commandHandler.handleRemoveBeneficiary({
      medCardId,
      beneficiaryId,
      removedBy: context.userId,
      reason,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'Beneficiary removed successfully',
    };
  },

  claimPrescription: async (_: any, { input }: { input: any }, context: ResolverContext) => {
    const result = await context.commandHandler.handleClaimPrescription({
      medCardId: input.medCardId,
      prescriptionId: input.prescriptionId,
      pharmacyId: input.pharmacyId,
      beneficiaryId: input.beneficiaryId,
      totalAmount: input.totalAmount,
      items: input.items,
      userId: context.userId,
      pharmacyLocation: input.pharmacyLocation,
    });

    // Publish subscription event
    if (result.success) {
      context.pubsub.publish('PRESCRIPTION_CLAIM_CREATED', {
        prescriptionClaimCreated: {
          id: input.prescriptionId,
          medCardId: input.medCardId,
          ...input,
        },
      });
    }

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'Prescription claimed successfully',
    };
  },

  fileInsuranceClaim: async (_: any, { input }: { input: any }, context: ResolverContext) => {
    const result = await context.commandHandler.handleFileInsuranceClaim({
      medCardId: input.medCardId,
      claimId: input.claimId || require('uuid').v4(),
      providerId: input.providerId,
      providerType: input.providerType,
      beneficiaryId: input.beneficiaryId,
      claimType: input.claimType,
      totalAmount: input.totalAmount,
      requestedCoverage: input.requestedCoverage,
      documents: input.documents,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'Insurance claim filed successfully',
    };
  },

  upgradeMedCard: async (
    _: any,
    { medCardId, newTier, newLimit, newCopayment, effectiveDate, reason }: any,
    context: ResolverContext
  ) => {
    const result = await context.commandHandler.handleUpgradeMedCard({
      medCardId,
      newTier: newTier as MedCardTier,
      newLimit,
      newCopayment,
      effectiveDate,
      upgradedBy: context.userId,
      reason,
      userId: context.userId,
    });

    return {
      success: result.success,
      medCardId: result.medCardId,
      message: result.error || 'MedCard upgraded successfully',
    };
  },
};

// -----------------------------------------------------------------------------
// Field Resolvers
// -----------------------------------------------------------------------------

export const fieldResolvers = {
  User: {
    wallets: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [parent.id]
      );
      return result.rows;
    },
    medCards: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM medcards WHERE user_id = $1',
        [parent.id]
      );
      return result.rows;
    },
  },

  Wallet: {
    user: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.user_id]
      );
      return result.rows[0];
    },
    transactions: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 50',
        [parent.id]
      );
      return result.rows;
    },
  },

  MedCard: {
    beneficiaries: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM beneficiaries WHERE medcard_id = $1',
        [parent.id]
      );
      return result.rows;
    },
    prescriptionClaims: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM prescription_claims WHERE medcard_id = $1 ORDER BY claimed_at DESC',
        [parent.id]
      );
      return result.rows;
    },
    insuranceClaims: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM insurance_claims WHERE medcard_id = $1 ORDER BY filed_at DESC',
        [parent.id]
      );
      return result.rows;
    },
  },

  PrescriptionClaim: {
    items: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM prescription_items WHERE claim_id = $1',
        [parent.id]
      );
      return result.rows;
    },
  },

  InsuranceClaim: {
    documents: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM claim_documents WHERE claim_id = $1',
        [parent.id]
      );
      return result.rows;
    },
  },
};

// -----------------------------------------------------------------------------
// Subscription Resolvers
// -----------------------------------------------------------------------------

export const subscriptionResolvers = {
  walletBalanceChanged: {
    subscribe: (_: any, { walletId }: { walletId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator([`WALLET_BALANCE_${walletId}`]);
    },
  },

  transactionCreated: {
    subscribe: (_: any, { walletId }: { walletId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator([`TRANSACTION_CREATED_${walletId}`]);
    },
  },

  medCardStatusChanged: {
    subscribe: (_: any, { medCardId }: { medCardId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator([`MED_CARD_STATUS_${medCardId}`]);
    },
  },

  prescriptionClaimCreated: {
    subscribe: (_: any, { medCardId }: { medCardId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator([`PRESCRIPTION_CLAIM_${medCardId}`]);
    },
  },

  paymentStatusChanged: {
    subscribe: (_: any, { paymentId }: { paymentId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator([`PAYMENT_STATUS_${paymentId}`]);
    },
  },
};

// -----------------------------------------------------------------------------
// Combined Resolvers
// -----------------------------------------------------------------------------

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers,
  ...fieldResolvers,
};
