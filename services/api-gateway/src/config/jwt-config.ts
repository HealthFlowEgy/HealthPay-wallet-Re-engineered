// ✅ FIXED: Proper JWT Secret Configuration
// Location: services/api-gateway/src/config/jwt.config.ts

import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

interface JWTConfig {
  secret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
  issuer: string
  audience: string
}

function validateJWTSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable is required. ' +
      'Generate a secure secret with: openssl rand -base64 64'
    )
  }

  if (secret.length < 32) {
    throw new Error(
      'CRITICAL: JWT_SECRET must be at least 32 characters long for security. ' +
      'Current length: ' + secret.length
    )
  }

  // Check for common weak secrets
  const weakSecrets = [
    'your-secret-key',
    'secret',
    'password',
    'healthpay',
    '123456'
  ]
  
  const lowerSecret = secret.toLowerCase()
  if (weakSecrets.some(weak => lowerSecret.includes(weak))) {
    throw new Error(
      'CRITICAL: JWT_SECRET appears to be a weak or default value. ' +
      'Use a cryptographically secure random string.'
    )
  }

  return secret
}

function validateEnvironment(): void {
  const required = [
    'JWT_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'NODE_ENV'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `CRITICAL: Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

export function getJWTConfig(): JWTConfig {
  // Validate environment first
  validateEnvironment()

  const secret = validateJWTSecret(process.env.JWT_SECRET)

  return {
    secret,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER!,
    audience: process.env.JWT_AUDIENCE!
  }
}

// Export singleton config
let jwtConfig: JWTConfig | null = null

export function initializeJWTConfig(): JWTConfig {
  if (!jwtConfig) {
    jwtConfig = getJWTConfig()
    
    // Log configuration (without exposing secret)
    console.log('✅ JWT Configuration initialized:', {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      accessTokenExpiry: jwtConfig.accessTokenExpiry,
      refreshTokenExpiry: jwtConfig.refreshTokenExpiry,
      secretLength: jwtConfig.secret.length,
      environment: process.env.NODE_ENV
    })
  }
  
  return jwtConfig
}

// Usage in gateway.ts
export function getJWT(): JWTConfig {
  if (!jwtConfig) {
    throw new Error('JWT configuration not initialized. Call initializeJWTConfig() first.')
  }
  return jwtConfig
}
