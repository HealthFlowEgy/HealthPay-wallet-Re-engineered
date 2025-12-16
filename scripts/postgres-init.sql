-- ============================================================================
-- HealthPay Ledger V2 - PostgreSQL + TimescaleDB Initialization
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- TRANSACTIONS TABLE (Main transaction history)
-- ============================================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    wallet_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- Transaction details
    amount BIGINT NOT NULL, -- in piasters (1 EGP = 100 piasters)
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EGP',
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    
    -- Related entities
    counterparty_wallet_id TEXT,
    counterparty_user_id TEXT,
    
    -- Metadata
    description TEXT,
    correlation_id TEXT,
    causation_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Audit
    source TEXT, -- 'card_topup', 'wallet_transfer', 'merchant_payment', etc.
    ip_address INET,
    user_agent TEXT
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('transactions', 'created_at', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Indexes for common queries
CREATE INDEX idx_transactions_wallet ON transactions (wallet_id, created_at DESC);
CREATE INDEX idx_transactions_merchant ON transactions (merchant_id, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_correlation ON transactions (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_transactions_event_type ON transactions (event_type, created_at DESC);
CREATE INDEX idx_transactions_direction ON transactions (direction, created_at DESC);
CREATE INDEX idx_transactions_amount ON transactions (amount) WHERE amount > 1000000; -- Large transactions

-- ============================================================================
-- PAYMENT REQUESTS TABLE
-- ============================================================================

CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL UNIQUE,
    
    -- Parties
    from_wallet_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    from_merchant_id TEXT NOT NULL,
    to_wallet_id TEXT,
    to_user_id TEXT,
    
    -- Request details
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EGP',
    description TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
    
    -- Fulfillment
    transaction_id UUID REFERENCES transactions(id),
    fulfilled_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_payment_requests_from_wallet ON payment_requests (from_wallet_id, status, created_at DESC);
CREATE INDEX idx_payment_requests_to_wallet ON payment_requests (to_wallet_id, status, created_at DESC) WHERE to_wallet_id IS NOT NULL;
CREATE INDEX idx_payment_requests_status ON payment_requests (status, expires_at) WHERE status = 'pending';
CREATE INDEX idx_payment_requests_request_id ON payment_requests (request_id);

-- ============================================================================
-- WALLETS TABLE (Read model - for quick lookups)
-- ============================================================================

CREATE TABLE wallets (
    wallet_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    
    -- Balance (denormalized for quick access)
    balance BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EGP',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    
    -- Metadata
    user_mobile TEXT,
    user_email TEXT,
    user_name TEXT,
    
    -- Audit
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_transaction_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_wallets_user ON wallets (user_id);
CREATE INDEX idx_wallets_merchant ON wallets (merchant_id, status);
CREATE INDEX idx_wallets_status ON wallets (status);
CREATE UNIQUE INDEX idx_wallets_user_merchant ON wallets (user_id, merchant_id);

-- ============================================================================
-- MED CARDS TABLE
-- ============================================================================

CREATE TABLE med_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id TEXT NOT NULL UNIQUE,
    
    -- Card holder
    wallet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- Personal info
    full_name TEXT NOT NULL,
    national_id TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    
    -- Relationship
    relation_id INTEGER, -- 1=self, 2=spouse, 3=child, etc.
    relation_name TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_med_cards_wallet ON med_cards (wallet_id, status);
CREATE INDEX idx_med_cards_user ON med_cards (user_id);
CREATE INDEX idx_med_cards_national_id ON med_cards (national_id);
CREATE INDEX idx_med_cards_status ON med_cards (status);

-- ============================================================================
-- MATERIALIZED VIEWS FOR REPORTING
-- ============================================================================

-- Daily settlement report (for CBE compliance)
CREATE MATERIALIZED VIEW daily_settlement_report AS
SELECT 
    date_trunc('day', created_at) as settlement_date,
    merchant_id,
    
    -- Credit transactions
    COUNT(*) FILTER (WHERE direction = 'credit') as credit_count,
    SUM(amount) FILTER (WHERE direction = 'credit') as total_credits,
    
    -- Debit transactions
    COUNT(*) FILTER (WHERE direction = 'debit') as debit_count,
    SUM(amount) FILTER (WHERE direction = 'debit') as total_debits,
    
    -- Net settlement
    SUM(amount) FILTER (WHERE direction = 'credit') - 
    SUM(amount) FILTER (WHERE direction = 'debit') as net_settlement,
    
    -- Transaction count
    COUNT(*) as total_transaction_count
FROM transactions
GROUP BY date_trunc('day', created_at), merchant_id;

CREATE UNIQUE INDEX ON daily_settlement_report (settlement_date, merchant_id);

-- Refresh policy (every hour)
CREATE OR REPLACE FUNCTION refresh_daily_settlement_report()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_settlement_report;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_med_cards_updated_at
    BEFORE UPDATE ON med_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA / SEED
-- ============================================================================

-- Insert test merchant
INSERT INTO wallets (wallet_id, user_id, merchant_id, balance, status, user_mobile, user_name)
VALUES ('wallet_merchant_test', 'user_merchant', 'merchant_test123', 0, 'active', '+201000000000', 'Test Merchant')
ON CONFLICT (wallet_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthpay;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthpay;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO healthpay;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ HealthPay Ledger V2 - PostgreSQL initialized successfully!';
    RAISE NOTICE '📊 Tables created: transactions, payment_requests, wallets, med_cards';
    RAISE NOTICE '📈 TimescaleDB hypertable enabled for transactions';
    RAISE NOTICE '🔍 Materialized views created for reporting';
END $$;
