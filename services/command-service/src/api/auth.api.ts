/**
 * Authentication API
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { OTPService } from '../services/otp.service';
import { AuthService } from '../services/auth.service';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import pino from 'pino';

const logger = pino({ name: 'auth-api' });

// =============================================================================
// Validation Schemas
// =============================================================================

const PhoneNumberSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long')
    .regex(/^(\+20|0)?[0-9]{10}$/, 'Invalid Egyptian phone number format')
});

const VerifyOTPSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required')
});

// =============================================================================
// API Router
// =============================================================================

export function createAuthApi(
  otpService: OTPService,
  authService: AuthService,
  redis: Redis
) {
  const router = express.Router();

  // Rate limiters
  const otpRequestLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:otp:request',
    points: 3, // 3 requests
    duration: 300, // per 5 minutes
    blockDuration: 900 // block for 15 minutes
  });

  const otpVerifyLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:otp:verify',
    points: 5, // 5 attempts
    duration: 300, // per 5 minutes
    blockDuration: 1800 // block for 30 minutes
  });

  // ===========================================================================
  // POST /auth/otp/request
  // Request OTP code via SMS
  // ===========================================================================

  router.post('/auth/otp/request', async (req: Request, res: Response) => {
    try {
      // Validate request
      const data = PhoneNumberSchema.parse(req.body);

      // Rate limiting
      try {
        await otpRequestLimiter.consume(data.phoneNumber);
      } catch (rateLimitError) {
        logger.warn({
          phoneNumber: data.phoneNumber.substring(0, 4) + '****'
        }, 'OTP request rate limit exceeded');

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many OTP requests. Please try again later.',
            retryAfter: 300
          }
        });
      }

      // Generate and send OTP
      const result = await otpService.generateAndSend(data.phoneNumber);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully',
          messageId: result.messageId,
          expiresIn: 300 // 5 minutes
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'OTP_SEND_FAILED',
            message: result.error || 'Failed to send OTP',
            cooldownSeconds: result.cooldownSeconds
          }
        });
      }

    } catch (error: any) {
      logger.error({ error }, 'OTP request failed');

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number',
            details: error.errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process OTP request'
        }
      });
    }
  });

  // ===========================================================================
  // POST /auth/otp/verify
  // Verify OTP and get tokens
  // ===========================================================================

  router.post('/auth/otp/verify', async (req: Request, res: Response) => {
    try {
      // Validate request
      const data = VerifyOTPSchema.parse(req.body);

      // Rate limiting
      try {
        await otpVerifyLimiter.consume(data.phoneNumber);
      } catch (rateLimitError) {
        logger.warn({
          phoneNumber: data.phoneNumber.substring(0, 4) + '****'
        }, 'OTP verify rate limit exceeded');

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many verification attempts. Please try again later.',
            retryAfter: 1800
          }
        });
      }

      // Verify OTP
      const result = await otpService.verify(data.phoneNumber, data.otp);

      if (result.success) {
        // OTP verified - create session and generate tokens
        // In production, you'd fetch or create user record here
        const userId = `user-${Date.now()}`; // Placeholder

        const tokens = await authService.createSession({
          userId,
          phoneNumber: data.phoneNumber,
          role: 'user'
        });

        logger.info({
          userId,
          phoneNumber: data.phoneNumber.substring(0, 4) + '****'
        }, 'User authenticated successfully');

        res.status(200).json({
          success: true,
          message: 'Authentication successful',
          data: {
            userId,
            phoneNumber: data.phoneNumber,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn
          }
        });

      } else {
        const statusCode = result.reason === 'max_attempts' ? 429 : 401;

        res.status(statusCode).json({
          success: false,
          error: {
            code: result.reason?.toUpperCase(),
            message: this.getOTPErrorMessage(result.reason),
            attemptsRemaining: result.attemptsRemaining
          }
        });
      }

    } catch (error: any) {
      logger.error({ error }, 'OTP verification failed');

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify OTP'
        }
      });
    }
  });

  // ===========================================================================
  // POST /auth/otp/resend
  // Resend OTP code
  // ===========================================================================

  router.post('/auth/otp/resend', async (req: Request, res: Response) => {
    try {
      const data = PhoneNumberSchema.parse(req.body);

      // Rate limiting (stricter for resend)
      try {
        await otpRequestLimiter.consume(data.phoneNumber, 2); // Consume 2 points
      } catch (rateLimitError) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many resend requests',
            retryAfter: 300
          }
        });
      }

      const result = await otpService.resend(data.phoneNumber);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP resent successfully',
          messageId: result.messageId,
          expiresIn: 300
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'OTP_SEND_FAILED',
            message: result.error || 'Failed to resend OTP'
          }
        });
      }

    } catch (error: any) {
      logger.error({ error }, 'OTP resend failed');

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number',
            details: error.errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resend OTP'
        }
      });
    }
  });

  // ===========================================================================
  // POST /auth/token/refresh
  // Refresh access token
  // ===========================================================================

  router.post('/auth/token/refresh', async (req: Request, res: Response) => {
    try {
      const data = RefreshTokenSchema.parse(req.body);

      const result = await authService.refreshAccessToken(data.refreshToken);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            accessToken: result.accessToken,
            expiresIn: result.expiresIn
          }
        });
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: result.error || 'Invalid or expired refresh token'
          }
        });
      }

    } catch (error: any) {
      logger.error({ error }, 'Token refresh failed');

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: error.errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to refresh token'
        }
      });
    }
  });

  // ===========================================================================
  // POST /auth/logout
  // Logout (revoke token)
  // ===========================================================================

  router.post('/auth/logout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'No token provided'
          }
        });
      }

      const token = authHeader.substring(7);

      await authService.revokeToken(token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error({ error }, 'Logout failed');

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout'
        }
      });
    }
  });

  // Helper method
  function getOTPErrorMessage(reason?: string): string {
    switch (reason) {
      case 'invalid':
        return 'Invalid OTP code';
      case 'expired':
        return 'OTP code has expired. Please request a new one.';
      case 'max_attempts':
        return 'Maximum verification attempts exceeded. Please request a new OTP.';
      case 'not_found':
        return 'No OTP found for this phone number';
      default:
        return 'OTP verification failed';
    }
  }

  return router;
}
