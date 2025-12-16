-- ✅ FIXED: Database Schema with Proper Indexes
-- Location: migrations/001_add_indexes.sql

-- ==============================================
-- PERFORMANCE: Add Missing Indexes
-- ==============================================

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id 
ON transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created 
ON transactions(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions(status) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(transaction_type);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_national_id 
ON users(national_id) 
WHERE national_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_status 
ON users(status);

CREATE INDEX IF NOT EXISTS idx_users_kyc_status 
ON users(kyc_status);

-- Wallets table indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id 
ON wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_wallets_status 
ON wallets(status);

CREATE INDEX IF NOT EXISTS idx_wallets_updated_at 
ON wallets(updated_at DESC);

-- Merchants table indexes
CREATE INDEX IF NOT EXISTS idx_merchants_owner_id 
ON merchants(owner_id);

CREATE INDEX IF NOT EXISTS idx_merchants_status 
ON merchants(status);

CREATE INDEX IF NOT EXISTS idx_merchants_category 
ON merchants(category);

CREATE INDEX IF NOT EXISTS idx_merchants_tax_id 
ON merchants(tax_id) 
WHERE tax_id IS NOT NULL;

-- MedCards table indexes
CREATE INDEX IF NOT EXISTS idx_medcards_user_id 
ON medcards(user_id);

CREATE INDEX IF NOT EXISTS idx_medcards_card_number 
ON medcards(card_number);

CREATE INDEX IF NOT EXISTS idx_medcards_status 
ON medcards(status);

CREATE INDEX IF NOT EXISTS idx_medcards_valid_until 
ON medcards(valid_until) 
WHERE status = 'active';

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity_type, entity_id);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token 
ON sessions(token);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
ON sessions(expires_at) 
WHERE expires_at > NOW();

-- OTP table indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone 
ON otp_codes(phone);

CREATE INDEX IF NOT EXISTS idx_otp_expires_at 
ON otp_codes(expires_at) 
WHERE verified = false;

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
ON notifications(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- ==============================================
-- PERFORMANCE: Add Connection Pooling Config
-- ==============================================

-- Set reasonable connection pool limits
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- ==============================================
-- ANALYTICS: Create Materialized Views
-- ==============================================

-- Daily transaction summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_transactions AS
SELECT 
  DATE(created_at) as transaction_date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT wallet_id) as unique_wallets,
  transaction_type
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at), transaction_type;

CREATE INDEX idx_mv_daily_transactions_date 
ON mv_daily_transactions(transaction_date DESC);

-- Wallet balance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_wallet_balances AS
SELECT 
  w.id as wallet_id,
  w.user_id,
  w.balance,
  COUNT(t.id) as transaction_count,
  MAX(t.created_at) as last_transaction_at
FROM wallets w
LEFT JOIN transactions t ON t.wallet_id = w.id
WHERE w.status = 'active'
GROUP BY w.id, w.user_id, w.balance;

CREATE INDEX idx_mv_wallet_balances_user 
ON mv_wallet_balances(user_id);

-- Merchant performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_merchant_performance AS
SELECT 
  m.id as merchant_id,
  m.business_name,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_revenue,
  AVG(t.amount) as avg_transaction,
  MAX(t.created_at) as last_transaction_at
FROM merchants m
LEFT JOIN transactions t ON t.merchant_id = m.id
WHERE m.status = 'active' AND t.status = 'completed'
GROUP BY m.id, m.business_name;

CREATE INDEX idx_mv_merchant_performance_revenue 
ON mv_merchant_performance(total_revenue DESC);

-- Refresh schedule for materialized views
-- Run these in a cron job or scheduled task
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_transactions;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_wallet_balances;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_merchant_performance;

-- ==============================================
-- MONITORING: Add Health Check Views
-- ==============================================

CREATE OR REPLACE VIEW v_system_health AS
SELECT 
  'transactions' as metric,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
FROM transactions
UNION ALL
SELECT 
  'users' as metric,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE kyc_status = 'pending') as pending_kyc,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
FROM users
UNION ALL
SELECT 
  'wallets' as metric,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE balance < 0) as negative_balance,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as last_hour
FROM wallets;

-- ==============================================
-- SECURITY: Add Audit Trail
-- ==============================================

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    ip_address,
    created_at
  ) VALUES (
    COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.client_ip', true),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to sensitive tables
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER trg_audit_wallets
AFTER INSERT OR UPDATE OR DELETE ON wallets
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER trg_audit_transactions
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER trg_audit_merchants
AFTER INSERT OR UPDATE OR DELETE ON merchants
FOR EACH ROW EXECUTE FUNCTION log_audit();
