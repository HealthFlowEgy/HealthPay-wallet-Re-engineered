# HealthPay Ledger V2 - Deployment Guide
## Sprint 4 Production Deployment

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Service Deployment](#service-deployment)
5. [Verification](#verification)
6. [Monitoring](#monitoring)

---

## Prerequisites

### Required Software
- Docker 24+ and Docker Compose
- PostgreSQL 15+
- ScyllaDB 5.2+
- Redpanda/Kafka 23+
- Node.js 20+ (for development)
- kubectl (for Kubernetes deployment)

### Environment Variables
```bash
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/healthpay_ledger
SCYLLA_HOSTS=scylla1:9042,scylla2:9042,scylla3:9042
SCYLLA_KEYSPACE=healthpay_balances

# Kafka/Redpanda
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
KAFKA_TOPIC=healthpay.events.wallet

# API
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGINS=https://app.healthpay.tech

# External Services
CEQUENS_API_KEY=your-cequens-key
FAWRY_MERCHANT_CODE=your-fawry-code
PAYMOB_API_KEY=your-paymob-key
```

---

## Infrastructure Setup

### 1. Docker Compose (Development/Staging)

```bash
# Start all services
docker-compose up -d

# Check health
docker-compose ps
docker-compose logs -f
```

### 2. Kubernetes (Production)

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config-maps.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/deployments.yaml

# Verify
kubectl get pods -n healthpay
kubectl get services -n healthpay
```

---

## Database Setup

### PostgreSQL Event Store

```sql
-- Create database
CREATE DATABASE healthpay_ledger;

-- Create events table
CREATE TABLE events (
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

-- Create read models
CREATE TABLE medcards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  card_number VARCHAR(20) UNIQUE NOT NULL,
  card_type VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  monthly_limit DECIMAL(12,2) NOT NULL,
  current_month_spent DECIMAL(12,2) DEFAULT 0,
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

CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY,
  medcard_id UUID NOT NULL REFERENCES medcards(id),
  relationship VARCHAR(20) NOT NULL,
  national_id VARCHAR(14) NOT NULL,
  name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_medcard ON beneficiaries(medcard_id);

CREATE TABLE prescription_claims (
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
CREATE INDEX idx_prescription_claims_date ON prescription_claims(claimed_at DESC);

CREATE TABLE prescription_items (
  id UUID PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES prescription_claims(id),
  drug_code VARCHAR(50) NOT NULL,
  drug_name VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);
```

### ScyllaDB Balance Store

```cql
-- Create keyspace
CREATE KEYSPACE IF NOT EXISTS healthpay_balances
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3
};

-- Create balance table
CREATE TABLE IF NOT EXISTS healthpay_balances.wallet_balances (
  wallet_id UUID,
  balance DECIMAL,
  currency TEXT,
  last_updated TIMESTAMP,
  PRIMARY KEY (wallet_id)
);

-- Create MedCard balance tracking
CREATE TABLE IF NOT EXISTS healthpay_balances.medcard_monthly_spend (
  medcard_id UUID,
  month TEXT,
  total_spent DECIMAL,
  last_updated TIMESTAMP,
  PRIMARY KEY (medcard_id, month)
);
```

---

## Service Deployment

### 1. Build Docker Images

```bash
# Build all services
docker build -t healthpay/projection-service:v2.0 -f Dockerfile.projection .
docker build -t healthpay/command-service:v2.0 -f Dockerfile.command .
docker build -t healthpay/api-gateway:v2.0 -f Dockerfile.api .

# Push to registry
docker push healthpay/projection-service:v2.0
docker push healthpay/command-service:v2.0
docker push healthpay/api-gateway:v2.0
```

### 2. Deploy Services

**Projection Service (3 instances for HA)**
```bash
kubectl scale deployment projection-service --replicas=3 -n healthpay
```

**Command Service (5 instances for load)**
```bash
kubectl scale deployment command-service --replicas=5 -n healthpay
```

**API Gateway (3 instances)**
```bash
kubectl scale deployment api-gateway --replicas=3 -n healthpay
```

### 3. Configure Load Balancer

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: healthpay-api
  namespace: healthpay
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.healthpay.tech
    secretName: api-healthpay-tls
  rules:
  - host: api.healthpay.tech
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

---

## Verification

### Health Checks

```bash
# API Gateway
curl https://api.healthpay.tech/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0",
  "services": {
    "postgres": "up",
    "scylla": "up",
    "kafka": "up"
  }
}

# GraphQL Playground
open https://api.healthpay.tech/graphql

# Metrics
curl https://api.healthpay.tech/metrics
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-tests/medcard-claim.js

# Target: 10,000 TPS with <50ms p95 latency
```

### End-to-End Test

```bash
# Create MedCard
curl -X POST https://api.healthpay.tech/api/v1/medcards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "cardType": "gold",
    "monthlyLimit": 5000
  }'

# Claim prescription
curl -X POST https://api.healthpay.tech/api/v1/medcards/{id}/claims/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionId": "rx-test-1",
    "totalAmount": 350.00
  }'

# Verify in database
psql $POSTGRES_URL -c "SELECT * FROM prescription_claims ORDER BY claimed_at DESC LIMIT 1"
```

---

## Monitoring

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'healthpay-api'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'healthpay-projection'
    static_configs:
      - targets: ['projection-service:3001']
```

### Grafana Dashboards

Import dashboards:
- **HealthPay Overview**: Dashboard ID 1001
- **Event Sourcing Metrics**: Dashboard ID 1002
- **MedCard Operations**: Dashboard ID 1003

### Alerts

```yaml
# alerts.yml
groups:
- name: healthpay
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    annotations:
      summary: "High error rate detected"

  - alert: SlowResponse
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.1
    annotations:
      summary: "95th percentile latency > 100ms"

  - alert: EventLag
    expr: kafka_consumer_lag > 1000
    annotations:
      summary: "Projection service lagging"
```

---

## Rollback Procedure

```bash
# 1. Scale down new version
kubectl scale deployment api-gateway --replicas=0 -n healthpay

# 2. Scale up previous version
kubectl rollout undo deployment api-gateway -n healthpay

# 3. Verify
kubectl rollout status deployment api-gateway -n healthpay

# 4. Check metrics
curl https://api.healthpay.tech/health
```

---

## Production Checklist

- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Load balancer configured
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Backup schedule configured
- [ ] Disaster recovery plan documented
- [ ] Load testing completed (10K TPS)
- [ ] Security scan passed
- [ ] API documentation published
- [ ] Runbooks created for ops team
- [ ] On-call rotation scheduled

---

## Support

**Deployment Issues:**
- Slack: #healthpay-deployments
- Email: devops@healthpay.tech
- On-call: +20 123 456 7890

**Documentation:**
- Architecture: https://docs.healthpay.tech/architecture
- API Docs: https://docs.healthpay.tech/api
- Runbooks: https://docs.healthpay.tech/runbooks

---

**HealthPay Ledger V2**  
Production-Ready Healthcare Infrastructure for Egypt 🇪🇬
