/**
 * OTP Service
 * 
 * Handles OTP generation, validation, and storage
 */

import Redis from 'ioredis';
import { CequensSMSService } from './cequens-sms.service';
import pino from 'pino';

const logger = pino({ name: 'otp-service' });

export interface OTPConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  otp: {
    length: number;
    expiryMinutes: number;
    maxAttempts: number;
  };
}

export interface OTPVerificationResult {
  success: boolean;
  reason?: 'valid' | 'invalid' | 'expired' | 'max_attempts' | 'not_found';
  attemptsRemaining?: number;
}

/**
 * OTP Service
 */
export class OTPService {
  private redis: Redis;
  private smsService: CequensSMSService;
  private config: OTPConfig;

  constructor(config: OTPConfig, smsService: CequensSMSService) {
    this.config = config;
    this.smsService = smsService;

    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  /**
   * Generate and send OTP
   */
  async generateAndSend(phoneNumber: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    cooldownSeconds?: number;
  }> {
    try {
      // Check rate limiting (cooldown between requests)
      const cooldownKey = `otp:cooldown:${phoneNumber}`;
      const cooldown = await this.redis.get(cooldownKey);

      if (cooldown) {
        const ttl = await this.redis.ttl(cooldownKey);
        logger.warn({ phoneNumber: this.maskPhone(phoneNumber) }, 'OTP cooldown active');
        
        return {
          success: false,
          error: 'Please wait before requesting another OTP',
          cooldownSeconds: ttl
        };
      }

      // Generate OTP
      const otp = this.generateOTP(this.config.otp.length);

      // Store OTP in Redis
      const otpKey = `otp:code:${phoneNumber}`;
      const attemptsKey = `otp:attempts:${phoneNumber}`;

      const pipeline = this.redis.pipeline();
      pipeline.setex(otpKey, this.config.otp.expiryMinutes * 60, otp);
      pipeline.setex(attemptsKey, this.config.otp.expiryMinutes * 60, '0');
      pipeline.setex(cooldownKey, 60, '1'); // 60 second cooldown
      await pipeline.exec();

      logger.info({
        phoneNumber: this.maskPhone(phoneNumber),
        expiryMinutes: this.config.otp.expiryMinutes
      }, 'OTP generated and stored');

      // Send SMS
      const smsResult = await this.smsService.sendOTP(phoneNumber, otp);

      if (smsResult.success) {
        logger.info({
          phoneNumber: this.maskPhone(phoneNumber),
          messageId: smsResult.messageId
        }, 'OTP sent successfully');

        return {
          success: true,
          messageId: smsResult.messageId
        };
      } else {
        // SMS failed, clean up OTP
        await this.redis.del(otpKey, attemptsKey);

        logger.error({
          phoneNumber: this.maskPhone(phoneNumber),
          error: smsResult.error
        }, 'Failed to send OTP SMS');

        return {
          success: false,
          error: smsResult.error || 'Failed to send SMS'
        };
      }

    } catch (error: any) {
      logger.error({ error, phoneNumber: this.maskPhone(phoneNumber) }, 'OTP generation failed');
      
      return {
        success: false,
        error: 'Internal error generating OTP'
      };
    }
  }

  /**
   * Verify OTP
   */
  async verify(phoneNumber: string, otp: string): Promise<OTPVerificationResult> {
    try {
      const otpKey = `otp:code:${phoneNumber}`;
      const attemptsKey = `otp:attempts:${phoneNumber}`;

      // Get stored OTP
      const storedOTP = await this.redis.get(otpKey);

      if (!storedOTP) {
        logger.warn({
          phoneNumber: this.maskPhone(phoneNumber)
        }, 'OTP not found or expired');

        return {
          success: false,
          reason: 'expired'
        };
      }

      // Check attempts
      const attempts = parseInt(await this.redis.get(attemptsKey) || '0');

      if (attempts >= this.config.otp.maxAttempts) {
        logger.warn({
          phoneNumber: this.maskPhone(phoneNumber),
          attempts
        }, 'Max OTP attempts exceeded');

        // Delete OTP after max attempts
        await this.redis.del(otpKey, attemptsKey);

        return {
          success: false,
          reason: 'max_attempts',
          attemptsRemaining: 0
        };
      }

      // Verify OTP
      if (otp === storedOTP) {
        logger.info({
          phoneNumber: this.maskPhone(phoneNumber)
        }, 'OTP verified successfully');

        // Delete OTP after successful verification
        await this.redis.del(otpKey, attemptsKey, `otp:cooldown:${phoneNumber}`);

        return {
          success: true,
          reason: 'valid'
        };
      } else {
        // Increment attempts
        await this.redis.incr(attemptsKey);
        const newAttempts = attempts + 1;
        const remaining = this.config.otp.maxAttempts - newAttempts;

        logger.warn({
          phoneNumber: this.maskPhone(phoneNumber),
          attempts: newAttempts,
          remaining
        }, 'Invalid OTP');

        return {
          success: false,
          reason: 'invalid',
          attemptsRemaining: remaining
        };
      }

    } catch (error: any) {
      logger.error({ error, phoneNumber: this.maskPhone(phoneNumber) }, 'OTP verification failed');

      return {
        success: false,
        reason: 'not_found'
      };
    }
  }

  /**
   * Resend OTP (generates new one)
   */
  async resend(phoneNumber: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Clear existing OTP
    await this.redis.del(
      `otp:code:${phoneNumber}`,
      `otp:attempts:${phoneNumber}`
    );

    // Generate and send new OTP
    return this.generateAndSend(phoneNumber);
  }

  /**
   * Generate numeric OTP
   */
  private generateOTP(length: number): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  /**
   * Mask phone number for logging
   */
  private maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * Get remaining attempts for phone number
   */
  async getRemainingAttempts(phoneNumber: string): Promise<number> {
    const attemptsKey = `otp:attempts:${phoneNumber}`;
    const attempts = parseInt(await this.redis.get(attemptsKey) || '0');
    return Math.max(0, this.config.otp.maxAttempts - attempts);
  }

  /**
   * Clear OTP for phone number (admin use)
   */
  async clearOTP(phoneNumber: string): Promise<void> {
    await this.redis.del(
      `otp:code:${phoneNumber}`,
      `otp:attempts:${phoneNumber}`,
      `otp:cooldown:${phoneNumber}`
    );

    logger.info({
      phoneNumber: this.maskPhone(phoneNumber)
    }, 'OTP cleared');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; redis: boolean }> {
    try {
      await this.redis.ping();
      return { status: 'healthy', redis: true };
    } catch (error) {
      return { status: 'unhealthy', redis: false };
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
    logger.info('Redis connection closed');
  }
}
