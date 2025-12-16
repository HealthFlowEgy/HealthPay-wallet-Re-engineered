/**
 * Command Handlers
 * 
 * Orchestrates command execution: load aggregate → execute → publish events
 */

import { WalletAggregate } from '../domain/wallet-aggregate';
import { EventStore } from '../eventstore/event-store';
import { isFailure } from '../domain/errors';
import {
  Command,
  CommandResult,
  CreateWalletCommand,
  ActivateWalletCommand,
  SuspendWalletCommand,
  CloseWalletCommand,
  CreditWalletCommand,
  DebitWalletCommand,
  TransferCommand
} from './commands';
import pino from 'pino';

const logger = pino({ name: 'command-handler' });

// =============================================================================
// Aggregate Repository (simple in-memory for Sprint 2)
// =============================================================================

class AggregateRepository {
  private aggregates = new Map<string, WalletAggregate>();

  /**
   * Load aggregate by ID
   * In production, this would load from event store history
   */
  async load(aggregateId: string): Promise<WalletAggregate | null> {
    return this.aggregates.get(aggregateId) || null;
  }

  /**
   * Save aggregate (just cache for now)
   */
  async save(aggregate: WalletAggregate): Promise<void> {
    if (aggregate.id) {
      this.aggregates.set(aggregate.id, aggregate);
    }
  }

  /**
   * Clear cache (for testing)
   */
  clear(): void {
    this.aggregates.clear();
  }
}

// =============================================================================
// Command Handler
// =============================================================================

export class CommandHandler {
  private repository: AggregateRepository;

  constructor(private eventStore: EventStore) {
    this.repository = new AggregateRepository();
  }

