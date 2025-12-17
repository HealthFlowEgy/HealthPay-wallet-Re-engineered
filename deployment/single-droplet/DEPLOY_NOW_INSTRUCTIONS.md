# 🚀 Deploy HealthPay Wallet to DigitalOcean - Step by Step

Your droplet is ready at **134.122.82.167**. Follow these simple steps to deploy.

---

## Option 1: Automated Deployment (Recommended) - 5 Minutes

### Step 1: Copy and Run This Single Command

SSH into your droplet and run this one-liner:

```bash
ssh root@134.122.82.167 'bash -s' < /home/ubuntu/HealthPay-wallet-Re-engineered/deployment/single-droplet/setup-droplet.sh && ssh root@134.122.82.167 "cd /opt/healthpay && git clone https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered.git && cd HealthPay-wallet-Re-engineered/deployment/single-droplet && cat > .env << EOF
POSTGRES_PASSWORD=q9nUfGOiNeeAa1fU9F2RxQoyhC51JPmFZcuCYhPxcnI=
REDIS_PASSWORD=YVwbQgQMzISs2SFxayvPPRyv/YjjBWmDQ/LpIcNWye0=
JWT_SECRET=DM+ighWo4i282ISfjEB7uhgQV/aYvdbR3z3QxykTRu8R+Y+Dd0rSVnBxauP6ChNfZCuXLZpiM50j23lo8K/wuw==
GRAFANA_PASSWORD=eMALOc9HO5osNZOUT9q3uQ==
SMS_PROVIDER_API_KEY=your_sms_provider_api_key_here
DROPLET_IP=134.122.82.167
EOF
docker-compose -f docker-compose.production.yml up -d --build"
```

---

## Option 2: Manual Step-by-Step - 30 Minutes

### Step 1: SSH into Droplet (1 minute)

```bash
ssh root@134.122.82.167
```

### Step 2: Update System & Install Docker (5 minutes)

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Install Git (1 minute)

```bash
apt-get install -y git
```

### Step 4: Configure Firewall (1 minute)

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 5: Clone Repository (2 minutes)

```bash
mkdir -p /opt/healthpay
cd /opt/healthpay
git clone https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered.git
cd HealthPay-wallet-Re-engineered/deployment/single-droplet
```

### Step 6: Create Environment File (2 minutes)

```bash
cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=q9nUfGOiNeeAa1fU9F2RxQoyhC51JPmFZcuCYhPxcnI=
REDIS_PASSWORD=YVwbQgQMzISs2SFxayvPPRyv/YjjBWmDQ/LpIcNWye0=

# JWT
JWT_SECRET=DM+ighWo4i282ISfjEB7uhgQV/aYvdbR3z3QxykTRu8R+Y+Dd0rSVnBxauP6ChNfZCuXLZpiM50j23lo8K/wuw==

# Monitoring
GRAFANA_PASSWORD=eMALOc9HO5osNZOUT9q3uQ==

# SMS Provider
SMS_PROVIDER_API_KEY=your_sms_provider_api_key_here

# Droplet IP
DROPLET_IP=134.122.82.167
EOF
```

### Step 7: Build & Deploy (15-20 minutes)

```bash
# Build all services
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# This will start:
# - PostgreSQL, Redis, Redpanda
# - Command Service, Query Service, API Gateway
# - Wallet Dashboard, Admin Portal, Merchant Portal
# - Prometheus, Grafana, Nginx
```

### Step 8: Verify Deployment (2 minutes)

```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Check service health
curl http://localhost:8000/health
curl http://localhost:3000/health
curl http://localhost:4000/health

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## ✅ After Deployment

### Access Your Applications

**Frontend Applications:**
- Wallet Dashboard: http://134.122.82.167:3001
- Admin Portal: http://134.122.82.167:3002
- Merchant Portal: http://134.122.82.167:3003

**APIs:**
- API Gateway: http://134.122.82.167:8000
- GraphQL Playground: http://134.122.82.167:4000/graphql

**Monitoring:**
- Grafana: http://134.122.82.167:3004 (admin / eMALOc9HO5osNZOUT9q3uQ==)
- Prometheus: http://134.122.82.167:9090

### Test the System

```bash
# Test API health
curl http://134.122.82.167:8000/health

# Test wallet creation (example)
curl -X POST http://134.122.82.167:8000/api/wallet \
  -H "Content-Type: application/json" \
  -d '{"type":"PERSONAL","currency":"EGP"}'
```

---

## 🔧 Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f command-service
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart api-gateway
```

### Stop Services

```bash
docker-compose -f docker-compose.production.yml down
```

### Update Deployment

```bash
cd /opt/healthpay/HealthPay-wallet-Re-engineered
git pull origin develop
cd deployment/single-droplet
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check Docker status
systemctl status docker

# Restart Docker
systemctl restart docker
```

### Port Already in Use

```bash
# Check what's using the port
netstat -tulpn | grep 8000

# Kill the process
kill -9 <PID>
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk usage
df -h
```

---

## 📞 Need Help?

**Documentation:**
- `/deployment/single-droplet/README.md`
- `/docs/TECHNICAL_ARCHITECTURE.md`
- `/INTEGRATION_COMPLETE_GUIDE.md`

**Credentials:**
- `/deployment/single-droplet/credentials.txt`

**Repository:**
- https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] All 12 containers are running
- [ ] API Gateway responds to health check
- [ ] Wallet Dashboard loads in browser
- [ ] Admin Portal loads in browser
- [ ] Merchant Portal loads in browser
- [ ] Grafana dashboards show metrics
- [ ] No errors in logs

**If all checked, your deployment is successful!** 🚀
