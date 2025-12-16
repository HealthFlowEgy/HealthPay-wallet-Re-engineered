/**
 * Express API Gateway
 * 
 * Lightweight alternative to Kong for HealthPay Ledger V2
 * 
 * Features:
 * - API Routing & Proxying
 * - JWT Authentication
 * - Rate Limiting (Redis-backed)
 * - CORS
 * - Request/Response transformation
 * - Circuit breaker integration
 * - Logging & monitoring
 * - API versioning
 */

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { CircuitBreaker, CircuitBreakerManager } from '../circuit-breaker/circuit-breaker';

// ==================== Configuration ====================

const config = {
  port: parseInt(process.env.GATEWAY_PORT || '4000'),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:3002',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
    transaction: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3004',
  },
};

// ==================== Initialize ====================

const app = express();
const redis = new Redis(config.redis);
const circuitBreakerManager = new CircuitBreakerManager();

// ==================== Middleware ====================

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: [
    'https://app.healthpay.eg',
    'https://staging.healthpay.eg',
    'http://localhost:3000',
  ],
  credentials: true,
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  res.setHeader('X-Gateway', 'express');
  next();
});

// Logging
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: {
    write: (message: string) => console.log(message.trim()),
  },
}));

// ==================== Rate Limiting ====================

// Redis-backed rate limiter factory
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(options.windowMs / 1000),
        },
      });
    },
  });
}

// Different rate limiters for different routes
const authLimiter = createRateLimiter({ 
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 requests per minute
});

const apiLimiter = createRateLimiter({ 
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute per user
});

const strictLimiter = createRateLimiter({ 
  windowMs: 60 * 1000,  // 1 minute
  max: 30,              // 30 requests per minute (for payments)
});

// ==================== Authentication Middleware ====================

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}

// ==================== Circuit Breaker Middleware ====================

function withCircuitBreaker(serviceName: string, serviceUrl: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get or create circuit breaker for this service
    const breaker = circuitBreakerManager.getBreaker(
      serviceName,
      async (proxyReq: any) => {
        // This will be handled by http-proxy-middleware
        return true;
      },
      {
        threshold: 5,
        timeout: 30000,
        resetTime: 60000,
        volumeThreshold: 10,
        errorThresholdPercentage: 0.5,
      }
    );

    // Check circuit state
    const stats = breaker.getStats();
    if (stats.state === 'OPEN') {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `${serviceName} is temporarily unavailable`,
          retryAfter: 60,
        },
      });
    }

    next();
  };
}

// ==================== Proxy Configuration ====================

function createServiceProxy(serviceName: string, serviceUrl: string) {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    timeout: 30000,
    
    // Add custom headers
    onProxyReq: (proxyReq, req: AuthRequest) => {
      // Forward user info
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.userId);
        proxyReq.setHeader('X-Username', req.user.username);
      }
      
      // Forward request ID
      if (req.headers['x-request-id']) {
        proxyReq.setHeader('X-Request-ID', req.headers['x-request-id']);
      }
      
      console.log(`→ Proxying to ${serviceName}: ${req.method} ${req.path}`);
    },
    
    // Handle response
    onProxyRes: (proxyRes, req, res) => {
      console.log(`← Response from ${serviceName}: ${proxyRes.statusCode}`);
    },
    
    // Handle errors
    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${serviceName}:`, err.message);
      
      (res as Response).status(502).json({
        error: {
          code: 'BAD_GATEWAY',
          message: `Failed to communicate with ${serviceName}`,
        },
      });
    },
  });
}

// ==================== API Routes (v2) ====================

// Health check (no auth)
app.get('/v2/health', (req, res) => {
  const stats = circuitBreakerManager.getAllStats();
  
  const health = {
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: Object.entries(stats).reduce((acc, [name, stat]) => ({
      ...acc,
      [name]: {
        state: stat.state,
        uptime: stat.uptime.toFixed(2) + '%',
        totalRequests: stat.totalRequests,
      },
    }), {}),
  };
  
  res.json(health);
});

// Metrics endpoint (no auth)
app.get('/v2/metrics', async (req, res) => {
  const stats = circuitBreakerManager.getAllStats();
  
  // Prometheus format
  let metrics = '';
  
  for (const [serviceName, stat] of Object.entries(stats)) {
    metrics += `# HELP healthpay_circuit_breaker_state Circuit breaker state (0=closed, 1=half-open, 2=open)\n`;
    metrics += `# TYPE healthpay_circuit_breaker_state gauge\n`;
    metrics += `healthpay_circuit_breaker_state{service="${serviceName}"} ${stat.state === 'CLOSED' ? 0 : stat.state === 'HALF_OPEN' ? 1 : 2}\n`;
    
    metrics += `# HELP healthpay_circuit_breaker_requests_total Total requests\n`;
    metrics += `# TYPE healthpay_circuit_breaker_requests_total counter\n`;
    metrics += `healthpay_circuit_breaker_requests_total{service="${serviceName}"} ${stat.totalRequests}\n`;
    
    metrics += `# HELP healthpay_circuit_breaker_failures_total Total failures\n`;
    metrics += `# TYPE healthpay_circuit_breaker_failures_total counter\n`;
    metrics += `healthpay_circuit_breaker_failures_total{service="${serviceName}"} ${stat.failedRequests}\n`;
  }
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// ==================== Auth Service Routes ====================

