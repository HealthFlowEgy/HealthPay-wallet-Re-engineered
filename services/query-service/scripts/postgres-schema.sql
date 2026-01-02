/**
 * HealthPay Ledger V2 - Sprint 4
 * PostgreSQL Schema for MedCard Detailed Read Models
 * 
 * Complete transactional history and detailed information
 */

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create database (if not exists)
-- CREATE DATABASE healthpay_ledger;

\c healthpay_ledger;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fast text search

-- =============================================================================
-- EVENT STORE (Immutable Log)
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  version INT NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(aggregate_id, version)
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id, version);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_aggregate_type ON events(aggregate_type, aggregate_id);

-- =============================================================================
-- USERS (From Previous Sprints)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  national_id VARCHAR(14) UNIQUE NOT NULL,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- =============================================================================
-- WALLETS (From Previous Sprints)
-- =============================================================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  account_number VARCHAR(20) UNIQUE NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_activation',
  daily_limit DECIMAL(12,2),
  monthly_limit DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_status ON wallets(status);
CREATE INDEX idx_wallets_account_number ON wallets(account_number);

-- =============================================================================
-- TRANSACTIONS (From Previous Sprints)
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- =============================================================================
-- MEDCARDS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medcards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  card_number VARCHAR(20) UNIQUE NOT NULL,
  card_type VARCHAR(20) NOT NULL,  -- basic, silver, gold, platinum
  status VARCHAR(30) NOT NULL DEFAULT 'pending_activation',
  monthly_limit DECIMAL(12,2) NOT NULL,
  current_month_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  copayment_percentage DECIMAL(5,2) NOT NULL,
  primary_holder JSONB NOT NULL,
  insurance_provider VARCHAR(100),
  policy_number VARCHAR(50),
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medcards_user ON medcards(user_id);
CREATE INDEX idx_medcards_status ON medcards(status);
CREATE INDEX idx_medcards_card_number ON medcards(card_number);
CREATE INDEX idx_medcards_card_type ON medcards(card_type);
CREATE INDEX idx_medcards_expiry ON medcards(expiry_date);
CREATE INDEX idx_medcards_insurance_provider ON medcards(insurance_provider) WHERE insurance_provider IS NOT NULL;

-- Full-text search on primary holder name
CREATE INDEX idx_medcards_primary_holder_name ON medcards USING GIN ((primary_holder->>'name') gin_trgm_ops);

