import { io, Socket } from 'socket.io-client'

export interface WalletUpdate {
  walletId: string
  balance: number
  currency: string
  timestamp: string
}

export interface TransactionNotification {
  txnId: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: string
}

export interface PaymentStatusUpdate {
  paymentId: string
  status: 'pending' | 'completed' | 'failed'
  gatewayResponse?: any
}

type EventCallback<T> = (data: T) => void

export class HealthPayWebSocketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<EventCallback<any>>> = new Map()

  constructor(
    private url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
    private token?: string
  ) {}

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          auth: {
            token: this.token
          },
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling']
        })

        this.socket.on('connect', () => {
          console.log('[WebSocket] Connected successfully')
          this.reconnectAttempts = 0
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('[WebSocket] Connection error:', error)
          this.handleReconnect()
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.warn('[WebSocket] Disconnected:', reason)
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            this.socket?.connect()
          }
        })

        // Setup event listeners
        this.setupEventListeners()

      } catch (error) {
        console.error('[WebSocket] Failed to initialize:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
      console.log('[WebSocket] Disconnected')
    }
  }

  /**
   * Subscribe to wallet balance updates
   */
  onWalletUpdate(walletId: string, callback: EventCallback<WalletUpdate>): () => void {
    const event = `wallet:${walletId}:update`
    this.subscribe(event, callback)
    
    // Join wallet room
    this.socket?.emit('join:wallet', { walletId })

    // Return unsubscribe function
    return () => {
      this.unsubscribe(event, callback)
      this.socket?.emit('leave:wallet', { walletId })
    }
  }

  /**
   * Subscribe to transaction notifications
   */
  onTransaction(walletId: string, callback: EventCallback<TransactionNotification>): () => void {
    const event = `wallet:${walletId}:transaction`
    this.subscribe(event, callback)
    
    this.socket?.emit('join:wallet', { walletId })

    return () => {
      this.unsubscribe(event, callback)
      this.socket?.emit('leave:wallet', { walletId })
    }
  }

  /**
   * Subscribe to payment status updates
   */
  onPaymentStatus(paymentId: string, callback: EventCallback<PaymentStatusUpdate>): () => void {
    const event = `payment:${paymentId}:status`
    this.subscribe(event, callback)

    return () => this.unsubscribe(event, callback)
  }

  /**
   * Subscribe to KYC status updates
   */
  onKYCStatus(userId: string, callback: EventCallback<any>): () => void {
    const event = `user:${userId}:kyc`
    this.subscribe(event, callback)

    return () => this.unsubscribe(event, callback)
  }

  /**
   * Generic subscribe method
   */
  private subscribe<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    this.socket?.on(event, callback)
  }

  /**
   * Generic unsubscribe method
   */
  private unsubscribe<T>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }

    this.socket?.off(event, callback)
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error)
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`)
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after max attempts')
    })
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect()
      }
    }, delay)
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.token = token
    if (this.socket) {
      this.socket.auth = { token }
      this.socket.disconnect().connect()
    }
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: any): void {
    this.socket?.emit(event, data)
  }
}

// Singleton instance
let wsClient: HealthPayWebSocketClient | null = null

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(token?: string): HealthPayWebSocketClient {
  if (!wsClient) {
    wsClient = new HealthPayWebSocketClient(undefined, token)
  } else if (token) {
    wsClient.updateToken(token)
  }
  return wsClient
}

/**
 * React hook for WebSocket connection
 */
export function useWebSocket(token?: string) {
  const client = getWebSocketClient(token)

  React.useEffect(() => {
    if (!client.isConnected()) {
      client.connect().catch(console.error)
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // client.disconnect()
    }
  }, [client])

  return client
}

// For React imports
import * as React from 'react'

export default HealthPayWebSocketClient
