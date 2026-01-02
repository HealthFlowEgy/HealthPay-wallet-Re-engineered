/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/auth.service';
import pino from 'pino';

const logger = pino({ name: 'auth-middleware' });

/**
 * Extend Express Request to include auth info
 */
declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
      userId?: string;
      correlationId?: string;
    }
  }
}

/**
 * Authentication middleware factory
 */
export function createAuthMiddleware(authService: AuthService) {
  /**
   * Require authentication
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authorization header'
          }
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      const result = await authService.verifyAccessToken(token);

      if (!result.valid || !result.payload) {
        logger.warn({ error: result.error }, 'Token verification failed');

        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: result.error || 'Invalid token'
          }
        });
      }

      // Attach auth info to request
      req.auth = result.payload;
      req.userId = result.payload.sub;

      logger.debug({
        userId: result.payload.sub,
        path: req.path
      }, 'Request authenticated');

      next();

    } catch (error: any) {
      logger.error({ error }, 'Authentication middleware error');

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication error'
        }
      });
    }
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const result = await authService.verifyAccessToken(token);

        if (result.valid && result.payload) {
          req.auth = result.payload;
          req.userId = result.payload.sub;
        }
      }

      next();

    } catch (error) {
      // Don't fail on optional auth
      next();
    }
  };
}

/**
 * Role-based authorization
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRole = req.auth.role || 'user';

    if (!roles.includes(userRole)) {
      logger.warn({
        userId: req.auth.sub,
        userRole,
        requiredRoles: roles
      }, 'Insufficient permissions');

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}
