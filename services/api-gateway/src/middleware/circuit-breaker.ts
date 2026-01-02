/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by failing fast when a service is unavailable.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service unavailable, reject requests immediately
 * - HALF_OPEN: Testing if service recovered
 * 
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker(aiValidationService.validate, {
 *   threshold: 5,
 *   timeout: 30000,
 *   resetTime: 60000,
 * });
 * 
 * const result = await breaker.execute(prescriptionData);
 * ```
 */

import { EventEmitter } from 'events';

// ==================== Types ====================

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  threshold: number;
  
  /** Time window for counting failures (ms) */
  timeout: number;
  
  /** How long to wait before testing if service recovered (ms) */
  resetTime: number;
  
  /** Minimum requests in timeout window before evaluating threshold */
  volumeThreshold?: number;
  
  /** Error percentage (0-1) that triggers circuit open */
  errorThresholdPercentage?: number;
  
  /** Function to determine if error should count towards threshold */
  isError?: (error: Error) => boolean;
  
  /** Fallback function when circuit is open */
  fallback?: (...args: any[]) => any;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;  // Rejected due to circuit open
  lastFailure: Date | null;
  lastSuccess: Date | null;
  uptime: number;  // Percentage
}

// ==================== Circuit Breaker ====================

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private requestCount = 0;
  private rejectedCount = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private nextAttempt: number = Date.now();
  private resetTimer: NodeJS.Timeout | null = null;

  // Sliding window for failure tracking
  private recentRequests: Array<{ timestamp: number; success: boolean }> = [];

  constructor(
    private fn: (...args: any[]) => Promise<any>,
    private options: CircuitBreakerOptions
  ) {
    super();

    // Defaults
    this.options = {
      volumeThreshold: 10,
      errorThresholdPercentage: 0.5,
      isError: () => true,
      ...options,
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(...args: any[]): Promise<any> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.rejectedCount++;
        this.emit('rejected', args);
        
        // Use fallback if available
        if (this.options.fallback) {
          return this.options.fallback(...args);
        }
        
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN. Service unavailable. Retry after ${new Date(this.nextAttempt).toISOString()}`
        );
      }
      
      // Transition to HALF_OPEN to test service
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      this.requestCount++;
      
      // Execute function
      const result = await this.fn(...args);
      
      // Success
      this.onSuccess();
      return result;
      
    } catch (error) {
      // Check if this error should count
      if (this.options.isError && !this.options.isError(error as Error)) {
        throw error;
      }
      
      // Failure
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    
    // Add to sliding window
    this.addToWindow(true);
    
    this.emit('success');

    // If in HALF_OPEN, close circuit on success
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.CLOSED);
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    // Add to sliding window
    this.addToWindow(false);
    
    this.emit('failure', error);

    // Open circuit if threshold exceeded
    if (this.shouldOpen()) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Add request to sliding window
   */
  private addToWindow(success: boolean): void {
    const now = Date.now();
    
    // Add current request
    this.recentRequests.push({ timestamp: now, success });
    
    // Remove old requests outside timeout window
    const cutoff = now - this.options.timeout;
    this.recentRequests = this.recentRequests.filter(r => r.timestamp > cutoff);
  }

  /**
   * Check if circuit should open
   */
  private shouldOpen(): boolean {
    // Must have minimum volume of requests
    if (this.recentRequests.length < this.options.volumeThreshold!) {
      return false;
    }

    // Calculate error rate in sliding window
    const failures = this.recentRequests.filter(r => !r.success).length;
    const errorRate = failures / this.recentRequests.length;

    // Check if error rate exceeds threshold
    return errorRate >= this.options.errorThresholdPercentage!;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    this.emit('stateChange', { from: oldState, to: newState });

    console.log(`🔄 Circuit breaker transitioned: ${oldState} → ${newState}`);

    // Handle state-specific logic
    switch (newState) {
      case CircuitState.OPEN:
        // Schedule transition to HALF_OPEN
        this.nextAttempt = Date.now() + this.options.resetTime;
        
        this.resetTimer = setTimeout(() => {
          if (this.state === CircuitState.OPEN) {
            this.transitionTo(CircuitState.HALF_OPEN);
          }
        }, this.options.resetTime);
        
        this.emit('open');
        break;

      case CircuitState.HALF_OPEN:
        this.emit('halfOpen');
        break;

      case CircuitState.CLOSED:
        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
          this.resetTimer = null;
        }
        this.emit('close');
        break;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats(): CircuitBreakerStats {
    const total = this.requestCount;
    const successful = this.successCount;
    const failed = this.failureCount;
    const uptime = total > 0 ? (successful / total) * 100 : 100;

    return {
      state: this.state,
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      rejectedRequests: this.rejectedCount,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      uptime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.rejectedCount = 0;
    this.recentRequests = [];
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Force circuit open
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Force circuit closed
   */
  forceClosed(): void {
    this.transitionTo(CircuitState.CLOSED);
  }
}

// ==================== Custom Error ====================

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

// ==================== Circuit Breaker Manager ====================

/**
 * Manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Create or get circuit breaker for a service
   */
  getBreaker(
    name: string,
    fn: (...args: any[]) => Promise<any>,
    options?: CircuitBreakerOptions
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultOptions: CircuitBreakerOptions = {
        threshold: 5,
        timeout: 30000,
        resetTime: 60000,
        volumeThreshold: 10,
        errorThresholdPercentage: 0.5,
      };

      const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });
      
      // Log events
      breaker.on('stateChange', ({ from, to }) => {
        console.log(`[${name}] Circuit breaker: ${from} → ${to}`);
      });

      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// ==================== Example Usage ====================

/**
 * Example: AI Validation Service with Circuit Breaker
 */
export async function exampleUsage() {
  // Mock AI service (fails 50% of the time)
  const aiValidationService = {
    validate: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (Math.random() < 0.5) {
        throw new Error('AI service unavailable');
      }
      
      return { valid: true, confidence: 0.95 };
    },
  };

  // Create circuit breaker
  const breaker = new CircuitBreaker(aiValidationService.validate, {
    threshold: 3,        // Open after 3 failures
    timeout: 10000,      // In 10 second window
    resetTime: 30000,    // Try again after 30 seconds
    volumeThreshold: 5,  // Need at least 5 requests to evaluate
    errorThresholdPercentage: 0.5,  // 50% error rate triggers open
    
    // Fallback function when circuit is open
    fallback: (data: any) => {
      console.log('⚠️  Using fallback: returning cached result');
      return { valid: true, confidence: 0.8, cached: true };
    },
  });

  // Listen to events
  breaker.on('open', () => console.log('❌ Circuit OPENED'));
  breaker.on('close', () => console.log('✅ Circuit CLOSED'));
  breaker.on('halfOpen', () => console.log('🔄 Circuit HALF-OPEN (testing)'));

  // Make requests
  for (let i = 0; i < 20; i++) {
    try {
      const result = await breaker.execute({ prescriptionId: i });
      console.log(`✅ Request ${i}: Success`);
    } catch (error: any) {
      console.log(`❌ Request ${i}: ${error.message}`);
    }
    
    // Stats
    const stats = breaker.getStats();
    console.log(`📊 State: ${stats.state}, Success: ${stats.successfulRequests}/${stats.totalRequests}, Uptime: ${stats.uptime.toFixed(1)}%`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// ==================== Integration Example ====================

/**
 * Example: Using circuit breaker in Express middleware
 */
export function createCircuitBreakerMiddleware(breaker: CircuitBreaker) {
  return async (req: any, res: any, next: any) => {
    try {
      // Execute request through circuit breaker
      req.circuitBreaker = breaker;
      next();
    } catch (error: any) {
      if (error instanceof CircuitBreakerOpenError) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable. Please try again later.',
            retryAfter: Math.ceil((breaker as any).nextAttempt - Date.now()) / 1000,
          },
        });
      }
      next(error);
    }
  };
}

