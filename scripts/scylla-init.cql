-- ============================================================================
-- HealthPay Ledger V2 - ScyllaDB Initialization
-- Purpose: Fast balance queries and wallet lookups
-- ============================================================================

-- Create keyspace with replication
CREATE KEYSPACE IF NOT EXISTS healthpay_balances 
WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'replication_factor': 1
} AND durable_writes = true;

USE healthpay_balances;

-- ============================================================================
-- WALLET BALANCES TABLE
-- Purpose: Sub-millisecond balance queries
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
    wallet_id TEXT PRIMARY KEY,
    merchant_id TEXT,
    user_id TEXT,
    
    -- Balance
    balance BIGINT,
    currency TEXT,
    
    -- Status
    status TEXT, -- 'pending', 'active', 'suspended', 'closed'
    
    -- User info (denormalized for quick access)
    user_mobile TEXT,
    user_email TEXT,
    user_name TEXT,
    
    -- Audit
    version BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_transaction_at TIMESTAMP
) WITH 
    comment = 'Fast balance lookups by wallet_id'
    AND gc_grace_seconds = 86400
    AND compaction = {
        'class': 'LeveledCompactionStrategy',
        'sstable_size_in_mb': 160
    };

-- ============================================================================
-- MERCHANT WALLETS TABLE
-- Purpose: List all wallets for a merchant
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_wallets (
    merchant_id TEXT,
    wallet_id TEXT,
    user_id TEXT,
    user_mobile TEXT,
    balance BIGINT,
    status TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (merchant_id, wallet_id)
) WITH CLUSTERING ORDER BY (wallet_id ASC)
    AND comment = 'List wallets by merchant'
    AND gc_grace_seconds = 86400;

-- ============================================================================
-- USER WALLETS TABLE
-- Purpose: Find wallet by user_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wallets (
    user_id TEXT,
    merchant_id TEXT,
    wallet_id TEXT,
    balance BIGINT,
    status TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, merchant_id)
) WITH comment = 'Find wallet by user_id and merchant_id'
    AND gc_grace_seconds = 86400;

-- ============================================================================
-- WALLET VERSIONS TABLE
-- Purpose: Track version for optimistic locking
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_versions (
    wallet_id TEXT PRIMARY KEY,
    version BIGINT,
    last_event_id TEXT,
    updated_at TIMESTAMP
) WITH comment = 'Version tracking for optimistic locking';

-- ============================================================================
-- BALANCE SNAPSHOTS TABLE
-- Purpose: Periodic balance snapshots for fast event replay
-- ============================================================================

CREATE TABLE IF NOT EXISTS balance_snapshots (
    wallet_id TEXT,
    snapshot_at TIMESTAMP,
    balance BIGINT,
    version BIGINT,
    last_event_id TEXT,
    PRIMARY KEY (wallet_id, snapshot_at)
) WITH CLUSTERING ORDER BY (snapshot_at DESC)
    AND comment = 'Balance snapshots for fast event replay'
    AND default_time_to_live = 7776000; -- 90 days

-- ============================================================================
-- RECENT TRANSACTIONS CACHE
-- Purpose: Cache last 10 transactions per wallet
-- ============================================================================

CREATE TABLE IF NOT EXISTS recent_transactions_cache (
    wallet_id TEXT,
    transaction_time TIMESTAMP,
    transaction_id UUID,
    amount BIGINT,
    direction TEXT,
    balance_after BIGINT,
    merchant_id TEXT,
    description TEXT,
    PRIMARY KEY (wallet_id, transaction_time, transaction_id)
) WITH CLUSTERING ORDER BY (transaction_time DESC, transaction_id DESC)
    AND comment = 'Last 10 transactions per wallet'
    AND default_time_to_live = 2592000; -- 30 days

-- ============================================================================
-- SECONDARY INDEXES (Use sparingly in ScyllaDB)
-- ============================================================================

-- Allow queries by user_mobile (for login)
CREATE INDEX IF NOT EXISTS idx_wallet_user_mobile 
ON wallet_balances (user_mobile);

-- ============================================================================
-- MATERIALIZED VIEWS (alternative to secondary indexes)
-- ============================================================================

-- Wallets by status (for admin queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS wallets_by_status AS
    SELECT wallet_id, merchant_id, user_id, balance, status, user_mobile, updated_at
    FROM wallet_balances
    WHERE status IS NOT NULL AND wallet_id IS NOT NULL
    PRIMARY KEY (status, merchant_id, wallet_id);

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Test merchant wallet
INSERT INTO wallet_balances (
    wallet_id, merchant_id, user_id, balance, currency, status,
    user_mobile, user_name, version, created_at, updated_at
) VALUES (
    'wallet_test_merchant', 'merchant_test123', 'user_merchant',
    0, 'EGP', 'active',
    '+201000000000', 'Test Merchant', 1,
    toTimestamp(now()), toTimestamp(now())
) IF NOT EXISTS;

INSERT INTO merchant_wallets (
    merchant_id, wallet_id, user_id, user_mobile, balance, status, created_at
) VALUES (
    'merchant_test123', 'wallet_test_merchant', 'user_merchant',
    '+201000000000', 0, 'active', toTimestamp(now())
) IF NOT EXISTS;

INSERT INTO user_wallets (
    user_id, merchant_id, wallet_id, balance, status, created_at
) VALUES (
    'user_merchant', 'merchant_test123', 'wallet_test_merchant',
    0, 'active', toTimestamp(now())
) IF NOT EXISTS;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

-- Note: CQL doesn't support DO blocks like PostgreSQL
-- Success message will be printed by the application
