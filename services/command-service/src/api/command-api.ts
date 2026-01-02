/**
 * Command API - REST endpoints
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { CommandHandler } from '../commands/command-handler';
import {
  Command,
  CreateWalletCommand,
  ActivateWalletCommand,
  SuspendWalletCommand,
  CloseWalletCommand,
  CreditWalletCommand,
  DebitWalletCommand,
  TransferCommand
} from '../commands/commands';
import { WalletType, KYCLevel } from '../domain/wallet-aggregate';
import pino from 'pino';

const logger = pino({ name: 'command-api' });

// =============================================================================
// Request Validation Schemas (Zod)
// =============================================================================

const CreateWalletSchema = z.object({
  walletType: z.enum(['personal', 'business', 'merchant']),
  currency: z.string().length(3),
  kycLevel: z.enum(['basic', 'enhanced', 'full']),
  initialBalance: z.number().min(0).optional()
});

const ActivateWalletSchema = z.object({
  walletId: z.string().uuid()
});

const SuspendWalletSchema = z.object({
  walletId: z.string().uuid(),
  reason: z.string().min(1)
});

const CloseWalletSchema = z.object({
  walletId: z.string().uuid(),
  reason: z.string().optional()
});

const CreditWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number().positive(),
  transactionType: z.enum(['deposit', 'refund', 'transfer_in', 'cashback']),
  reference: z.string().min(1),
  sourceWalletId: z.string().uuid().optional(),
  description: z.string().optional()
});

const DebitWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number().positive(),
  transactionType: z.enum(['payment', 'withdrawal', 'transfer_out', 'fee']),
  reference: z.string().min(1),
  destinationWalletId: z.string().uuid().optional(),
  description: z.string().optional()
});

const TransferSchema = z.object({
  sourceWalletId: z.string().uuid(),
  destinationWalletId: z.string().uuid(),
  amount: z.number().positive(),
  reference: z.string().min(1),
  description: z.string().optional()
});

// =============================================================================
// API Router
// =============================================================================

export function createCommandApi(commandHandler: CommandHandler) {
  const router = express.Router();

  // Middleware to extract user ID (mock for now)
  router.use((req: Request, res: Response, next: NextFunction) => {
    req.userId = req.headers['x-user-id'] as string || 'system';
    req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    next();
  });

  // ===========================================================================
  // POST /commands/wallets/create
  // ===========================================================================

  router.post('/commands/wallets/create', async (req: Request, res: Response) => {
    try {
      const data = CreateWalletSchema.parse(req.body);

      const command: CreateWalletCommand = {
        type: 'CreateWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data: {
          walletType: data.walletType as WalletType,
          currency: data.currency,
          kycLevel: data.kycLevel as KYCLevel,
          initialBalance: data.initialBalance
        }
      };

      const result = await commandHandler.handle(command);

      if (result.success) {
        res.status(201).json({
          success: true,
          commandId: result.commandId,
          walletId: result.aggregateId,
          events: result.events
        });
      } else {
        res.status(400).json({
          success: false,
          commandId: result.commandId,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error({ error }, 'Create wallet failed');
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        });
      }
    }
  });

  // ===========================================================================
  // POST /commands/wallets/:walletId/activate
  // ===========================================================================

  router.post('/commands/wallets/:walletId/activate', async (req: Request, res: Response) => {
    try {
      const data = ActivateWalletSchema.parse({ walletId: req.params.walletId });

      const command: ActivateWalletCommand = {
        type: 'ActivateWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);

      if (result.success) {
        res.status(200).json({
          success: true,
          commandId: result.commandId,
          walletId: result.aggregateId,
          events: result.events
        });
      } else {
        res.status(400).json({
          success: false,
          commandId: result.commandId,
          error: result.error
        });
      }
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // POST /commands/wallets/:walletId/suspend
  // ===========================================================================

  router.post('/commands/wallets/:walletId/suspend', async (req: Request, res: Response) => {
    try {
      const data = SuspendWalletSchema.parse({
        walletId: req.params.walletId,
        reason: req.body.reason
      });

      const command: SuspendWalletCommand = {
        type: 'SuspendWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);
      respondWithResult(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // POST /commands/wallets/:walletId/close
  // ===========================================================================

  router.post('/commands/wallets/:walletId/close', async (req: Request, res: Response) => {
    try {
      const data = CloseWalletSchema.parse({
        walletId: req.params.walletId,
        reason: req.body.reason
      });

      const command: CloseWalletCommand = {
        type: 'CloseWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);
      respondWithResult(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // POST /commands/wallets/:walletId/credit
  // ===========================================================================

  router.post('/commands/wallets/:walletId/credit', async (req: Request, res: Response) => {
    try {
      const data = CreditWalletSchema.parse({
        walletId: req.params.walletId,
        ...req.body
      });

      const command: CreditWalletCommand = {
        type: 'CreditWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);
      respondWithResult(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // POST /commands/wallets/:walletId/debit
  // ===========================================================================

  router.post('/commands/wallets/:walletId/debit', async (req: Request, res: Response) => {
    try {
      const data = DebitWalletSchema.parse({
        walletId: req.params.walletId,
        ...req.body
      });

      const command: DebitWalletCommand = {
        type: 'DebitWallet',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);
      respondWithResult(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // POST /commands/transfers
  // ===========================================================================

  router.post('/commands/transfers', async (req: Request, res: Response) => {
    try {
      const data = TransferSchema.parse(req.body);

      const command: TransferCommand = {
        type: 'Transfer',
        commandId: uuidv4(),
        userId: req.userId!,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        data
      };

      const result = await commandHandler.handle(command);
      respondWithResult(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // ===========================================================================
  // Health Check
  // ===========================================================================

  router.get('/health', async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'command-api',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

// =============================================================================
// Helper Functions
// =============================================================================

function respondWithResult(result: any, res: Response) {
  if (result.success) {
    res.status(200).json({
      success: true,
      commandId: result.commandId,
      walletId: result.aggregateId,
      events: result.events
    });
  } else {
    res.status(400).json({
      success: false,
      commandId: result.commandId,
      error: result.error
    });
  }
}

function handleError(error: any, res: Response) {
  logger.error({ error }, 'API error');

  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      correlationId?: string;
    }
  }
}
