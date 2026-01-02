// ============================================================
// HealthPay OneLink Top-Up Service - TypeScript Module
// ============================================================
// 
// This can be imported into your existing NestJS/Express backend
// 
// Usage:
//   import { HealthPayOneLink } from './healthpay-onelink.service';
//   
//   const onelink = new HealthPayOneLink({
//     healthpay: { apiHeader: 'xxx', apiKey: 'xxx' },
//     onelink: { merchantId: 'xxx', secretKey: 'xxx' }
//   });
//   
//   const iframeUrl = await onelink.initiateTopup(userToken, 100);
// ============================================================

import * as crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface HealthPayConfig {
  baseUrl?: string;
  apiHeader: string;
  apiKey: string;
}

export interface OneLinkConfig {
  merchantId: string;
  terminalId: string;
  secretKey: string;
  iframeUrl?: string;
  callbackUrl: string;
}

export interface ServiceConfig {
  healthpay: HealthPayConfig;
  onelink: OneLinkConfig;
}

export interface TopupInitiateOptions {
  userToken: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface TopupInitiateResult {
  success: boolean;
  orderId: string;
  iframeUrl: string;
  iframeHtml: string;
  amount: number;
  currency: string;
}

export interface WalletBalance {
  total: number;
  balance: Array<{
    uid: string;
    amount: number;
    type: string;
    createdAt: string;
  }>;
}

export interface OneLinkCallbackPayload {
  order_id: string;
  transaction_id: string;
  status: string;
  amount: string;
  currency: string;
  signature: string;
  metadata?: string;
}

export interface TopupResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  message: string;
  error?: string;
}

// ============================================================
// HealthPay API Client
// ============================================================

export class HealthPayApiClient {
  private config: HealthPayConfig;
  private merchantToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: HealthPayConfig) {
    this.config = {
      baseUrl: 'https://sword.back.healthpay.tech/graphql',
      ...config,
    };
  }

  /**
   * Execute GraphQL operation
   */
  private async execute<T>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-header': this.config.apiHeader,
    };

    if (this.merchantToken) {
      headers['Authorization'] = `Bearer ${this.merchantToken}`;
    }

    const response = await fetch(this.config.baseUrl!, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      const code = error.extensions?.code || 'UNKNOWN';
      throw new Error(`HealthPay API Error [${code}]: ${error.message}`);
    }

    return result.data;
  }

  /**
   * Authenticate merchant
   */
  async authMerchant(): Promise<string> {
    const query = `
      mutation authMerchant($apiKey: String!) {
        authMerchant(apiKey: $apiKey) {
          token
          expiresAt
        }
      }
    `;

    // Clear token for this request
    const prevToken = this.merchantToken;
    this.merchantToken = null;

    try {
      const data = await this.execute<{ authMerchant: { token: string; expiresAt: string } }>(
        query,
        { apiKey: this.config.apiKey }
      );

      this.merchantToken = data.authMerchant.token;
      this.tokenExpiry = new Date(data.authMerchant.expiresAt);

      return this.merchantToken;
    } catch (error) {
      this.merchantToken = prevToken;
      throw error;
    }
  }

  /**
   * Ensure authenticated
   */
  async ensureAuthenticated(): Promise<void> {
    const needsAuth = !this.merchantToken || 
      (this.tokenExpiry && new Date() >= this.tokenExpiry);

    if (needsAuth) {
      await this.authMerchant();
    }
  }

  /**
   * Get user wallet balance
   */
  async getUserWallet(userToken: string): Promise<WalletBalance> {
    await this.ensureAuthenticated();

    const query = `
      query userWallet($userToken: String!) {
        userWallet(userToken: $userToken) {
          total
          balance {
            uid
            amount
            type
            createdAt
          }
        }
      }
    `;

    const data = await this.execute<{ userWallet: WalletBalance }>(query, { userToken });
    return data.userWallet;
  }

  /**
   * Top up user wallet
   */
  async topupWallet(
    userToken: string,
    amount: number,
    reference: string,
    description?: string
  ): Promise<TopupResult> {
    await this.ensureAuthenticated();

    const query = `
      mutation topupWalletUser(
        $userToken: String!
        $amount: Float!
        $reference: String!
        $description: String
      ) {
        topupWalletUser(
          userToken: $userToken
          amount: $amount
          reference: $reference
          description: $description
        ) {
          success
          transactionId
          newBalance
          message
        }
      }
    `;

    const data = await this.execute<{ topupWalletUser: TopupResult }>(query, {
      userToken,
      amount,
      reference,
      description: description || 'OneLink Top-up',
    });

    return data.topupWalletUser;
  }

  /**
   * Send login OTP
   */
  async loginUser(mobile: string): Promise<{ success: boolean; message: string }> {
    await this.ensureAuthenticated();

    const query = `
      mutation loginUser($mobile: String!) {
        loginUser(mobile: $mobile) {
          success
          message
          otpSent
        }
      }
    `;

    const data = await this.execute<{ loginUser: { success: boolean; message: string } }>(
      query,
      { mobile }
    );
    return data.loginUser;
  }

  /**
   * Verify OTP and get user token
   */
  async authUser(mobile: string, otp: string): Promise<{ userToken: string; user: any }> {
    await this.ensureAuthenticated();

    const query = `
      mutation authUser($mobile: String!, $otp: String!) {
        authUser(mobile: $mobile, otp: $otp) {
          userToken
          user {
            uid
            mobile
            fullName
          }
        }
      }
    `;

    const data = await this.execute<{ authUser: { userToken: string; user: any } }>(
      query,
      { mobile, otp }
    );
    return data.authUser;
  }
}

