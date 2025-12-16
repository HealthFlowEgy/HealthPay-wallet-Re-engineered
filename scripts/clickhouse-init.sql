-- ============================================================================
-- HealthPay Ledger V2 - ClickHouse Initialization
-- Purpose: Real-time analytics and OLAP queries
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS healthpay_analytics;

USE healthpay_analytics;

-- ============================================================================
-- WALLET EVENTS TABLE (Main events table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_events (
    event_id String,
    event_type LowCardinality(String),
    event_version Int8,
    
    -- Aggregate info
    aggregate_id String,
    aggregate_type LowCardinality(String),
    aggregate_version UInt64,
    
    -- Wallet info
    wallet_id String,
    merchant_id String,
    user_id String,
    
    -- Transaction details
    amount Int64,
    balance_before Int64,
    balance_after Int64,
    currency LowCardinality(String),
    direction LowCardinality(String), -- 'credit' or 'debit'
    
    -- Metadata
    source LowCardinality(String),
    description String,
    metadata String, -- JSON as string
    
    -- Correlation
    correlation_id String,
    causation_id String,
    
    -- Network
    ip_address IPv4,
    user_agent String,
    
    -- Timestamps
    event_time DateTime64(3, 'Africa/Cairo'),
    ingested_at DateTime64(3, 'Africa/Cairo') DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (merchant_id, wallet_id, event_time)
TTL event_time + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- ============================================================================
-- HOURLY VOLUME MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_volume_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (merchant_id, hour)
AS SELECT
    merchant_id,
    toStartOfHour(event_time) as hour,
    
    -- Credit metrics
    countIf(direction = 'credit') as credit_count,
    sumIf(amount, direction = 'credit') as credit_volume,
    
    -- Debit metrics
    countIf(direction = 'debit') as debit_count,
    sumIf(amount, direction = 'debit') as debit_volume,
    
    -- Net
    credit_volume - debit_volume as net_volume,
    
    -- Unique users
    uniqExact(user_id) as unique_users
FROM wallet_events
GROUP BY merchant_id, hour;

-- ============================================================================
-- DAILY METRICS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (merchant_id, day)
AS SELECT
    merchant_id,
    toDate(event_time) as day,
    
    -- Transaction counts
    count() as total_transactions,
    countIf(direction = 'credit') as credit_transactions,
    countIf(direction = 'debit') as debit_transactions,
    
    -- Volumes
    sumIf(amount, direction = 'credit') as total_credits,
    sumIf(amount, direction = 'debit') as total_debits,
    
    -- Averages
    avgIf(amount, direction = 'credit') as avg_credit_amount,
    avgIf(amount, direction = 'debit') as avg_debit_amount,
    
    -- Unique metrics
    uniqExact(user_id) as unique_users,
    uniqExact(wallet_id) as unique_wallets,
    
    -- Peak hour
    topK(1)(toHour(event_time))[1] as peak_hour
FROM wallet_events
GROUP BY merchant_id, day;

-- ============================================================================
-- FRAUD DETECTION SIGNALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_signals (
    signal_id String,
    wallet_id String,
    user_id String,
    merchant_id String,
    
    -- Signal details
    signal_type LowCardinality(String), -- 'velocity', 'unusual_amount', 'geolocation', etc.
    severity LowCardinality(String), -- 'low', 'medium', 'high', 'critical'
    score Float32,
    
    -- Details
    description String,
    details String, -- JSON
    
    -- Time window
    window_start DateTime64(3, 'Africa/Cairo'),
    window_end DateTime64(3, 'Africa/Cairo'),
    detected_at DateTime64(3, 'Africa/Cairo') DEFAULT now64(3),
    
    -- Status
    status LowCardinality(String), -- 'new', 'investigating', 'confirmed', 'false_positive', 'resolved'
    reviewed_by String,
    reviewed_at Nullable(DateTime64(3, 'Africa/Cairo'))
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(detected_at)
ORDER BY (merchant_id, wallet_id, detected_at)
TTL detected_at + INTERVAL 1 YEAR;

-- ============================================================================
-- USER ACTIVITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity (
    user_id String,
    merchant_id String,
    wallet_id String,
    
    -- Activity type
    activity_type LowCardinality(String), -- 'login', 'transaction', 'topup', 'request_payment', etc.
    
    -- Details
    details String, -- JSON
    
    -- Network
    ip_address IPv4,
    user_agent String,
    device_type LowCardinality(String), -- 'mobile', 'desktop', 'tablet'
    
    -- Location (if available)
    country LowCardinality(String),
    city String,
    
    -- Timestamp
    activity_time DateTime64(3, 'Africa/Cairo'),
    session_id String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(activity_time)
ORDER BY (user_id, activity_time)
TTL activity_time + INTERVAL 6 MONTH;

-- ============================================================================
-- TOP USERS BY VOLUME MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS top_users_mv
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (merchant_id, day)
AS SELECT
    merchant_id,
    toDate(event_time) as day,
    user_id,
    
    -- Metrics
    count() as transaction_count,
    sum(amount) as total_volume,
    avg(amount) as avg_transaction_amount,
    
    -- State for top-K
    groupArray(10)(amount) as top_amounts
FROM wallet_events
GROUP BY merchant_id, day, user_id;

-- ============================================================================
-- TRANSACTION TYPE DISTRIBUTION
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS transaction_types_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (merchant_id, day, source)
AS SELECT
    merchant_id,
    toDate(event_time) as day,
    source,
    
    -- Counts
    count() as transaction_count,
    sum(amount) as total_volume,
    
    -- Direction breakdown
    countIf(direction = 'credit') as credit_count,
    countIf(direction = 'debit') as debit_count
FROM wallet_events
GROUP BY merchant_id, day, source;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert test event
INSERT INTO wallet_events (
    event_id, event_type, event_version,
    aggregate_id, aggregate_type, aggregate_version,
    wallet_id, merchant_id, user_id,
    amount, balance_before, balance_after,
    currency, direction,
    source, description,
    event_time
) VALUES (
    'evt_test_001', 'wallet.created.v1', 1,
    'wallet_test_merchant', 'Wallet', 1,
    'wallet_test_merchant', 'merchant_test123', 'user_merchant',
    0, 0, 0,
    'EGP', 'credit',
    'system', 'Test wallet creation',
    now64(3)
);

-- ============================================================================
-- UTILITY QUERIES (for reference)
-- ============================================================================

-- Example: Get hourly volume for a merchant
-- SELECT hour, credit_volume, debit_volume, net_volume
-- FROM hourly_volume_mv
-- WHERE merchant_id = 'merchant_test123'
-- AND hour >= now() - INTERVAL 24 HOUR
-- ORDER BY hour DESC;

-- Example: Detect high-velocity transactions (fraud signal)
-- SELECT wallet_id, count() as tx_count, sum(amount) as total_amount
-- FROM wallet_events
-- WHERE event_time >= now() - INTERVAL 5 MINUTE
-- GROUP BY wallet_id
-- HAVING tx_count > 10 OR total_amount > 10000000
-- ORDER BY tx_count DESC;

-- Example: Top users by volume (today)
-- SELECT user_id, sum(amount) as total_volume, count() as tx_count
-- FROM wallet_events
-- WHERE toDate(event_time) = today()
-- AND merchant_id = 'merchant_test123'
-- GROUP BY user_id
-- ORDER BY total_volume DESC
-- LIMIT 10;
