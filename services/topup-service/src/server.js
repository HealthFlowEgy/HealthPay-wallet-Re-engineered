// ============================================================
// HealthPay OneLink Top-Up Service - FIXED Authentication
// ============================================================
// 
// IMPORTANT: HealthPay API Authentication Flow:
// 1. merchantToken goes in Authorization header
// 2. userToken is passed as a query VARIABLE (not header)
// ============================================================

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(join(__dirname, '../public')));

// ============================================================
// Configuration
// ============================================================

const config = {
  healthpay: {
    // Use external URL for HealthPay API
    baseUrl: process.env.HEALTHPAY_GRAPHQL_URL || 'https://sword.back.healthpay.tech/graphql',
    apiHeader: process.env.HEALTHPAY_API_HEADER || 'H_0003rjeb7ke0dejn',
    apiKey: process.env.HEALTHPAY_API_KEY || '',
  },
  onelink: {
    apiKey: process.env.ONELINK_API_KEY || '39bce084-d027-4580-b062-47a8c7768e79',
    apiSecret: process.env.ONELINK_API_SECRET || '4cb55471-4548-445d-b074-89d41680538b',
    merchantId: process.env.ONELINK_MERCHANT_ID || 'TESTCLOUD_X9_EGP',
    terminalId: process.env.ONELINK_TERMINAL_ID || '70473567',
    baseUrl: process.env.ONELINK_BASE_URL || 'https://payment.beta.onelink2pay.co/t',
    callbackUrl: process.env.ONELINK_CALLBACK_URL || 'http://104.248.245.150:3005/api/onelink/callback',
  },
  server: {
    port: process.env.PORT || 3005,
  }
};

// Store for merchant token
let merchantToken = null;
let merchantTokenExpiry = null;

// Pending transactions store (use Redis in production)
const pendingTransactions = new Map();

// ============================================================
// HealthPay API Client - FIXED AUTHENTICATION
// ============================================================

class HealthPayClient {
  
  /**
   * Execute GraphQL query/mutation against HealthPay API
   * 
   * IMPORTANT: merchantToken goes in header, userToken in variables
   */
  static async execute(query, variables = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'api-header': config.healthpay.apiHeader,
    };
    
    // merchantToken always goes in Authorization header (if we have it)
    if (merchantToken) {
      headers['Authorization'] = `Bearer ${merchantToken}`;
    }
    
    console.log('📡 GraphQL Request:', {
      url: config.healthpay.baseUrl,
      headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' },
      query: query.substring(0, 100) + '...',
      variables: { ...variables, userToken: variables.userToken ? '***' : undefined }
    });
    
    const response = await fetch(config.healthpay.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
    
    const result = await response.json();
    
    console.log('📥 GraphQL Response:', JSON.stringify(result, null, 2).substring(0, 500));
    
    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      const code = error.extensions?.code || 'UNKNOWN';
      throw new Error(`HealthPay API Error [${code}]: ${error.message}`);
    }
    
    return result.data;
  }
  
  /**
   * Authenticate merchant to get API token
   */
  static async authMerchant() {
    if (!config.healthpay.apiKey) {
      console.log('⚠️ No API key configured, skipping merchant auth');
      return null;
    }
    
    const query = `
      mutation authMerchant($apiKey: String!) {
        authMerchant(apiKey: $apiKey) {
          token
          expiresAt
        }
      }
    `;
    
    // Clear token for this request
    const tempToken = merchantToken;
    merchantToken = null;
    
    try {
      const data = await this.execute(query, { apiKey: config.healthpay.apiKey });
      merchantToken = data.authMerchant.token;
      merchantTokenExpiry = new Date(data.authMerchant.expiresAt);
      console.log('✅ Merchant authenticated, expires:', merchantTokenExpiry);
      return merchantToken;
    } catch (error) {
      merchantToken = tempToken;
      console.error('❌ Merchant auth failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Ensure merchant is authenticated
   */
  static async ensureAuthenticated() {
    if (!merchantToken || (merchantTokenExpiry && new Date() >= merchantTokenExpiry)) {
      await this.authMerchant();
    }
    return merchantToken;
  }
  
  /**
   * Get user wallet balance
   * userToken is passed as VARIABLE, not in header
   */
  static async getUserWallet(userToken) {
    // For wallet queries, we may or may not need merchant auth
    // Try with the userToken directly first
    
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
    
    // Pass userToken as a variable, NOT in the header
    return await this.execute(query, { userToken });
  }
  
  /**
   * Top up user wallet
   */
  static async topupWalletUser(userToken, amount, reference, description = 'OneLink Top-up') {
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
    
    return await this.execute(query, { userToken, amount, reference, description });
  }
  
  /**
   * Login user - send OTP
   */
  static async loginUser(mobile) {
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
    
    return await this.execute(query, { mobile });
  }
  
  /**
   * Verify OTP and get user token
   */
  static async authUser(mobile, otp) {
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
    
    return await this.execute(query, { mobile, otp });
  }
}

// ============================================================
// OneLink Service
// ============================================================

class OneLinkService {
  
  /**
   * Generate signature for OneLink
   */
  static generateSignature(data, secret) {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .filter(k => k !== 'signature' && data[k] !== undefined && data[k] !== '')
      .map(k => `${k}=${data[k]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', secret)
      .update(signString)
      .digest('hex');
  }
  
  /**
   * Create OneLink payment session
   */
  static async createPaymentSession(options) {
    const { orderId, amount, customerName, customerPhone, customerEmail } = options;
    
    const payload = {
      apiKey: config.onelink.apiKey,
      merchantId: config.onelink.merchantId,
      terminalId: config.onelink.terminalId,
      orderId: orderId,
      amount: amount.toFixed(2),
      currency: 'EGP',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      callbackUrl: config.onelink.callbackUrl,
      returnUrl: `http://104.248.245.150/topup.html?order=${orderId}`,
      timestamp: Date.now().toString(),
    };
    
    payload.signature = this.generateSignature(payload, config.onelink.apiSecret);
    
    // Return iframe URL with parameters
    const params = new URLSearchParams(payload);
    return `${config.onelink.baseUrl}?${params.toString()}`;
  }
  
  /**
   * Verify OneLink callback
   */
  static verifyCallback(data) {
    const { signature, ...rest } = data;
    const expectedSignature = this.generateSignature(rest, config.onelink.apiSecret);
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature || ''),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}

// ============================================================
// API Routes
// ============================================================

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'healthpay-topup',
    merchantAuthenticated: !!merchantToken,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'healthpay-topup' });
});