// ============================================================
// OneLink Service
// ============================================================

export class OneLinkService {
  private config: OneLinkConfig;

  constructor(config: OneLinkConfig) {
    this.config = {
      iframeUrl: 'https://checkout.onelink.eg/iframe',
      ...config,
    };
  }

  /**
   * Generate HMAC signature
   */
  generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .filter(key => key !== 'signature')
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signString)
      .digest('hex');
  }

  /**
   * Verify callback signature
   */
  verifySignature(params: Record<string, string>, signature: string): boolean {
    const expected = this.generateSignature(params);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate iframe URL
   */
  generateIframeUrl(options: {
    orderId: string;
    amount: number;
    metadata?: Record<string, any>;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    returnUrl?: string;
  }): string {
    const params: Record<string, string> = {
      merchant_id: this.config.merchantId,
      terminal_id: this.config.terminalId,
      order_id: options.orderId,
      amount: options.amount.toFixed(2),
      currency: 'EGP',
      callback_url: this.config.callbackUrl,
      timestamp: Date.now().toString(),
    };

    if (options.customerName) params.customer_name = options.customerName;
    if (options.customerEmail) params.customer_email = options.customerEmail;
    if (options.customerPhone) params.customer_phone = options.customerPhone;
    if (options.returnUrl) params.return_url = options.returnUrl;
    if (options.metadata) params.metadata = JSON.stringify(options.metadata);

    params.signature = this.generateSignature(params);

    const queryString = new URLSearchParams(params).toString();
    return `${this.config.iframeUrl}?${queryString}`;
  }
}

// ============================================================
// Main Service - Combines HealthPay + OneLink
// ============================================================

export class HealthPayOneLink {
  private healthpay: HealthPayApiClient;
  private onelink: OneLinkService;
  private pendingTransactions: Map<string, {
    userToken: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    transactionId?: string;
    error?: string;
  }> = new Map();

  constructor(config: ServiceConfig) {
    this.healthpay = new HealthPayApiClient(config.healthpay);
    this.onelink = new OneLinkService(config.onelink);
  }

  /**
   * Initialize (authenticate merchant)
   */
  async initialize(): Promise<void> {
    await this.healthpay.authMerchant();
  }

