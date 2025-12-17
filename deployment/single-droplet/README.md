# HealthPay Wallet - Single Droplet Deployment

This directory contains everything needed to deploy the complete HealthPay Wallet system to a single DigitalOcean droplet.

## Overview

The deployment includes all services running in Docker containers on a single droplet in Frankfurt (FRA1):

**Backend Services:**
- Command Service (port 3000)
- Query Service (port 4000)
- API Gateway (port 8000)

**Frontend Applications:**
- Wallet Dashboard (port 3001)
- Admin Portal (port 3002)
- Merchant Portal (port 3003)

**Infrastructure:**
- PostgreSQL database
- Redis cache
- Redpanda (Kafka-compatible event store)
- Prometheus monitoring
- Grafana dashboards
- Nginx reverse proxy

## Droplet Specifications

**Region**: Frankfurt (FRA1)  
**Size**: 8GB RAM, 4 vCPUs, 160GB SSD  
**OS**: Ubuntu 22.04 LTS  
**IP Address**: 134.122.82.167

## Quick Start

### Step 1: SSH into Droplet

```bash
ssh root@134.122.82.167
```

### Step 2: Run Setup Script

```bash
# Download and run setup script
curl -o setup-droplet.sh https://raw.githubusercontent.com/HealthFlowEgy/HealthPay-wallet-Re-engineered/develop/deployment/single-droplet/setup-droplet.sh
chmod +x setup-droplet.sh
./setup-droplet.sh
```

This installs Docker, Docker Compose, Node.js, and configures the firewall.

### Step 3: Clone Repository

```bash
cd /opt/healthpay
git clone https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered.git
cd HealthPay-wallet-Re-engineered/deployment/single-droplet
```

### Step 4: Configure Environment

Copy the `.env` file from your local machine to the droplet:

```bash
# On your local machine
scp .env root@134.122.82.167:/opt/healthpay/HealthPay-wallet-Re-engineered/deployment/single-droplet/
```

Or create it manually on the droplet using the credentials from `credentials.txt`.

### Step 5: Build and Deploy

```bash
# Build all Docker images
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### Step 6: Verify Deployment

```bash
# Check service health
curl http://localhost:8000/health
curl http://localhost:3000/health
curl http://localhost:4000/health

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## Access URLs

Once deployed, access the applications at:

**Via Nginx (Recommended):**
- Main Site: http://134.122.82.167
- API: http://134.122.82.167/api/
- GraphQL: http://134.122.82.167/graphql
- Admin Portal: http://134.122.82.167/admin/
- Merchant Portal: http://134.122.82.167/merchant/
- Monitoring: http://134.122.82.167/monitoring/

**Direct Access:**
- API Gateway: http://134.122.82.167:8000
- Wallet Dashboard: http://134.122.82.167:3001
- Admin Portal: http://134.122.82.167:3002
- Merchant Portal: http://134.122.82.167:3003
- Grafana: http://134.122.82.167:3004
- Prometheus: http://134.122.82.167:9090

## Monitoring

### Grafana

Access Grafana at http://134.122.82.167:3004

**Login credentials:**
- Username: `admin`
- Password: See `credentials.txt`

The HealthPay dashboard is pre-configured with 12 panels showing system health, performance metrics, and business KPIs.

### Prometheus

Access Prometheus at http://134.122.82.167:9090

View metrics and alerts for all services.

## Management Commands

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
docker-compose -f docker-compose.production.yml restart command-service
```

### Stop Services

```bash
docker-compose -f docker-compose.production.yml down
```

### Update Deployment

```bash
# Pull latest code
git pull origin develop

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

## Database Access

### PostgreSQL

```bash
docker exec -it healthpay-postgres psql -U healthpay -d healthpay_ledger
```

### Redis

```bash
docker exec -it healthpay-redis redis-cli -a <REDIS_PASSWORD>
```

## Backup

### Database Backup

```bash
# PostgreSQL
docker exec healthpay-postgres pg_dump -U healthpay healthpay_ledger > backup_$(date +%Y%m%d).sql

# Redis
docker exec healthpay-redis redis-cli -a <REDIS_PASSWORD> --rdb /data/dump.rdb
```

### Full System Backup

```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Backup volumes
docker run --rm -v healthpay-single-droplet_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
docker run --rm -v healthpay-single-droplet_redis_data:/data -v $(pwd):/backup ubuntu tar czf /backup/redis_backup.tar.gz /data

# Restart services
docker-compose -f docker-compose.production.yml up -d
```

## Troubleshooting

### Services Won't Start

Check logs for errors:
```bash
docker-compose -f docker-compose.production.yml logs
```

### Out of Memory

Increase droplet size or optimize Docker memory limits in `docker-compose.production.yml`.

### Database Connection Errors

Ensure PostgreSQL and Redis are healthy:
```bash
docker-compose -f docker-compose.production.yml ps
```

### Port Conflicts

Check if ports are already in use:
```bash
netstat -tulpn | grep -E '3000|4000|8000|5432|6379|9092'
```

## Security Considerations

**Firewall**: Only ports 22, 80, and 443 are exposed. All other services are internal.

**Passwords**: All passwords are randomly generated and stored in `.env` and `credentials.txt`. Keep these files secure.

**JWT Secret**: A strong 64-character secret is generated for JWT token signing.

**SSL/TLS**: For production, configure SSL certificates with Let's Encrypt:
```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.production.yml` to add PostgreSQL tuning:
```yaml
command: postgres -c shared_buffers=2GB -c effective_cache_size=6GB -c max_connections=200
```

### Redis

For production workloads, consider Redis persistence configuration in `docker-compose.production.yml`.

## Scaling

This single-droplet deployment is suitable for development, staging, and small production deployments. For larger scale:

1. Migrate to Kubernetes (see `/deployment/k8s/`)
2. Use managed databases (DigitalOcean Managed PostgreSQL, Redis)
3. Separate frontend and backend to different droplets
4. Add load balancer for high availability

## Support

For issues or questions:
- GitHub Issues: https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered/issues
- Documentation: `/docs/`
- Architecture: `/docs/TECHNICAL_ARCHITECTURE.md`

## Files in This Directory

- `docker-compose.production.yml` - Main Docker Compose configuration
- `deploy-to-droplet.sh` - Automated droplet provisioning script
- `setup-droplet.sh` - Droplet setup script (run on droplet)
- `.env` - Environment variables (generated, do not commit)
- `credentials.txt` - Access credentials (generated, do not commit)
- `nginx/nginx.conf` - Nginx reverse proxy configuration
- `monitoring/prometheus.yml` - Prometheus configuration
- `README.md` - This file
