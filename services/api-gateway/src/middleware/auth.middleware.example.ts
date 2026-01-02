/**
 * Auth Middleware - Integration Example with JWT Config
 * 
 * This example shows how to use the JWT configuration
 * to validate tokens in the API Gateway.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateJWTConfig } from '../config/jwt-config';

// Validate JWT configuration at startup
validateJWTConfig();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ISSUER = process.env.JWT_ISSUER || 'healthpay-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'healthpay-clients';

interface JWTPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Middleware to verify JWT access tokens
 */
export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as JWTPayload;

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId: string, phone: string, role: string = 'user'): string {
  const expiresIn = process.env.JWT_ACCESS_EXPIRY || '15m';
  
  return jwt.sign(
    {
      userId,
      phone,
      role
    },
    JWT_SECRET,
    {
      expiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256'
    }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d';
  
  return jwt.sign(
    {
      userId,
      type: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256'
    }
  );
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as any;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Middleware to check user role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phone: string;
        role: string;
      };
    }
  }
}
