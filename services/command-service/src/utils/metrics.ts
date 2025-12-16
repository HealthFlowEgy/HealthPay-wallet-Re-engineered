/**
 * Prometheus Metrics
 */

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export class Metrics {
  public readonly registry: Registry;

  // Counters
  public readonly commandsTotal: Counter;
  public readonly commandsSuccessTotal: Counter;
  public readonly commandsFailedTotal: Counter;
  public readonly eventsPublishedTotal: Counter;

  // Histograms
  public readonly commandDuration: Histogram;
  public readonly eventPublishDuration: Histogram;

  // Gauges
  public readonly activeCommands: Gauge;
  public readonly walletBalance: Gauge;

  constructor() {
    this.registry = new Registry();

    // Commands total
    this.commandsTotal = new Counter({
      name: 'healthpay_commands_total',
      help: 'Total number of commands processed',
      labelNames: ['command_type'],
      registers: [this.registry]
    });

    // Commands success
    this.commandsSuccessTotal = new Counter({
      name: 'healthpay_commands_success_total',
      help: 'Total number of successful commands',
      labelNames: ['command_type'],
      registers: [this.registry]
    });

    // Commands failed
    this.commandsFailedTotal = new Counter({
      name: 'healthpay_commands_failed_total',
      help: 'Total number of failed commands',
      labelNames: ['command_type', 'error_code'],
      registers: [this.registry]
    });

    // Events published
    this.eventsPublishedTotal = new Counter({
      name: 'healthpay_events_published_total',
      help: 'Total number of events published',
      labelNames: ['event_type'],
      registers: [this.registry]
    });

    // Command duration
    this.commandDuration = new Histogram({
      name: 'healthpay_command_duration_seconds',
      help: 'Command processing duration in seconds',
      labelNames: ['command_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    // Event publish duration
    this.eventPublishDuration = new Histogram({
      name: 'healthpay_event_publish_duration_seconds',
      help: 'Event publishing duration in seconds',
      labelNames: ['event_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    // Active commands
    this.activeCommands = new Gauge({
      name: 'healthpay_active_commands',
      help: 'Number of commands currently being processed',
      registers: [this.registry]
    });

    // Wallet balance (for monitoring)
    this.walletBalance = new Gauge({
      name: 'healthpay_wallet_balance',
      help: 'Current wallet balance',
      labelNames: ['wallet_id', 'currency'],
      registers: [this.registry]
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Record command execution
   */
  recordCommand(commandType: string, success: boolean, durationMs: number, errorCode?: string) {
    this.commandsTotal.inc({ command_type: commandType });
    
    if (success) {
      this.commandsSuccessTotal.inc({ command_type: commandType });
    } else {
      this.commandsFailedTotal.inc({
        command_type: commandType,
        error_code: errorCode || 'UNKNOWN'
      });
    }

    this.commandDuration.observe(
      { command_type: commandType },
      durationMs / 1000
    );
  }

  /**
   * Record event publish
   */
  recordEventPublish(eventType: string, durationMs: number) {
    this.eventsPublishedTotal.inc({ event_type: eventType });
    this.eventPublishDuration.observe(
      { event_type: eventType },
      durationMs / 1000
    );
  }

  /**
   * Update wallet balance metric
   */
  updateWalletBalance(walletId: string, currency: string, balance: number) {
    this.walletBalance.set(
      { wallet_id: walletId, currency },
      balance
    );
  }
}

// Singleton instance
export const metrics = new Metrics();
