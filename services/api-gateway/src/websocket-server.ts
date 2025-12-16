/**
 * WebSocket Server for Real-time Updates
 * 
 * Features:
 * - Real-time balance updates
 * - Transaction notifications
 * - Payment status updates
 * - JWT authentication
 * - Room-based subscriptions (wallet-specific channels)
 * - Automatic reconnection handling
 * - Heartbeat/ping-pong for connection health
 */

import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { Kafka, Consumer } from 'kafkajs';

// ==================== Configuration ====================

interface WebSocketServerConfig {
  port: number;
  jwtSecret: string;
  redis: {
    host: string;
    port: number;
  };
  kafka: {
    brokers: string[];
    groupId: string;
  };
  heartbeat: {
    interval: number;  // ms
    timeout: number;   // ms
  };
}

const config: WebSocketServerConfig = {
  port: parseInt(process.env.WS_PORT || '8080'),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:19092').split(','),
    groupId: 'websocket-server-cg',
  },
  heartbeat: {
    interval: 30000,  // 30s
    timeout: 60000,   // 60s
  },
};

// ==================== Types ====================

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  subscriptions: Set<string>;
  isAlive: boolean;
  lastPing: number;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  channel?: string;
  data?: any;
}

interface BalanceUpdate {
  walletId: string;
  balance: number;
  currency: string;
  timestamp: string;
}

interface TransactionNotification {
  walletId: string;
  transactionId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
}

interface PaymentUpdate {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  timestamp: string;
}

// ==================== WebSocket Server Class ====================

class HealthPayWebSocketServer {
  private wss: WebSocketServer;
  private server: http.Server;
  private redis: Redis;
  private redisSubscriber: Redis;
  private kafka: Kafka;
  private kafkaConsumer: Consumer;
  
  // Map: userId -> Set<WebSocket>
  private userConnections: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  
  // Map: channel -> Set<userId>
  private channelSubscriptions: Map<string, Set<string>> = new Map();