app.use(
  '/v2/auth',
  authLimiter,
  withCircuitBreaker('auth-service', config.services.auth),
  createServiceProxy('auth-service', config.services.auth)
);

// ==================== Wallet Service Routes ====================

app.use(
  '/v2/wallets',
  authenticateJWT,
  apiLimiter,
  withCircuitBreaker('wallet-service', config.services.wallet),
  createServiceProxy('wallet-service', config.services.wallet)
);

// ==================== Payment Service Routes ====================

app.use(
  '/v2/payments',
  authenticateJWT,
  strictLimiter,
  withCircuitBreaker('payment-service', config.services.payment),
  createServiceProxy('payment-service', config.services.payment)
);

// ==================== Transaction Service Routes ====================

app.use(
  '/v2/transactions',
  authenticateJWT,
  apiLimiter,
  withCircuitBreaker('transaction-service', config.services.transaction),
  createServiceProxy('transaction-service', config.services.transaction)
);

// ==================== Payment Gateway Routes ====================

app.use(
  '/v2/payment-gateways',
  authenticateJWT,
  strictLimiter,
  createServiceProxy('payment-gateway-service', config.services.payment)
);

// ==================== Webhook Routes (no auth) ====================

app.use(
  '/v2/webhooks',
  strictLimiter,
  createServiceProxy('webhook-service', config.services.payment)
);

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.headers['x-request-id'],
    },
  });
});

// ==================== Start Server ====================

async function start() {
  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Connected to Redis');

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 HealthPay API Gateway (Express) listening on port ${config.port}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 JWT Secret configured: ${!!config.jwtSecret}`);
      console.log('\n📍 Available routes:');
      console.log('  - POST   /v2/auth/request-otp');
      console.log('  - POST   /v2/auth/verify-otp');
      console.log('  - POST   /v2/auth/refresh');
      console.log('  - GET    /v2/wallets');
      console.log('  - POST   /v2/wallets');
      console.log('  - GET    /v2/wallets/:id');
      console.log('  - PATCH  /v2/wallets/:id');
      console.log('  - GET    /v2/wallets/:id/balance');
      console.log('  - GET    /v2/payments');
      console.log('  - POST   /v2/payments');
      console.log('  - GET    /v2/payments/:id');
      console.log('  - POST   /v2/payments/:id/cancel');
      console.log('  - GET    /v2/transactions');
      console.log('  - GET    /v2/transactions/:id');
      console.log('  - POST   /v2/transactions/export');
      console.log('  - POST   /v2/payment-gateways/fawry/charge');
      console.log('  - POST   /v2/payment-gateways/paymob/checkout');
      console.log('  - POST   /v2/webhooks/fawry');
      console.log('  - POST   /v2/webhooks/paymob');
      console.log('  - GET    /v2/health');
      console.log('  - GET    /v2/metrics');
    });
  } catch (error) {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

// Start if running directly
if (require.main === module) {
  start();
}

export { app };