-- =============================================================================
-- BENEFICIARIES (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY,
  medcard_id UUID NOT NULL REFERENCES medcards(id) ON DELETE CASCADE,
  relationship VARCHAR(20) NOT NULL,  -- spouse, child, parent, sibling, dependent
  national_id VARCHAR(14) NOT NULL,
  name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_medcard ON beneficiaries(medcard_id);
CREATE INDEX idx_beneficiaries_national_id ON beneficiaries(national_id);
CREATE INDEX idx_beneficiaries_relationship ON beneficiaries(relationship);
CREATE INDEX idx_beneficiaries_name ON beneficiaries USING GIN (name gin_trgm_ops);

-- Unique constraint: one beneficiary per national ID per medcard
CREATE UNIQUE INDEX idx_beneficiaries_unique ON beneficiaries(medcard_id, national_id);

-- =============================================================================
-- PRESCRIPTION CLAIMS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS prescription_claims (
  id UUID PRIMARY KEY,
  medcard_id UUID NOT NULL REFERENCES medcards(id),
  prescription_id UUID NOT NULL,
  pharmacy_id VARCHAR(50) NOT NULL,
  beneficiary_id UUID NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  covered_amount DECIMAL(12,2) NOT NULL,
  copayment_amount DECIMAL(12,2) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescription_claims_medcard ON prescription_claims(medcard_id);
CREATE INDEX idx_prescription_claims_pharmacy ON prescription_claims(pharmacy_id);
CREATE INDEX idx_prescription_claims_beneficiary ON prescription_claims(beneficiary_id);
CREATE INDEX idx_prescription_claims_date ON prescription_claims(claimed_at DESC);
CREATE INDEX idx_prescription_claims_prescription_id ON prescription_claims(prescription_id);

-- Index for monthly aggregations
CREATE INDEX idx_prescription_claims_month ON prescription_claims(medcard_id, date_trunc('month', claimed_at));

-- =============================================================================
-- PRESCRIPTION ITEMS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES prescription_claims(id) ON DELETE CASCADE,
  drug_code VARCHAR(50) NOT NULL,
  drug_name VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);

CREATE INDEX idx_prescription_items_claim ON prescription_items(claim_id);
CREATE INDEX idx_prescription_items_drug_code ON prescription_items(drug_code);
CREATE INDEX idx_prescription_items_drug_name ON prescription_items USING GIN (drug_name gin_trgm_ops);

-- =============================================================================
-- INSURANCE CLAIMS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY,
  medcard_id UUID NOT NULL REFERENCES medcards(id),
  provider_id VARCHAR(50) NOT NULL,
  provider_type VARCHAR(30) NOT NULL,  -- pharmacy, clinic, hospital, lab, diagnostic_center
  beneficiary_id UUID NOT NULL,
  claim_type VARCHAR(30) NOT NULL,  -- prescription, consultation, procedure, hospitalization, diagnostic
  total_amount DECIMAL(12,2) NOT NULL,
  requested_coverage DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, paid
  filed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_insurance_claims_medcard ON insurance_claims(medcard_id);
CREATE INDEX idx_insurance_claims_provider ON insurance_claims(provider_id);
CREATE INDEX idx_insurance_claims_beneficiary ON insurance_claims(beneficiary_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_insurance_claims_filed ON insurance_claims(filed_at DESC);
CREATE INDEX idx_insurance_claims_type ON insurance_claims(claim_type);
CREATE INDEX idx_insurance_claims_provider_type ON insurance_claims(provider_type);

-- =============================================================================
-- CLAIM DOCUMENTS (Sprint 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS claim_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_claim_documents_claim ON claim_documents(claim_id);
CREATE INDEX idx_claim_documents_type ON claim_documents(document_type);

-- =============================================================================
-- PAYMENTS (From Sprint 3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  gateway VARCHAR(20) NOT NULL,  -- fawry, paymob, internal
  gateway_transaction_id VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  status VARCHAR(20) NOT NULL DEFAULT 'initiated',
  method VARCHAR(20) NOT NULL,  -- card, wallet, bank_transfer, cash, fawry_ref
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_wallet ON payments(wallet_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway ON payments(gateway);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_gateway_txn ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- MedCard Summary View
CREATE OR REPLACE VIEW medcard_summary AS
SELECT 
  m.id,
  m.card_number,
  m.card_type,
  m.status,
  m.monthly_limit,
  m.current_month_spent,
  m.monthly_limit - m.current_month_spent AS remaining_balance,
  m.copayment_percentage,
  m.insurance_provider,
  COUNT(DISTINCT b.id) AS beneficiary_count,
  COUNT(DISTINCT pc.id) AS prescription_claim_count,
  COUNT(DISTINCT ic.id) AS insurance_claim_count,
  COALESCE(SUM(pc.total_amount), 0) AS total_claimed,
  COALESCE(SUM(pc.covered_amount), 0) AS total_covered,
  COALESCE(SUM(pc.copayment_amount), 0) AS total_copayments,
  m.created_at,
  m.updated_at
FROM medcards m
LEFT JOIN beneficiaries b ON b.medcard_id = m.id
LEFT JOIN prescription_claims pc ON pc.medcard_id = m.id 
  AND date_trunc('month', pc.claimed_at) = date_trunc('month', CURRENT_DATE)
LEFT JOIN insurance_claims ic ON ic.medcard_id = m.id 
  AND date_trunc('month', ic.filed_at) = date_trunc('month', CURRENT_DATE)
GROUP BY m.id;

-- Monthly MedCard Metrics
CREATE OR REPLACE VIEW medcard_monthly_metrics AS
SELECT 
  date_trunc('month', pc.claimed_at) AS month,
  m.card_type,
  COUNT(DISTINCT m.id) AS unique_cards,
  COUNT(pc.id) AS total_claims,
  SUM(pc.total_amount) AS total_amount,
  SUM(pc.covered_amount) AS total_covered,
  SUM(pc.copayment_amount) AS total_copayments,
  AVG(pc.total_amount) AS avg_claim_amount
FROM medcards m
JOIN prescription_claims pc ON pc.medcard_id = m.id
GROUP BY date_trunc('month', pc.claimed_at), m.card_type
ORDER BY month DESC, m.card_type;

-- Pharmacy Performance View
CREATE OR REPLACE VIEW pharmacy_performance AS
SELECT 
  pc.pharmacy_id,
  COUNT(pc.id) AS total_claims,
  COUNT(DISTINCT pc.medcard_id) AS unique_cards,
  SUM(pc.total_amount) AS total_volume,
  AVG(pc.total_amount) AS avg_claim_amount,
  MAX(pc.claimed_at) AS last_claim_date
FROM prescription_claims pc
WHERE pc.claimed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pc.pharmacy_id
ORDER BY total_volume DESC;

-- =============================================================================
-- MATERIALIZED VIEWS (For Fast Queries)
-- =============================================================================

-- Active MedCards with Current Month Stats
CREATE MATERIALIZED VIEW IF NOT EXISTS active_medcards_current_month AS
SELECT 
  m.id,
  m.user_id,
  m.card_number,
  m.card_type,
  m.monthly_limit,
  m.current_month_spent,
  m.copayment_percentage,
  COUNT(pc.id) AS claims_this_month,
  COALESCE(SUM(pc.total_amount), 0) AS spent_this_month
FROM medcards m
LEFT JOIN prescription_claims pc ON pc.medcard_id = m.id 
  AND date_trunc('month', pc.claimed_at) = date_trunc('month', CURRENT_DATE)
WHERE m.status = 'active'
GROUP BY m.id, m.user_id, m.card_number, m.card_type, m.monthly_limit, m.current_month_spent, m.copayment_percentage;

CREATE UNIQUE INDEX idx_active_medcards_id ON active_medcards_current_month(id);
CREATE INDEX idx_active_medcards_user ON active_medcards_current_month(user_id);

-- Refresh materialized view (run hourly via cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY active_medcards_current_month;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_medcards_updated_at BEFORE UPDATE ON medcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Get MedCard with all related data
CREATE OR REPLACE FUNCTION get_medcard_details(medcard_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'medcard', row_to_json(m.*),
    'beneficiaries', (
      SELECT json_agg(row_to_json(b.*))
      FROM beneficiaries b
      WHERE b.medcard_id = m.id
    ),
    'recent_claims', (
      SELECT json_agg(row_to_json(pc.*))
      FROM prescription_claims pc
      WHERE pc.medcard_id = m.id
      ORDER BY pc.claimed_at DESC
      LIMIT 10
    )
  ) INTO result
  FROM medcards m
  WHERE m.id = medcard_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Calculate remaining limit
CREATE OR REPLACE FUNCTION get_remaining_limit(medcard_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  remaining DECIMAL;
BEGIN
  SELECT monthly_limit - current_month_spent INTO remaining
  FROM medcards
  WHERE id = medcard_uuid;
  
  RETURN COALESCE(remaining, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE QUERIES
-- =============================================================================

/*
-- Get all MedCards for a user
SELECT * FROM medcards WHERE user_id = '...';

-- Get MedCard with beneficiaries
SELECT 
  m.*,
  json_agg(b.*) AS beneficiaries
FROM medcards m
LEFT JOIN beneficiaries b ON b.medcard_id = m.id
WHERE m.id = '...'
GROUP BY m.id;

-- Get recent prescription claims
SELECT * FROM prescription_claims
WHERE medcard_id = '...'
ORDER BY claimed_at DESC
LIMIT 50;

-- Monthly spending summary
SELECT 
  date_trunc('month', claimed_at) AS month,
  COUNT(*) AS claim_count,
  SUM(total_amount) AS total_spent,
  SUM(covered_amount) AS total_covered,
  SUM(copayment_amount) AS total_copayments
FROM prescription_claims
WHERE medcard_id = '...'
GROUP BY date_trunc('month', claimed_at)
ORDER BY month DESC;

-- Top pharmacies by volume
SELECT 
  pharmacy_id,
  COUNT(*) AS claim_count,
  SUM(total_amount) AS total_volume
FROM prescription_claims
WHERE claimed_at >= NOW() - INTERVAL '30 days'
GROUP BY pharmacy_id
ORDER BY total_volume DESC
LIMIT 10;

-- MedCards approaching limit
SELECT 
  id,
  card_number,
  card_type,
  monthly_limit,
  current_month_spent,
  monthly_limit - current_month_spent AS remaining,
  (current_month_spent / monthly_limit * 100) AS percentage_used
FROM medcards
WHERE status = 'active'
  AND current_month_spent / monthly_limit > 0.8
ORDER BY percentage_used DESC;
*/

-- =============================================================================
-- PERFORMANCE MONITORING
-- =============================================================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================================================
-- MAINTENANCE
-- =============================================================================

-- Vacuum tables (run weekly)
-- VACUUM ANALYZE medcards;
-- VACUUM ANALYZE prescription_claims;
-- VACUUM ANALYZE insurance_claims;

-- Reindex (if needed)
-- REINDEX TABLE medcards;
-- REINDEX TABLE prescription_claims;

-- Update statistics
-- ANALYZE medcards;
-- ANALYZE prescription_claims;
