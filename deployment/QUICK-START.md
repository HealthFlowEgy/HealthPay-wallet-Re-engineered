# 🚀 Quick Deployment Guide - HealthPay Ledger V2

## Prerequisites Checklist

```bash
# Verify all tools are installed
kubectl version --client
helm version
terraform version
aws --version
docker --version
```

**Requirements:**
- ✅ kubectl v1.28+
- ✅ helm v3.12+
- ✅ terraform v1.6+
- ✅ aws-cli v2.13+
- ✅ AWS account with admin access
- ✅ GitHub account with Actions enabled

---

## 🏃 30-Minute Deployment

### Step 1: Clone & Configure (2 minutes)

```bash
# Clone repository
git clone https://github.com/healthflow-enterprise/healthpay-ledger-v2.git
cd healthpay-ledger-v2/deployment

# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="me-south-1"

# Configure deployment
cp config/production.tfvars.example config/production.tfvars
# Edit config/production.tfvars with your values
```

### Step 2: Provision Infrastructure (20 minutes)

```bash
cd terraform/

# Initialize
terraform init

# Preview
terraform plan -var-file=../config/production.tfvars

# Deploy
terraform apply -var-file=../config/production.tfvars -auto-approve

# Wait ~15-20 minutes for:
# - EKS cluster creation
# - RDS PostgreSQL provisioning
# - ElastiCache Redis setup
# - Network infrastructure
```

### Step 3: Configure Kubernetes (3 minutes)

```bash
# Get kubeconfig
aws eks update-kubeconfig --name healthpay-production --region me-south-1

# Verify
kubectl get nodes
# Should show 8-10 nodes across 3 AZs

# Create namespace
kubectl create namespace healthpay
```

### Step 4: Create Secrets (2 minutes)

```bash
# Generate secrets
./scripts/generate-secrets.sh production > secrets.env
source secrets.env

# Create Kubernetes secrets
kubectl create secret generic healthpay-secrets \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  --from-literal=REDIS_PASSWORD=$REDIS_PASSWORD \
  --from-literal=CEQUENS_API_KEY=$CEQUENS_API_KEY \
  --from-literal=FAWRY_MERCHANT_CODE=$FAWRY_MERCHANT_CODE \
  --from-literal=FAWRY_SECURITY_KEY=$FAWRY_SECURITY_KEY \
  --from-literal=PAYMOB_API_KEY=$PAYMOB_API_KEY \
  --namespace=healthpay

# Create TLS certificate (if you have one)
kubectl create secret tls healthpay-tls \
  --cert=certs/api.healthpay.eg.crt \
  --key=certs/api.healthpay.eg.key \
  --namespace=healthpay
```

### Step 5: Deploy Application (5 minutes)

```bash
cd ../helm/

# Add repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install
helm install healthpay healthpay-ledger/ \
  --namespace healthpay \
  --values healthpay-ledger/values-production.yaml \
  --timeout 15m \
  --wait

# Monitor deployment
watch kubectl get pods -n healthpay
```

### Step 6: Verify & Test (3 minutes)

```bash
# Check all pods are running
kubectl get pods -n healthpay

# Get API Gateway URL
export API_URL=$(kubectl get svc kong-proxy -n healthpay -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "API URL: https://$API_URL"

# Test health endpoint
curl -f https://$API_URL/v2/health

# Expected output:
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 123,
  "services": {
    "auth-service": "up",
    "wallet-service": "up",
    "payment-service": "up",
    "transaction-service": "up"
  }
}

# Run smoke tests
./scripts/smoke-tests.sh --url https://$API_URL
```

---

## 🎯 One-Line Deploy (Automated)

```bash
# Complete deployment in one command
./scripts/deploy.sh --environment production --region me-south-1
```

This script:
1. ✅ Provisions infrastructure (Terraform)
2. ✅ Configures kubectl
3. ✅ Generates secrets
4. ✅ Deploys application (Helm)
5. ✅ Runs verification tests
6. ✅ Sends Slack notification

**Total time**: ~25 minutes

---

## 🔄 Update Deployment

```bash
# Update image tag
helm upgrade healthpay healthpay-ledger/ \
  --namespace healthpay \
  --set walletService.image.tag=2.1.0 \
  --set paymentService.image.tag=2.1.0

# Update configuration
helm upgrade healthpay healthpay-ledger/ \
  --namespace healthpay \
  --values healthpay-ledger/values-production-v2.yaml
```

---

## 🔙 Rollback

```bash
# Rollback to previous version
helm rollback healthpay -n healthpay

# Rollback to specific revision
helm rollback healthpay 5 -n healthpay

# Verify
kubectl get pods -n healthpay
helm history healthpay -n healthpay
```

---

## 🧹 Cleanup (Destroy)

```bash
# Delete Kubernetes resources
helm uninstall healthpay -n healthpay
kubectl delete namespace healthpay

# Destroy infrastructure
cd terraform/
terraform destroy -var-file=../config/production.tfvars -auto-approve
```

⚠️ **Warning**: This will delete all data! Make sure you have backups.

---

## 📊 Access Dashboards

### Grafana
```bash
kubectl port-forward svc/grafana 3000:3000 -n healthpay
# Open: http://localhost:3000
# Username: admin
# Password: kubectl get secret grafana-admin -n healthpay -o jsonpath='{.data.password}' | base64 -d
```

### Prometheus
```bash
kubectl port-forward svc/prometheus-server 9090:9090 -n healthpay
# Open: http://localhost:9090
```

### Kong Admin
```bash
kubectl port-forward svc/kong-admin 8001:8001 -n healthpay
# Open: http://localhost:8001
```

---

## 🐛 Troubleshooting

### Pods not starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n healthpay

# Check logs
kubectl logs <pod-name> -n healthpay --tail=100

# Common issues:
# - Image pull errors: Check registry credentials
# - CrashLoopBackOff: Check environment variables
# - Pending: Check resource quotas
```

### Database connection errors
```bash
# Check PostgreSQL connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgresql-ha -U healthpay -d healthpay_ledger

# Check Redis connectivity
kubectl run -it --rm debug --image=redis:7 --restart=Never -- \
  redis-cli -h redis-ha-master ping
```

### High latency
```bash
# Check resource usage
kubectl top pods -n healthpay

# Check HPA status
kubectl get hpa -n healthpay

# Scale manually if needed
kubectl scale deployment wallet-service --replicas=10 -n healthpay
```

---

## 📞 Get Help

- **Documentation**: https://docs.healthflow.eg
- **Slack**: #healthpay-ops
- **Email**: ops@healthflow.eg
- **Emergency**: +20-XXX-XXX-XXXX (24/7)

---

## ✅ Deployment Verification

After deployment, verify:

- [ ] All pods are running
- [ ] Health endpoint returns 200
- [ ] Can create wallet via API
- [ ] Can process payment
- [ ] WebSocket connections work
- [ ] Metrics visible in Grafana
- [ ] Logs flowing to CloudWatch
- [ ] Backups scheduled
- [ ] Alerts configured
- [ ] DNS pointing to load balancer
- [ ] SSL certificate valid

---

**🎉 Congratulations! HealthPay Ledger V2 is LIVE!** 🇪🇬