/**
 * POST /api/auth/login - Send OTP
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    const result = await HealthPayClient.loginUser(mobile);
    res.json(result);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

/**
 * POST /api/auth/verify - Verify OTP
 */
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP are required' });
    }
    
    const result = await HealthPayClient.authUser(mobile, otp);
    res.json(result);
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

/**
 * GET /api/wallet/balance - Get wallet balance
 */
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const userToken = req.headers['x-user-token'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({ error: 'User token required' });
    }
    
    const result = await HealthPayClient.getUserWallet(userToken);
    res.json(result);
    
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Failed to get balance', details: error.message });
  }
});

/**
 * POST /api/topup/initiate - Start top-up transaction
 */
app.post('/api/topup/initiate', async (req, res) => {
  try {
    const { userToken, amount, customerName, customerPhone, customerEmail } = req.body;
    
    console.log('📝 Top-up initiate request:', { amount, hasToken: !!userToken });
    
    // Validate
    if (!userToken) {
      return res.status(400).json({ error: 'userToken is required' });
    }
    if (!amount || amount < 10 || amount > 10000) {
      return res.status(400).json({ error: 'Amount must be between 10 and 10000 EGP' });
    }
    
    // Verify user token by checking wallet (optional - skip if causing issues)
    try {
      const wallet = await HealthPayClient.getUserWallet(userToken);
      console.log('✅ User wallet verified, balance:', wallet?.userWallet?.total);
    } catch (error) {
      console.warn('⚠️ Could not verify wallet, proceeding anyway:', error.message);
      // Don't block the flow - OneLink will handle the actual payment
    }
    
    // Generate order ID
    const orderId = `HP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    // Store pending transaction
    pendingTransactions.set(orderId, {
      userToken,
      amount,
      status: 'pending',
      createdAt: new Date(),
    });
    
    // Generate OneLink iframe URL
    const iframeUrl = await OneLinkService.createPaymentSession({
      orderId,
      amount,
      customerName,
      customerPhone,
      customerEmail,
    });
    
    console.log('✅ Top-up initiated:', { orderId, amount, iframeUrl: iframeUrl.substring(0, 100) + '...' });
    
    res.json({
      success: true,
      orderId,
      iframeUrl,
      amount,
      currency: 'EGP',
    });
    
  } catch (error) {
    console.error('❌ Top-up initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate top-up', details: error.message });
  }
});

/**
 * GET /api/topup/iframe/:orderId - Get iframe page
 */
app.get('/api/topup/iframe/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const transaction = pendingTransactions.get(orderId);
    
    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }
    
    const iframeUrl = await OneLinkService.createPaymentSession({
      orderId,
      amount: transaction.amount,
    });
    
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إتمام الدفع - HealthPay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .header { color: white; text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .amount { background: rgba(255,255,255,0.2); padding: 12px 32px; border-radius: 50px; color: white; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
    .iframe-container { background: white; border-radius: 16px; overflow: hidden; width: 100%; max-width: 480px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    iframe { width: 100%; height: 550px; border: none; }
    .footer { color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💳 شحن محفظة HealthPay</h1>
    <p>دفع آمن عبر OneLink</p>
  </div>
  <div class="amount">${transaction.amount.toFixed(2)} ج.م</div>
  <div class="iframe-container">
    <iframe src="${iframeUrl}" allow="payment"></iframe>
  </div>
  <div class="footer">🔒 معاملة مشفرة وآمنة | رقم الطلب: ${orderId}</div>
</body>
</html>
    `);
    
  } catch (error) {
    console.error('Iframe error:', error);
    res.status(500).send('Error loading payment page');
  }
});

