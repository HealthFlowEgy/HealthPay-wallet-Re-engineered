# HealthPay Production Deployment Checklist

**Project**: HealthPay Wallet Re-engineering  
**Version**: 1.0.0  
**Date**: December 17, 2025

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All production fixes applied to codebase
- [ ] No console.log() in production code
- [ ] No commented-out code blocks
- [ ] No TODO comments in critical paths
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Code reviewed by at least 2 developers

### 2. Security 🔐

- [ ] JWT secret is strong (64+ characters)
- [ ] JWT secret is NOT default value
- [ ] No secrets in code or committed files
- [ ] All secrets in .env file
- [ ] .env file in .gitignore
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all forms
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CORS properly configured
- [ ] HTTPS enabled (production)
- [ ] Security headers configured

### 3. Dependencies 📦

- [ ] All npm dependencies installed
- [ ] No critical vulnerabilities (`npm audit`)
- [ ] Dependencies up to date
- [ ] Package-lock.json committed
- [ ] No unused dependencies

### 4. Environment Configuration ⚙️

- [ ] .env.example updated with all variables
- [ ] Production .env file created
- [ ] Database credentials configured
- [ ] Redis credentials configured
- [ ] SMS provider credentials configured
- [ ] JWT configuration set
- [ ] Rate limiting configuration set
- [ ] CORS origins configured
- [ ] Log level set appropriately

### 5. Database 🗄️

- [ ] PostgreSQL running and accessible
- [ ] ScyllaDB running and accessible
- [ ] ClickHouse running and accessible
- [ ] Redis running and accessible
- [ ] All schemas created
- [ ] Database indexes applied
- [ ] Database migrations run
- [ ] Database backups configured
- [ ] Connection pooling configured

### 6. Infrastructure 🏗️

- [ ] Kubernetes cluster ready
- [ ] All deployments configured
- [ ] Services configured
- [ ] Ingress configured
- [ ] Load balancer configured
- [ ] Auto-scaling configured
- [ ] Resource limits set
- [ ] Health checks configured
- [ ] Liveness probes configured
- [ ] Readiness probes configured

### 7. Monitoring & Observability 📊

- [ ] Prometheus configured
- [ ] Grafana dashboards created
- [ ] Jaeger tracing enabled
- [ ] Log aggregation configured
- [ ] Error tracking configured (Sentry)
- [ ] Alerts configured
- [ ] On-call rotation set up
- [ ] Runbooks created

### 8. Testing 🧪

- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load tests completed
- [ ] Security tests completed
- [ ] JWT validation tested
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] Toast notifications tested

### 9. Documentation 📚

- [ ] README.md updated
- [ ] API documentation complete
- [ ] Deployment guide created
- [ ] Runbooks created
- [ ] Architecture diagrams updated
- [ ] Change log updated
- [ ] User guides created

### 10. Communication 📢

- [ ] Stakeholders notified
- [ ] Deployment window scheduled
- [ ] Rollback plan communicated
- [ ] Support team briefed
- [ ] Users notified (if needed)

---

## 🚀 Deployment Steps

### Phase 1: Staging Deployment (Day 1)

#### Step 1: Deploy to Staging
```bash
# 1. Pull latest code
git checkout develop
git pull origin develop

# 2. Build Docker images
docker-compose build

# 3. Deploy to staging
kubectl config use-context staging
kubectl apply -f deployment/k8s/

# 4. Verify deployment
kubectl get pods -n healthpay
kubectl get services -n healthpay
```

**Checklist**:
- [ ] All pods running
- [ ] All services accessible
- [ ] Health checks passing
- [ ] No errors in logs

#### Step 2: Run Smoke Tests
```bash
# Test authentication
curl -X POST https://staging-api.healthpay.com/api/auth/send-otp \
  -d '{"phone":"01012345678"}'

# Test rate limiting
for i in {1..4}; do
  curl -X POST https://staging-api.healthpay.com/api/auth/send-otp \
    -d '{"phone":"01012345678"}'
done

# Test JWT validation
curl -X GET https://staging-api.healthpay.com/api/wallet/123/balance \
  -H "Authorization: Bearer invalid-token"
```

**Checklist**:
- [ ] Authentication works
- [ ] Rate limiting works
- [ ] JWT validation works
- [ ] Input validation works
- [ ] Toast notifications work
- [ ] i18n translations work

#### Step 3: Monitor Staging
```bash
# Watch logs
kubectl logs -f deployment/command-service -n healthpay
kubectl logs -f deployment/api-gateway -n healthpay

# Check metrics
open https://grafana-staging.healthpay.com
```

**Checklist**:
- [ ] No errors in logs
- [ ] Response times acceptable (<100ms)
- [ ] Memory usage normal (<70%)
- [ ] CPU usage normal (<60%)
- [ ] No database connection issues

### Phase 2: UAT (Days 2-3)

