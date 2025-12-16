/**
 * Authentication Service
 * 
 * Manages user sessions and JWT tokens
 */

import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'auth-service' });

export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string;   // e.g., '15m'
    refreshTokenExpiry: string;  // e.g., '7d'
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

export interface UserPayload {
  userId: string;
  phoneNumber: string;
  role?: string;
  kycLevel?: string;
  metadata?: Record<string, any>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string;           // userId
  phone: string;
  role?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti: string;           // JWT ID (for revocation)
}

/**
 * Authentication Service
 */
export class AuthService {
  private redis: Redis;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;

    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 1  // Use different DB from OTP
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });

    logger.info('Auth service initialized');
  }

  /**
   * Create session after successful OTP verification
   */
  async createSession(user: UserPayload): Promise<TokenPair> {
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    // Generate tokens
    const accessToken = this.generateAccessToken(user, accessTokenId);
    const refreshToken = this.generateRefreshToken(user, refreshTokenId);

    // Store tokens in Redis for revocation capability
    const accessExpiry = this.parseExpiry(this.config.jwt.accessTokenExpiry);
    const refreshExpiry = this.parseExpiry(this.config.jwt.refreshTokenExpiry);

    await Promise.all([
      this.redis.setex(
        `session:access:${accessTokenId}`,
        accessExpiry,
        JSON.stringify({ userId: user.userId, phoneNumber: user.phoneNumber })
      ),
      this.redis.setex(
        `session:refresh:${refreshTokenId}`,
        refreshExpiry,
        JSON.stringify({ userId: user.userId, phoneNumber: user.phoneNumber })
      ),
      // Store user's active sessions
      this.redis.sadd(`user:sessions:${user.userId}`, accessTokenId, refreshTokenId)
    ]);

    logger.info({
      userId: user.userId,
      phoneNumber: this.maskPhone(user.phoneNumber)
    }, 'Session created');

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiry
    };
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<{
    valid: boolean;
    payload?: JWTPayload;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret) as JWTPayload;

      if (decoded.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      // Check if token is revoked
      const exists = await this.redis.exists(`session:access:${decoded.jti}`);
      
      if (!exists) {
        return {
          valid: false,
          error: 'Token revoked or expired'
        };
      }

      return {
        valid: true,
        payload: decoded
      };

    } catch (error: any) {
      logger.warn({ error: error.message }, 'Token verification failed');

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as JWTPayload;

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type'
        };
      }

      // Check if refresh token is valid
      const sessionData = await this.redis.get(`session:refresh:${decoded.jti}`);
      
      if (!sessionData) {
        return {
          success: false,
          error: 'Refresh token expired or revoked'
        };
      }

      const user = JSON.parse(sessionData);

      // Generate new access token
      const accessTokenId = uuidv4();
      const newAccessToken = this.generateAccessToken(
        { userId: user.userId, phoneNumber: user.phoneNumber },
        accessTokenId
      );

      // Store new access token
      const accessExpiry = this.parseExpiry(this.config.jwt.accessTokenExpiry);
      await this.redis.setex(
        `session:access:${accessTokenId}`,
        accessExpiry,
        JSON.stringify(user)
      );

      // Add to user's active sessions
      await this.redis.sadd(`user:sessions:${user.userId}`, accessTokenId);

      logger.info({
        userId: user.userId
      }, 'Access token refreshed');

      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: accessExpiry
      };

    } catch (error: any) {
      logger.error({ error }, 'Token refresh failed');

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(token: string): Promise<{ success: boolean }> {
    try {
      const decoded = jwt.decode(token) as JWTPayload;

      if (!decoded || !decoded.jti) {
        return { success: false };
      }

      const key = decoded.type === 'access' 
        ? `session:access:${decoded.jti}`
        : `session:refresh:${decoded.jti}`;

      await this.redis.del(key);

      // Remove from user's active sessions
      if (decoded.sub) {
        await this.redis.srem(`user:sessions:${decoded.sub}`, decoded.jti);
      }

      logger.info({
        userId: decoded.sub,
        tokenType: decoded.type
      }, 'Token revoked');

      return { success: true };

    } catch (error) {
      logger.error({ error }, 'Token revocation failed');
      return { success: false };
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);

      if (sessionIds.length === 0) {
        return { success: true, count: 0 };
      }

      const keys = sessionIds.flatMap(id => [
        `session:access:${id}`,
        `session:refresh:${id}`
      ]);

      await this.redis.del(...keys);
      await this.redis.del(`user:sessions:${userId}`);

      logger.info({
        userId,
        sessionCount: sessionIds.length
      }, 'All user sessions revoked');

      return { success: true, count: sessionIds.length };

    } catch (error) {
      logger.error({ error, userId }, 'Failed to revoke user sessions');
      return { success: false, count: 0 };
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: UserPayload, jti: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.userId,
      phone: user.phoneNumber,
      role: user.role,
      type: 'access',
      jti
    };

    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.accessTokenExpiry
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: UserPayload, jti: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.userId,
      phone: user.phoneNumber,
      type: 'refresh',
      jti
    };

    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.refreshTokenExpiry
    });
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900; // 15 minutes default
    }
  }

  /**
   * Mask phone number
   */
  private maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * Get user's active session count
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);
    return sessionIds.length;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' }> {
    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