  /**
   * Initiate a top-up transaction
   */
  async initiateTopup(options: TopupInitiateOptions): Promise<TopupInitiateResult> {
    // Verify user token is valid
    try {
      await this.healthpay.getUserWallet(options.userToken);
    } catch (error) {
      throw new Error(`Invalid user token: ${(error as Error).message}`);
    }

    // Generate order ID
    const orderId = `TOPUP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Store pending transaction
    this.pendingTransactions.set(orderId, {
      userToken: options.userToken,
      amount: options.amount,
      status: 'pending',
      createdAt: new Date(),
    });

    // Generate iframe URL
    const iframeUrl = this.onelink.generateIframeUrl({
      orderId,
      amount: options.amount,
      metadata: { userToken: options.userToken, ...options.metadata },
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
      returnUrl: options.returnUrl,
    });

    // Generate embeddable HTML
    const iframeHtml = this.generateIframeHtml(iframeUrl, options.amount, orderId);

    return {
      success: true,
      orderId,
      iframeUrl,
      iframeHtml,
      amount: options.amount,
      currency: 'EGP',
    };
  }

  /**
   * Process OneLink callback
   */
  async processCallback(payload: OneLinkCallbackPayload): Promise<TopupResult> {
    const { order_id: orderId, transaction_id: onelinkTxnId, status, amount } = payload;

    // Get pending transaction
    const transaction = this.pendingTransactions.get(orderId);
    if (!transaction) {
      return { success: false, message: 'Transaction not found' };
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      return { success: true, message: 'Already processed', transactionId: transaction.transactionId };
    }

    // Process based on status
    if (status === 'success' || status === 'APPROVED') {
      try {
        const reference = `ONELINK-${onelinkTxnId}`;
        const result = await this.healthpay.topupWallet(
          transaction.userToken,
          parseFloat(amount),
          reference,
          `Wallet top-up via OneLink (${orderId})`
        );

        // Update transaction
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.transactionId = result.transactionId;

        return {
          success: true,
          transactionId: result.transactionId,
          newBalance: result.newBalance,
          message: 'Wallet credited successfully',
        };
      } catch (error) {
        transaction.status = 'failed';
        transaction.error = (error as Error).message;

        return {
          success: false,
          message: 'Failed to credit wallet',
          error: (error as Error).message,
        };
      }
    } else {
      transaction.status = 'failed';
      transaction.error = `Payment ${status}`;

      return {
        success: false,
        message: `Payment ${status}`,
      };
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(orderId: string) {
    return this.pendingTransactions.get(orderId);
  }

  /**
   * Generate iframe HTML
   */
  private generateIframeHtml(iframeUrl: string, amount: number, orderId: string): string {
    return `
<div id="healthpay-topup-${orderId}" style="max-width: 500px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #1a5f2a, #2e7d32); padding: 20px; border-radius: 16px 16px 0 0; color: white; text-align: center;">
    <h3 style="margin: 0 0 8px;">💳 HealthPay Wallet Top-Up</h3>
    <div style="font-size: 28px; font-weight: bold;">EGP ${amount.toFixed(2)}</div>
  </div>
  <div style="background: white; border-radius: 0 0 16px 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
    <iframe 
      src="${iframeUrl}" 
      style="width: 100%; height: 500px; border: none;"
      allow="payment"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    ></iframe>
  </div>
  <div style="text-align: center; margin-top: 12px; color: #666; font-size: 12px;">
    🔒 Secured with SSL encryption | Order: ${orderId}
  </div>
</div>
    `.trim();
  }

  /**
   * Get user wallet balance
   */
  async getWalletBalance(userToken: string): Promise<WalletBalance> {
    return this.healthpay.getUserWallet(userToken);
  }

  /**
   * Login user (send OTP)
   */
  async loginUser(mobile: string) {
    return this.healthpay.loginUser(mobile);
  }

  /**
   * Verify OTP
   */
  async verifyOtp(mobile: string, otp: string) {
    return this.healthpay.authUser(mobile, otp);
  }
}

export default HealthPayOneLink;