#### Step 1: User Acceptance Testing
- [ ] Test wallet creation
- [ ] Test wallet activation
- [ ] Test credit/debit operations
- [ ] Test transfers
- [ ] Test MedCard operations
- [ ] Test authentication flow
- [ ] Test all portals (wallet, admin, merchant)
- [ ] Test mobile responsiveness
- [ ] Test Arabic/English switching
- [ ] Test error handling

#### Step 2: Performance Testing
```bash
# Run load tests
cd tests/load
npm run load-test

# Check results
cat load-test-results.txt
```

**Targets**:
- [ ] 8,500 TPS achieved
- [ ] p99 latency <50ms
- [ ] No errors under load
- [ ] Auto-scaling works

#### Step 3: Security Testing
- [ ] Penetration testing completed
- [ ] Vulnerability scan passed
- [ ] Rate limiting verified
- [ ] Input validation verified
- [ ] JWT security verified

### Phase 3: Production Deployment (Day 4)

#### Step 1: Pre-Deployment
- [ ] All UAT issues resolved
- [ ] Deployment window confirmed
- [ ] Rollback plan ready
- [ ] Support team on standby
- [ ] Database backup completed

#### Step 2: Deploy to Production
```bash
# 1. Switch to production context
kubectl config use-context production

# 2. Deploy with zero downtime
kubectl apply -f deployment/k8s/ --record

# 3. Monitor rollout
kubectl rollout status deployment/command-service -n healthpay
kubectl rollout status deployment/api-gateway -n healthpay
kubectl rollout status deployment/query-service -n healthpay
```

**Checklist**:
- [ ] Deployment successful
- [ ] All pods running
- [ ] All services accessible
- [ ] Health checks passing
- [ ] No errors in logs

#### Step 3: Post-Deployment Verification
```bash
# Test critical paths
curl -X POST https://api.healthpay.com/api/auth/send-otp \
  -d '{"phone":"01012345678"}'

# Check metrics
open https://grafana.healthpay.com
```

**Checklist**:
- [ ] Authentication works
- [ ] Rate limiting works
- [ ] All APIs responding
- [ ] Response times normal
- [ ] No error spikes
- [ ] SMS sending works
- [ ] Database connections healthy

#### Step 4: Monitor Production (First 24 Hours)
- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor response times (target: <50ms p99)
- [ ] Monitor SMS costs
- [ ] Monitor database performance
- [ ] Monitor user feedback
- [ ] Check for any anomalies

---

## 🔄 Rollback Plan

### When to Rollback
- Error rate >1%
- Response time >500ms p99
- Critical bug discovered
- Security vulnerability found
- Database corruption detected

### Rollback Steps
```bash
# 1. Rollback deployment
kubectl rollout undo deployment/command-service -n healthpay
kubectl rollout undo deployment/api-gateway -n healthpay
kubectl rollout undo deployment/query-service -n healthpay

# 2. Verify rollback
kubectl rollout status deployment/command-service -n healthpay

# 3. Monitor
kubectl logs -f deployment/command-service -n healthpay
```

### Post-Rollback
- [ ] Incident report created
- [ ] Root cause analysis scheduled
- [ ] Fix plan created
- [ ] Stakeholders notified

---

## 📊 Success Criteria

### Technical Metrics
- [ ] Uptime >99.9%
- [ ] Response time <50ms p99
- [ ] Error rate <0.1%
- [ ] Throughput >8,500 TPS
- [ ] Zero data loss
- [ ] Zero security incidents

### Business Metrics
- [ ] User registration working
- [ ] Wallet operations working
- [ ] Payment processing working
- [ ] SMS delivery >99%
- [ ] User satisfaction >4.5/5

---

## 📞 Emergency Contacts

### Technical Team
- **DevOps Lead**: [Name] - [Phone]
- **Backend Lead**: [Name] - [Phone]
- **Frontend Lead**: [Name] - [Phone]
- **DBA**: [Name] - [Phone]

### Business Team
- **Product Manager**: [Name] - [Phone]
- **CEO**: [Name] - [Phone]

### External
- **Cloud Provider Support**: [Phone]
- **SMS Provider Support**: [Phone]

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor production for 24 hours
- [ ] Document any issues
- [ ] Update runbooks if needed
- [ ] Send deployment summary to stakeholders

### Week 1
- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Collect user feedback
- [ ] Optimize based on findings
- [ ] Update documentation

### Week 2
- [ ] Apply architecture fixes (event store, indexes)
- [ ] Improve test coverage to >90%
- [ ] Performance optimization
- [ ] Security hardening

### Month 1
- [ ] Review all metrics
- [ ] Plan next iteration
- [ ] Conduct retrospective
- [ ] Update roadmap

---

## ✅ Sign-Off

### Development Team
- [ ] Backend Lead: _________________ Date: _______
- [ ] Frontend Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______

### QA Team
- [ ] QA Lead: _________________ Date: _______

### Management
- [ ] Product Manager: _________________ Date: _______
- [ ] CTO: _________________ Date: _______

---

**Status**: Ready for Deployment  
**Estimated Deployment Time**: 4 days  
**Risk Level**: Medium (with rollback plan)  
**Go/No-Go Decision**: _____________