  constructor(private config: WebSocketServerConfig) {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });
    
    // Initialize Redis
    this.redis = new Redis(config.redis);
    this.redisSubscriber = new Redis(config.redis);
    
    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: 'healthpay-websocket',
      brokers: config.kafka.brokers,
    });
    this.kafkaConsumer = this.kafka.consumer({ 
      groupId: config.kafka.groupId 
    });
  }

  /**
   * Start WebSocket server
   */
  async start(): Promise<void> {
    console.log('🚀 Starting HealthPay WebSocket Server...');

    // Setup WebSocket connection handler
    this.wss.on('connection', this.handleConnection.bind(this));

    // Start Kafka consumer for events
    await this.startKafkaConsumer();

    // Start Redis subscriber for pub/sub
    await this.startRedisSubscriber();

    // Start heartbeat mechanism
    this.startHeartbeat();

    // Start HTTP server
    await promisify(this.server.listen.bind(this.server))(this.config.port);
    
    console.log(`✅ WebSocket server listening on port ${this.config.port}`);
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: http.IncomingMessage): Promise<void> {
    console.log('🔌 New WebSocket connection');

    try {
      // Extract token from query string or headers
      const token = this.extractToken(request);
      
      if (!token) {
        ws.close(4001, 'Missing authentication token');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.config.jwtSecret) as { userId: string };
      
      // Cast to authenticated socket
      const authWs = ws as AuthenticatedWebSocket;
      authWs.userId = decoded.userId;
      authWs.subscriptions = new Set();
      authWs.isAlive = true;
      authWs.lastPing = Date.now();

      // Store connection
      this.addUserConnection(authWs);

      // Setup event handlers
      authWs.on('message', (data: WebSocket.RawData) => {
        this.handleMessage(authWs, data);
      });

      authWs.on('pong', () => {
        authWs.isAlive = true;
        authWs.lastPing = Date.now();
      });

      authWs.on('close', () => {
        this.handleDisconnect(authWs);
      });

      authWs.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(authWs);
      });

      // Send welcome message
      this.sendMessage(authWs, {
        type: 'connected',
        userId: authWs.userId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Authentication failed:', error);
      ws.close(4001, 'Authentication failed');
    }
  }

  /**
   * Extract JWT token from request
   */
  private extractToken(request: http.IncomingMessage): string | null {
    // Try query string: ws://host?token=xxx
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const queryToken = url.searchParams.get('token');
    if (queryToken) return queryToken;

    // Try Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: WebSocket.RawData): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, message.channel!);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.channel!);
          break;
        
        case 'ping':
          this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        
        default:
          this.sendMessage(ws, { 
            type: 'error', 
            message: 'Unknown message type' 
          });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendMessage(ws, { 
        type: 'error', 
        message: 'Invalid message format' 
      });
    }
  }

  /**
   * Subscribe to channel
   * 
   * Channels:
   * - wallet:{walletId} - Balance & transaction updates for specific wallet
   * - user:{userId} - All updates for user
   * - payment:{paymentId} - Payment status updates
   */
  private handleSubscribe(ws: AuthenticatedWebSocket, channel: string): void {
    // Validate channel access
    if (!this.canAccessChannel(ws.userId, channel)) {
      this.sendMessage(ws, { 
        type: 'error', 
        message: 'Not authorized to subscribe to this channel' 
      });
      return;
    }

    // Add subscription
    ws.subscriptions.add(channel);
    
    // Track channel subscription
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)!.add(ws.userId);

    console.log(`✅ User ${ws.userId} subscribed to ${channel}`);

    this.sendMessage(ws, {
      type: 'subscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from channel
   */
  private handleUnsubscribe(ws: AuthenticatedWebSocket, channel: string): void {
    ws.subscriptions.delete(channel);
    
    const subscribers = this.channelSubscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(ws.userId);
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }

    this.sendMessage(ws, {
      type: 'unsubscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if user can access channel
   */
  private canAccessChannel(userId: string, channel: string): boolean {
    // User can always access their own channel
    if (channel === `user:${userId}`) return true;

    // For wallet channels, verify ownership (would check DB in production)
    if (channel.startsWith('wallet:')) {
      // TODO: Query database to verify wallet ownership
      return true;  // Simplified for now
    }

    // For payment channels, verify participation
    if (channel.startsWith('payment:')) {
      // TODO: Query database to verify payment participation
      return true;  // Simplified for now
    }

    return false;
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: AuthenticatedWebSocket): void {
    console.log(`🔌 User ${ws.userId} disconnected`);

    // Remove all subscriptions
    for (const channel of ws.subscriptions) {
      const subscribers = this.channelSubscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(ws.userId);
        if (subscribers.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    }

    // Remove connection
    this.removeUserConnection(ws);
  }

  /**
   * Start Kafka consumer for event streaming
   */
  private async startKafkaConsumer(): Promise<void> {
    await this.kafkaConsumer.connect();
    
    await this.kafkaConsumer.subscribe({ 
      topics: [
        'healthpay.events.wallet',
        'healthpay.events.payment',
        'healthpay.events.medcard',
      ],
      fromBeginning: false,
    });

    await this.kafkaConsumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const event = JSON.parse(message.value!.toString());
          await this.handleEvent(event);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });

    console.log('✅ Kafka consumer started');
  }

  /**
   * Handle domain event from Kafka
   */
  private async handleEvent(event: any): Promise<void> {
    const { eventType, aggregateId, data } = event;

    switch (eventType) {
      case 'WalletCredited':
      case 'WalletDebited':
        await this.broadcastBalanceUpdate(aggregateId, data);
        break;
      
      case 'PaymentCompleted':
      case 'PaymentFailed':
        await this.broadcastPaymentUpdate(data);
        break;
      
      case 'TransactionRecorded':
        await this.broadcastTransactionNotification(data);
        break;
    }
  }

  /**
   * Broadcast balance update to wallet subscribers
   */
  private async broadcastBalanceUpdate(walletId: string, data: any): Promise<void> {
    const update: BalanceUpdate = {
      walletId,
      balance: data.newBalance,
      currency: data.currency,
      timestamp: new Date().toISOString(),
    };

    // Publish to Redis for other WebSocket server instances (if clustered)
    await this.redis.publish(
      `balance:${walletId}`,
      JSON.stringify(update)
    );

    // Broadcast to local connections
    this.broadcastToChannel(`wallet:${walletId}`, {
      type: 'balance_update',
      data: update,
    });
  }

  /**
   * Broadcast payment status update
   */
  private async broadcastPaymentUpdate(data: any): Promise<void> {
    const update: PaymentUpdate = {
      paymentId: data.paymentId,
      status: data.status,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to payment channel
    this.broadcastToChannel(`payment:${data.paymentId}`, {
      type: 'payment_update',
      data: update,
    });

    // Also broadcast to affected wallets
    this.broadcastToChannel(`wallet:${data.fromWalletId}`, {
      type: 'payment_update',
      data: update,
    });

    if (data.toWalletId) {
      this.broadcastToChannel(`wallet:${data.toWalletId}`, {
        type: 'payment_update',
        data: update,
      });
    }
  }

  /**
   * Broadcast transaction notification
   */
  private async broadcastTransactionNotification(data: any): Promise<void> {
    const notification: TransactionNotification = {
      walletId: data.walletId,
      transactionId: data.transactionId,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`wallet:${data.walletId}`, {
      type: 'transaction',
      data: notification,
    });
  }

  /**
   * Start Redis subscriber for pub/sub
   * Allows multiple WebSocket server instances to communicate
   */
  private async startRedisSubscriber(): Promise<void> {
    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        // Extract channel pattern
        if (channel.startsWith('balance:')) {
          const walletId = channel.replace('balance:', '');
          this.broadcastToChannel(`wallet:${walletId}`, {
            type: 'balance_update',
            data,
          });
        }
      } catch (error) {
        console.error('Error handling Redis message:', error);
      }
    });

    await this.redisSubscriber.psubscribe('balance:*');
    
    console.log('✅ Redis subscriber started');
  }

  /**
   * Broadcast message to all subscribers of a channel
   */
  private broadcastToChannel(channel: string, message: any): void {
    const subscribers = this.channelSubscriptions.get(channel);
    if (!subscribers) return;

    for (const userId of subscribers) {
      this.sendToUser(userId, message);
    }
  }

  /**
   * Send message to all connections of a user
   */
  private sendToUser(userId: string, message: any): void {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    }
  }

  /**
   * Send message to specific WebSocket
   */
  private sendMessage(ws: WebSocket, message: any): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Add user connection
   */
  private addUserConnection(ws: AuthenticatedWebSocket): void {
    if (!this.userConnections.has(ws.userId)) {
      this.userConnections.set(ws.userId, new Set());
    }
    this.userConnections.get(ws.userId)!.add(ws);
  }

  /**
   * Remove user connection
   */
  private removeUserConnection(ws: AuthenticatedWebSocket): void {
    const connections = this.userConnections.get(ws.userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(ws.userId);
      }
    }
  }

  /**
   * Heartbeat mechanism to detect dead connections
   */
  private startHeartbeat(): void {
    const interval = setInterval(() => {
      const now = Date.now();
      
      this.wss.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        
        // Check if connection is stale
        if (!authWs.isAlive || (now - authWs.lastPing > this.config.heartbeat.timeout)) {
          console.log(`💀 Terminating stale connection for user ${authWs.userId}`);
          this.handleDisconnect(authWs);
          return ws.terminate();
        }

        // Send ping
        authWs.isAlive = false;
        ws.ping();
      });
    }, this.config.heartbeat.interval);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Get server stats
   */
  getStats(): {
    connections: number;
    users: number;
    channels: number;
  } {
    return {
      connections: this.wss.clients.size,
      users: this.userConnections.size,
      channels: this.channelSubscriptions.size,
    };
  }

  /**
   * Shutdown server gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WebSocket server...');

    // Close all WebSocket connections
    this.wss.clients.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

    // Disconnect Kafka consumer
    await this.kafkaConsumer.disconnect();

    // Close Redis connections
    this.redis.disconnect();
    this.redisSubscriber.disconnect();

    // Close HTTP server
    await promisify(this.server.close.bind(this.server))();

    console.log('✅ WebSocket server shut down');
  }
}

// ==================== Main ====================

async function main() {
  const server = new HealthPayWebSocketServer(config);

  // Handle shutdown signals
  const shutdown = async () => {
    await server.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start server
  await server.start();

  // Log stats every 30 seconds
  setInterval(() => {
    const stats = server.getStats();
    console.log(`📊 Stats: ${stats.connections} connections, ${stats.users} users, ${stats.channels} channels`);
  }, 30000);
}

if (require.main === module) {
  main().catch(console.error);
}

export { HealthPayWebSocketServer };