  /**
   * Handle any command
   */
  async handle(command: Command): Promise<CommandResult> {
    logger.info({
      commandId: command.commandId,
      commandType: command.type,
      userId: command.userId
    }, 'Handling command');

    try {
      switch (command.type) {
        case 'CreateWallet':
          return await this.handleCreateWallet(command);
        case 'ActivateWallet':
          return await this.handleActivateWallet(command);
        case 'SuspendWallet':
          return await this.handleSuspendWallet(command);
        case 'CloseWallet':
          return await this.handleCloseWallet(command);
        case 'CreditWallet':
          return await this.handleCreditWallet(command);
        case 'DebitWallet':
          return await this.handleDebitWallet(command);
        case 'Transfer':
          return await this.handleTransfer(command);
        default:
          return {
            success: false,
            commandId: command.commandId,
            error: {
              code: 'UNKNOWN_COMMAND',
              message: 'Unknown command type'
            }
          };
      }
    } catch (error: any) {
      logger.error({ error, commandId: command.commandId }, 'Command handling failed');
      
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'COMMAND_FAILED',
          message: error.message,
          details: error
        }
      };
    }
  }

  // ===========================================================================
  // Create Wallet
  // ===========================================================================

  private async handleCreateWallet(command: CreateWalletCommand): Promise<CommandResult> {
    const result = WalletAggregate.create(
      command.userId,
      command.data.walletType,
      command.data.currency,
      command.data.kycLevel,
      command.data.initialBalance,
      command.metadata
    );

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    const aggregate = result.value;
    const events = aggregate.getUncommittedEvents();

    // Enrich events with command context
    events.forEach(event => {
      event.causationId = command.commandId;
      event.correlationId = command.correlationId;
    });

    // Publish events
    await this.eventStore.publishEvents(
      events,
      events.map((_, i) => i + 1)
    );

    // Save aggregate
    await this.repository.save(aggregate);
    aggregate.clearUncommittedEvents();

    logger.info({
      commandId: command.commandId,
      walletId: aggregate.id,
      eventCount: events.length
    }, 'Wallet created');

    return {
      success: true,
      commandId: command.commandId,
      aggregateId: aggregate.id,
      events: events.map(e => e.eventId)
    };
  }

  // ===========================================================================
  // Activate Wallet
  // ===========================================================================

  private async handleActivateWallet(command: ActivateWalletCommand): Promise<CommandResult> {
    const aggregate = await this.repository.load(command.data.walletId);

    if (!aggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: `Wallet not found: ${command.data.walletId}`
        }
      };
    }

    const result = aggregate.activate(command.userId);

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    return await this.publishAndSave(aggregate, command);
  }

  // ===========================================================================
  // Suspend Wallet
  // ===========================================================================

  private async handleSuspendWallet(command: SuspendWalletCommand): Promise<CommandResult> {
    const aggregate = await this.repository.load(command.data.walletId);

    if (!aggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: `Wallet not found: ${command.data.walletId}`
        }
      };
    }

    const result = aggregate.suspend(command.userId, command.data.reason);

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    return await this.publishAndSave(aggregate, command);
  }

  // ===========================================================================
  // Close Wallet
  // ===========================================================================

  private async handleCloseWallet(command: CloseWalletCommand): Promise<CommandResult> {
    const aggregate = await this.repository.load(command.data.walletId);

    if (!aggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: `Wallet not found: ${command.data.walletId}`
        }
      };
    }

    const result = aggregate.close(command.userId, command.data.reason);

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    return await this.publishAndSave(aggregate, command);
  }

  // ===========================================================================
  // Credit Wallet
  // ===========================================================================

  private async handleCreditWallet(command: CreditWalletCommand): Promise<CommandResult> {
    const aggregate = await this.repository.load(command.data.walletId);

    if (!aggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: `Wallet not found: ${command.data.walletId}`
        }
      };
    }

    const result = aggregate.credit(
      command.data.amount,
      command.data.transactionType,
      command.data.reference,
      command.userId,
      command.data.sourceWalletId,
      command.data.description,
      command.metadata
    );

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    return await this.publishAndSave(aggregate, command);
  }

  // ===========================================================================
  // Debit Wallet
  // ===========================================================================

  private async handleDebitWallet(command: DebitWalletCommand): Promise<CommandResult> {
    const aggregate = await this.repository.load(command.data.walletId);

    if (!aggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: `Wallet not found: ${command.data.walletId}`
        }
      };
    }

    const result = aggregate.debit(
      command.data.amount,
      command.data.transactionType,
      command.data.reference,
      command.userId,
      command.data.destinationWalletId,
      command.data.description,
      command.metadata
    );

    if (isFailure(result)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        }
      };
    }

    return await this.publishAndSave(aggregate, command);
  }

  // ===========================================================================
  // Transfer (orchestrates debit + credit)
  // ===========================================================================

  private async handleTransfer(command: TransferCommand): Promise<CommandResult> {
    const sourceAggregate = await this.repository.load(command.data.sourceWalletId);
    const destAggregate = await this.repository.load(command.data.destinationWalletId);

    if (!sourceAggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'SOURCE_WALLET_NOT_FOUND',
          message: `Source wallet not found: ${command.data.sourceWalletId}`
        }
      };
    }

    if (!destAggregate) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: 'DESTINATION_WALLET_NOT_FOUND',
          message: `Destination wallet not found: ${command.data.destinationWalletId}`
        }
      };
    }

    // Debit source
    const debitResult = sourceAggregate.debit(
      command.data.amount,
      'transfer_out',
      command.data.reference,
      command.userId,
      command.data.destinationWalletId,
      command.data.description
    );

    if (isFailure(debitResult)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: debitResult.error.code,
          message: debitResult.error.message,
          details: debitResult.error.details
        }
      };
    }

    // Credit destination
    const creditResult = destAggregate.credit(
      command.data.amount,
      'transfer_in',
      command.data.reference,
      command.userId,
      command.data.sourceWalletId,
      command.data.description
    );

    if (isFailure(creditResult)) {
      return {
        success: false,
        commandId: command.commandId,
        error: {
          code: creditResult.error.code,
          message: creditResult.error.message,
          details: creditResult.error.details
        }
      };
    }

    // Publish both sets of events
    const allEvents = [
      ...sourceAggregate.getUncommittedEvents(),
      ...destAggregate.getUncommittedEvents()
    ];

    allEvents.forEach(event => {
      event.causationId = command.commandId;
      event.correlationId = command.correlationId;
    });

    await this.eventStore.publishEvents(
      allEvents,
      allEvents.map((_, i) => i + 1)
    );

    await this.repository.save(sourceAggregate);
    await this.repository.save(destAggregate);

    sourceAggregate.clearUncommittedEvents();
    destAggregate.clearUncommittedEvents();

    logger.info({
      commandId: command.commandId,
      sourceWalletId: sourceAggregate.id,
      destinationWalletId: destAggregate.id,
      amount: command.data.amount
    }, 'Transfer completed');

    return {
      success: true,
      commandId: command.commandId,
      aggregateId: sourceAggregate.id,
      events: allEvents.map(e => e.eventId)
    };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private async publishAndSave(
    aggregate: WalletAggregate,
    command: Command
  ): Promise<CommandResult> {
    const events = aggregate.getUncommittedEvents();

    events.forEach(event => {
      event.causationId = command.commandId;
      event.correlationId = command.correlationId;
    });

    await this.eventStore.publishEvents(
      events,
      events.map((_, i) => aggregate.version - events.length + i + 1)
    );

    await this.repository.save(aggregate);
    aggregate.clearUncommittedEvents();

    return {
      success: true,
      commandId: command.commandId,
      aggregateId: aggregate.id,
      events: events.map(e => e.eventId)
    };
  }

  /**
   * Clear repository cache (for testing)
   */
  clearCache(): void {
    this.repository.clear();
  }
}
