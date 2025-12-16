/**
 * HealthPay Ledger V2 - Sprint 4
 * ScyllaDB Schema for MedCard Read Models
 * 
 * High-performance real-time balance tracking
 */

-- =============================================================================
-- KEYSPACE CREATION
-- =============================================================================

CREATE KEYSPACE IF NOT EXISTS healthpay_balances
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3  -- 3 replicas in datacenter 1
}
AND durable_writes = true;

USE healthpay_balances;

-- =============================================================================
-- WALLET BALANCES (From Sprint 1)
-- =============================================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
  wallet_id UUID,
  balance DECIMAL,
  currency TEXT,
  status TEXT,
  last_updated TIMESTAMP,
  PRIMARY KEY (wallet_id)
) WITH 
  comment = 'Real-time wallet balances for fast queries'
  AND compaction = {'class': 'LeveledCompactionStrategy'}
  AND gc_grace_seconds = 864000;  -- 10 days

-- Index for quick lookups by status
CREATE INDEX IF NOT EXISTS ON wallet_balances (status);

-- =============================================================================
-- MEDCARD MONTHLY SPENDING (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcard_monthly_spend (
  medcard_id UUID,
  month TEXT,  -- Format: YYYY-MM
  total_spent DECIMAL,
  monthly_limit DECIMAL,
  last_updated TIMESTAMP,
  PRIMARY KEY (medcard_id, month)
) WITH 
  comment = 'Real-time MedCard spending tracking by month'
  AND compaction = {'class': 'TimeWindowCompactionStrategy'}
  AND default_time_to_live = 31536000  -- 1 year TTL
  AND CLUSTERING ORDER BY (month DESC);

-- Index for querying by month across cards
CREATE MATERIALIZED VIEW IF NOT EXISTS medcard_spend_by_month AS
  SELECT medcard_id, month, total_spent, monthly_limit, last_updated
  FROM medcard_monthly_spend
  WHERE month IS NOT NULL 
    AND medcard_id IS NOT NULL
    AND total_spent IS NOT NULL
  PRIMARY KEY (month, medcard_id)
  WITH CLUSTERING ORDER BY (medcard_id ASC);

-- =============================================================================
-- MEDCARD REAL-TIME STATUS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcard_status (
  medcard_id UUID,
  status TEXT,  -- active, suspended, closed
  card_type TEXT,  -- basic, silver, gold, platinum
  monthly_limit DECIMAL,
  current_spent DECIMAL,
  remaining_balance DECIMAL,
  copayment_percentage DECIMAL,
  last_updated TIMESTAMP,
  PRIMARY KEY (medcard_id)
) WITH 
  comment = 'Fast access to current MedCard status and limits'
  AND compaction = {'class': 'LeveledCompactionStrategy'};

-- Index for querying by status
CREATE INDEX IF NOT EXISTS ON medcard_status (status);

-- Index for querying by card type
CREATE INDEX IF NOT EXISTS ON medcard_status (card_type);

-- =============================================================================
-- MEDCARD CLAIM COUNTER (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcard_claim_counts (
  medcard_id UUID,
  month TEXT,  -- Format: YYYY-MM
  prescription_claims COUNTER,
  insurance_claims COUNTER,
  total_claims COUNTER,
  PRIMARY KEY (medcard_id, month)
) WITH 
  comment = 'Fast counters for claim statistics'
  AND compaction = {'class': 'TimeWindowCompactionStrategy'}
  AND default_time_to_live = 31536000  -- 1 year TTL
  AND CLUSTERING ORDER BY (month DESC);

-- =============================================================================
-- PHARMACY CLAIM HISTORY (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS pharmacy_claims_recent (
  pharmacy_id TEXT,
  claimed_at TIMESTAMP,
  medcard_id UUID,
  prescription_id UUID,
  total_amount DECIMAL,
  covered_amount DECIMAL,
  copayment_amount DECIMAL,
  PRIMARY KEY (pharmacy_id, claimed_at, medcard_id)
) WITH 
  comment = 'Recent claims by pharmacy for reconciliation'
  AND compaction = {'class': 'TimeWindowCompactionStrategy'}
  AND default_time_to_live = 7776000  -- 90 days TTL
  AND CLUSTERING ORDER BY (claimed_at DESC, medcard_id ASC);

-- =============================================================================
-- USER MEDCARD LOOKUP (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_medcards (
  user_id UUID,
  medcard_id UUID,
  card_number TEXT,
  card_type TEXT,
  status TEXT,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, medcard_id)
) WITH 
  comment = 'Quick lookup of all MedCards for a user'
  AND compaction = {'class': 'LeveledCompactionStrategy'}
  AND CLUSTERING ORDER BY (medcard_id ASC);

-- =============================================================================
-- BENEFICIARY QUICK LOOKUP (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcard_beneficiaries_count (
  medcard_id UUID,
  beneficiary_count COUNTER,
  PRIMARY KEY (medcard_id)
) WITH 
  comment = 'Fast counter for number of beneficiaries per card';

-- =============================================================================
-- PERFORMANCE METRICS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcard_metrics_daily (
  date TEXT,  -- Format: YYYY-MM-DD
  card_type TEXT,
  total_cards COUNTER,
  total_claims COUNTER,
  total_amount COUNTER,
  avg_claim_amount DECIMAL,
  PRIMARY KEY (date, card_type)
) WITH 
  comment = 'Daily aggregated metrics for analytics'
  AND compaction = {'class': 'TimeWindowCompactionStrategy'}
  AND default_time_to_live = 31536000  -- 1 year TTL
  AND CLUSTERING ORDER BY (card_type ASC);

-- =============================================================================
-- INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Fast lookup of active cards
CREATE INDEX IF NOT EXISTS medcard_status_active_idx 
  ON medcard_status (status) 
  INCLUDE (card_type, monthly_limit, current_spent);

-- Fast lookup by card type
CREATE INDEX IF NOT EXISTS medcard_status_type_idx 
  ON medcard_status (card_type) 
  INCLUDE (status, monthly_limit);

-- =============================================================================
-- SAMPLE QUERIES
-- =============================================================================

/*
-- Get current balance for a MedCard
SELECT * FROM medcard_status WHERE medcard_id = ?;

-- Get current month spending
SELECT * FROM medcard_monthly_spend 
WHERE medcard_id = ? AND month = '2024-12';

-- Get all MedCards for a user
SELECT * FROM user_medcards WHERE user_id = ?;

-- Get recent claims for a pharmacy
SELECT * FROM pharmacy_claims_recent 
WHERE pharmacy_id = ? 
LIMIT 100;

-- Get claim counts for a card
SELECT * FROM medcard_claim_counts 
WHERE medcard_id = ? AND month = '2024-12';

-- Count active cards
SELECT COUNT(*) FROM medcard_status WHERE status = 'active';

-- Get daily metrics
SELECT * FROM medcard_metrics_daily 
WHERE date = '2024-12-16';
*/

-- =============================================================================
-- MAINTENANCE PROCEDURES
-- =============================================================================

/*
-- Compact tables (run during low traffic)
NODETOOL compact healthpay_balances medcard_monthly_spend;
NODETOOL compact healthpay_balances medcard_status;
NODETOOL compact healthpay_balances pharmacy_claims_recent;

-- Check table statistics
SELECT * FROM system_schema.tables 
WHERE keyspace_name = 'healthpay_balances';

-- Monitor read/write latency
NODETOOL cfstats healthpay_balances.medcard_status;

-- Repair tables (weekly)
NODETOOL repair healthpay_balances;
*/
