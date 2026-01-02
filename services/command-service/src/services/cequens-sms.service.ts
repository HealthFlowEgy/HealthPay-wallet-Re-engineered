/**
 * Cequens SMS Service
 * 
 * Integration with Cequens SMS Gateway for OTP delivery
 * https://developer.cequens.com/reference/sending-sms
 */

import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino({ name: 'cequens-sms' });

export interface CequensConfig {
  apiUrl: string;
  apiKey: string;
  senderId: string;
  timeout?: number;
}

export interface SendSMSRequest {
  phoneNumber: string;
  message: string;
  messageId?: string;
}

export interface SendSMSResponse {
  success: boolean;
  messageId: string;
  status: string;
  error?: string;
}

/**
 * Cequens SMS Service
 */
export class CequensSMSService {
  private client: AxiosInstance;
  private config: CequensConfig;

  constructor(config: CequensConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    logger.info({ apiUrl: config.apiUrl }, 'Cequens SMS service initialized');
  }

  /**
   * Send SMS message
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      // Validate and format phone number
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        messageText: request.message,
        recipients: formattedPhone,
        senderId: this.config.senderId,
        messageId: request.messageId || this.generateMessageId(),
        flash: false
      };

      logger.info({
        phoneNumber: this.maskPhoneNumber(formattedPhone),
        messageId: payload.messageId
      }, 'Sending SMS via Cequens');

      const response = await this.client.post('/send', payload);

      if (response.data && response.data.success) {
        logger.info({
          messageId: payload.messageId,
          status: response.data.status
        }, 'SMS sent successfully');

        return {
          success: true,
          messageId: payload.messageId,
          status: response.data.status || 'sent'
        };
      } else {
        throw new Error(response.data?.message || 'Failed to send SMS');
      }

    } catch (error: any) {
      logger.error({
        error: error.message,
        phoneNumber: this.maskPhoneNumber(request.phoneNumber)
      }, 'Failed to send SMS');

      return {
        success: false,
        messageId: request.messageId || '',
        status: 'failed',
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send OTP SMS (convenience method)
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<SendSMSResponse> {
    const message = `Your HealthPay verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    return this.sendSMS({
      phoneNumber,
      message,
      messageId: `OTP-${Date.now()}`
    });
  }

  /**
   * Format phone number to E.164 format
   * Handles Egyptian numbers (+20)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 20 (Egypt country code), add +
    if (cleaned.startsWith('20')) {
      return `+${cleaned}`;
    }

    // If starts with 0, remove it and add +20
    if (cleaned.startsWith('0')) {
      return `+20${cleaned.substring(1)}`;
    }

    // If 10 digits, assume Egyptian number
    if (cleaned.length === 10) {
      return `+20${cleaned}`;
    }

    // If already has country code but no +
    if (cleaned.length === 12) {
      return `+${cleaned}`;
    }

    // If starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }

    // Default: assume Egyptian number
    return `+20${cleaned}`;
  }

  /**
   * Mask phone number for logging (privacy)
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return '***';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Check delivery status (if supported by Cequens)
   */
  async checkStatus(messageId: string): Promise<{
    messageId: string;
    status: string;
    deliveredAt?: string;
  }> {
    try {
      const response = await this.client.get(`/status/${messageId}`);
      return {
        messageId,
        status: response.data.status,
        deliveredAt: response.data.deliveredAt
      };
    } catch (error: any) {
      logger.error({ error, messageId }, 'Failed to check SMS status');
      return {
        messageId,
        status: 'unknown'
      };
    }
  }
}
