// ✅ FIXED: Comprehensive Rate Limiting for Auth Endpoints
// Location: services/command-service/src/middleware/rate-limit.middleware.ts

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { Redis } from 'ioredis'

interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
}

// Redis client for distributed rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 2 // Separate DB for rate limiting
})

redis.on('error', (err) => {
  console.error('Rate limit Redis error:', err)
})

// ✅ OTP Rate Limiter - Very Strict
export const otpRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes per phone
  message: {
    error: 'Too many OTP requests. Please try again after 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:otp:',
  }),
  keyGenerator: (req) => {
    // Rate limit per phone number
    const phone = req.body.phone || req.ip
    return `phone:${phone}`
  },
  handler: (req, res) => {
    console.warn('Rate limit exceeded for OTP:', {
      phone: req.body.phone,
      ip: req.ip,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      error: 'Too many OTP requests',
      message: 'You have exceeded the maximum number of OTP requests. Please try again after 5 minutes.',
      retryAfter: 300 // seconds
    })
  }
})

// ✅ Login Rate Limiter - Moderate
export const loginRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:login:',
  }),
  keyGenerator: (req) => {
    // Rate limit per phone + IP combination
    const phone = req.body.phone || ''
    return `login:${phone}:${req.ip}`
  },
  handler: (req, res) => {
    console.warn('Rate limit exceeded for login:', {
      phone: req.body.phone,
      ip: req.ip,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.',
      retryAfter: 900 // seconds
    })
  }
})

// ✅ Registration Rate Limiter - Moderate
export const registrationRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: 'Too many registration attempts. Please try again after 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:register:',
  }),
  keyGenerator: (req) => {
    return `register:${req.ip}`
  },
  handler: (req, res) => {
    console.warn('Rate limit exceeded for registration:', {
      ip: req.ip,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'You have exceeded the maximum number of registration attempts. Please try again after 1 hour.',
      retryAfter: 3600 // seconds
    })
  }
})

// ✅ Password Reset Rate Limiter - Strict
export const passwordResetRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests. Please try again after 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:password:',
  }),
  keyGenerator: (req) => {
    const email = req.body.email || req.body.phone || req.ip
    return `password:${email}`
  }
})

// ✅ General API Rate Limiter - Lenient
export const apiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  keyGenerator: (req) => {
    // Rate limit per user or IP
    const userId = (req as any).user?.id || req.ip
    return `api:${userId}`
  }
})

// ✅ Webhook Rate Limiter - Very Lenient
export const webhookRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Webhook rate limit exceeded',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:webhook:',
  }),
  keyGenerator: (req) => {
    const merchantId = (req as any).merchant?.id || req.ip
    return `webhook:${merchantId}`
  }
})

// Cleanup function for graceful shutdown
export async function closeRateLimitStore(): Promise<void> {
  await redis.quit()
}
