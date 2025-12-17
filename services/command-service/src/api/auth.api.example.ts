/**
 * Auth API - Integration Example with Rate Limiting
 * 
 * This example shows how to integrate the rate limiting middleware
 * into your authentication endpoints.
 */

import { Router } from 'express';
import { otpRateLimiter, loginRateLimiter, apiRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

/**
 * Send OTP - Protected with rate limiting
 * Max 3 requests per 5 minutes per phone number
 */
router.post('/auth/send-otp', otpRateLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    if (!phone || !/^(\+20|0)?1[0125]\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Egyptian phone number'
      });
    }

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // TODO: Send OTP via SMS (Cequens integration)
    // await smsService.sendOTP(phone, otp);
    
    // Store OTP in Redis with 5-minute expiry
    // await redis.setex(`otp:${phone}`, 300, otp);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

/**
 * Verify OTP and Login - Protected with rate limiting
 * Max 5 attempts per 15 minutes per phone number
 */
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    // Validate input
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone and OTP are required'
      });
    }

    // Verify OTP
    // const storedOTP = await redis.get(`otp:${phone}`);
    // if (!storedOTP || storedOTP !== otp) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Invalid or expired OTP'
    //   });
    // }

    // Generate JWT tokens
    const accessToken = 'generated-access-token'; // TODO: Use jwt-config
    const refreshToken = 'generated-refresh-token';
    
    // Delete used OTP
    // await redis.del(`otp:${phone}`);
    
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * Register - Protected with general API rate limiting
 * Max 100 requests per minute
 */
router.post('/auth/register', apiRateLimiter, async (req, res) => {
  try {
    const { phone, email, name, nationalId } = req.body;
    
    // TODO: Use validation schemas from @healthpay/validation
    // const validation = validateInput(registrationSchema, req.body);
    // if (!validation.success) {
    //   return res.status(400).json({
    //     success: false,
    //     errors: validation.errors
    //   });
    // }

    // Create user
    // const user = await userService.create(validation.data);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: 'generated-user-id'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * Refresh Token - Protected with general API rate limiting
 */
router.post('/auth/refresh', apiRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // TODO: Verify refresh token using jwt-config
    // const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = 'new-access-token';
    
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 900
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

export default router;