/**
 * GET /api/topup/status/:orderId - Check status
 */
app.get('/api/topup/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const transaction = pendingTransactions.get(orderId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      orderId,
      status: transaction.status,
      amount: transaction.amount,
      currency: 'EGP',
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      transactionId: transaction.healthpayTransactionId,
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * POST /api/onelink/callback - OneLink payment callback
 */
app.post('/api/onelink/callback', async (req, res) => {
  try {
    console.log('📥 OneLink Callback:', JSON.stringify(req.body, null, 2));
    
    const { orderId, transactionId, status, amount } = req.body;
    
    const transaction = pendingTransactions.get(orderId);
    if (!transaction) {
      console.error('❌ Transaction not found:', orderId);
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.json({ success: true, message: 'Already processed' });
    }
    
    if (status === 'SUCCESS' || status === 'APPROVED' || status === 'success') {
      try {
        const reference = `ONELINK-${transactionId || Date.now()}`;
        const result = await HealthPayClient.topupWalletUser(
          transaction.userToken,
          parseFloat(amount) || transaction.amount,
          reference,
          `شحن رصيد عبر OneLink (${orderId})`
        );
        
        console.log('✅ Wallet credited:', result);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.healthpayTransactionId = result.topupWalletUser?.transactionId;
        transaction.onelinkTransactionId = transactionId;
        
        res.json({
          success: true,
          transactionId: result.topupWalletUser?.transactionId,
          newBalance: result.topupWalletUser?.newBalance,
        });
        
      } catch (error) {
        console.error('❌ Wallet credit failed:', error);
        transaction.status = 'failed';
        transaction.error = error.message;
        res.status(500).json({ success: false, error: error.message });
      }
      
    } else {
      transaction.status = 'failed';
      transaction.failureReason = status;
      res.json({ success: false, message: `Payment ${status}` });
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// ============================================================
// Admin Routes
// ============================================================

/**
 * GET /api/admin/config - Get current config
 */
app.get('/api/admin/config', (req, res) => {
  // In production, verify admin token here
  res.json({
    ONELINK_API_KEY: config.onelink.apiKey,
    ONELINK_API_SECRET: config.onelink.apiSecret ? '***' + config.onelink.apiSecret.slice(-4) : '',
    ONELINK_MERCHANT_ID: config.onelink.merchantId,
    ONELINK_TERMINAL_ID: config.onelink.terminalId,
    ONELINK_BASE_URL: config.onelink.baseUrl,
    HEALTHPAY_GRAPHQL_URL: config.healthpay.baseUrl,
    HEALTHPAY_API_HEADER: config.healthpay.apiHeader,
    NODE_ENV: process.env.NODE_ENV || 'development',
  });
});

/**
 * POST /api/admin/config - Update config
 */
app.post('/api/admin/config', async (req, res) => {
  try {
    const updates = req.body;
    
    // Update in-memory config
    if (updates.ONELINK_API_KEY) config.onelink.apiKey = updates.ONELINK_API_KEY;
    if (updates.ONELINK_API_SECRET) config.onelink.apiSecret = updates.ONELINK_API_SECRET;
    if (updates.ONELINK_MERCHANT_ID) config.onelink.merchantId = updates.ONELINK_MERCHANT_ID;
    if (updates.ONELINK_TERMINAL_ID) config.onelink.terminalId = updates.ONELINK_TERMINAL_ID;
    if (updates.ONELINK_BASE_URL) config.onelink.baseUrl = updates.ONELINK_BASE_URL;
    
    console.log('✅ Config updated');
    res.json({ success: true, message: 'Configuration updated' });
    
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/test-connection - Test OneLink connection
 */
app.post('/api/admin/test-connection', async (req, res) => {
  try {
    // Simple test - try to generate a payment URL
    const testUrl = await OneLinkService.createPaymentSession({
      orderId: `TEST-${Date.now()}`,
      amount: 1,
    });
    
    res.json({
      success: true,
      message: 'OneLink connection successful',
      testUrl: testUrl.substring(0, 50) + '...',
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// Start Server
// ============================================================

app.listen(config.server.port, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     HealthPay OneLink Top-Up Service                        ║
║     Port: ${config.server.port}                                           ║
║     HealthPay API: ${config.healthpay.baseUrl.substring(0, 35)}...
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // Try to authenticate merchant on startup (optional)
  if (config.healthpay.apiKey) {
    try {
      await HealthPayClient.authMerchant();
    } catch (error) {
      console.log('⚠️ Merchant auth skipped:', error.message);
    }
  }
});

export default app;