/**
 * Example: Service client with circuit breaker
 */
export class ResilientServiceClient {
  private manager = new CircuitBreakerManager();

  /**
   * Call AI validation service with circuit breaker
   */
  async validatePrescription(data: any): Promise<any> {
    const breaker = this.manager.getBreaker(
      'ai-validation',
      async (data: any) => {
        // Actual HTTP call to AI service
        const response = await fetch('http://ai-service/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(5000),  // 5s timeout
        });

        if (!response.ok) {
          throw new Error(`AI service error: ${response.status}`);
        }

        return response.json();
      },
      {
        threshold: 5,
        timeout: 30000,
        resetTime: 60000,
        fallback: (data) => ({
          valid: true,
          confidence: 0.0,
          message: 'Bypassed validation due to service unavailability',
        }),
      }
    );

    return breaker.execute(data);
  }

  /**
   * Call payment gateway with circuit breaker
   */
  async processPayment(data: any): Promise<any> {
    const breaker = this.manager.getBreaker(
      'fawry-gateway',
      async (data: any) => {
        // Actual call to Fawry
        const response = await fetch('https://api.fawry.com/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FAWRY_API_KEY}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Fawry error: ${response.status}`);
        }

        return response.json();
      },
      {
        threshold: 3,
        timeout: 60000,
        resetTime: 120000,  // 2 minutes
        // No fallback for payments - must fail explicitly
      }
    );

    return breaker.execute(data);
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, CircuitBreakerStats> {
    return this.manager.getAllStats();
  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
