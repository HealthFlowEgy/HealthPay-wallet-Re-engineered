#!/bin/bash

#############################################################################
# HealthPay Wallet - Single Droplet Deployment Script
# 
# This script provisions a DigitalOcean droplet and deploys the complete
# HealthPay Wallet system with all services.
#
# Usage: ./deploy-to-droplet.sh
#############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DO_TOKEN="${DO_TOKEN}"
REGION="fra1"
SIZE="s-4vcpu-8gb"  # 8GB RAM, 4 vCPUs, 160GB SSD
IMAGE="ubuntu-22-04-x64"
DROPLET_NAME="healthpay-production"
SSH_KEY_NAME="AmrSurface"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DO token is set
if [ -z "$DO_TOKEN" ]; then
    log_error "DO_TOKEN environment variable is not set"
    exit 1
fi

log_info "========================================="
log_info "HealthPay Single Droplet Deployment"
log_info "========================================="
log_info "Region: $REGION (Frankfurt)"
log_info "Size: $SIZE (8GB RAM, 4 vCPUs)"
log_info "Image: $IMAGE"
log_info ""

# Generate secure passwords
log_info "Generating secure passwords..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Create .env file
log_info "Creating .env file..."
cat > .env << EOF
# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# SMS Provider (configure with your provider)
SMS_PROVIDER_API_KEY=your_sms_provider_api_key_here

# Droplet IP (will be updated after provisioning)
DROPLET_IP=PLACEHOLDER
EOF

log_info "✓ .env file created"

# Create droplet using doctl
log_info "Provisioning DigitalOcean droplet..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    log_error "doctl is not installed. Installing..."
    cd ~
    wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
    tar xf doctl-1.98.1-linux-amd64.tar.gz
    sudo mv doctl /usr/local/bin
    rm doctl-1.98.1-linux-amd64.tar.gz
fi

# Authenticate with DigitalOcean
log_info "Authenticating with DigitalOcean..."
doctl auth init --access-token $DO_TOKEN

# Get SSH key ID
log_info "Getting SSH key ID..."
SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Name --no-header | grep "$SSH_KEY_NAME" | awk '{print $1}')

if [ -z "$SSH_KEY_ID" ]; then
    log_error "SSH key '$SSH_KEY_NAME' not found"
    exit 1
fi

log_info "SSH Key ID: $SSH_KEY_ID"

# Create droplet
log_info "Creating droplet '$DROPLET_NAME'..."
doctl compute droplet create $DROPLET_NAME \
    --region $REGION \
    --size $SIZE \
    --image $IMAGE \
    --ssh-keys $SSH_KEY_ID \
    --wait

# Get droplet IP
log_info "Getting droplet IP address..."
DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "$DROPLET_NAME" | awk '{print $2}')

if [ -z "$DROPLET_IP" ]; then
    log_error "Failed to get droplet IP"
    exit 1
fi

log_info "✓ Droplet created: $DROPLET_IP"

# Update .env with droplet IP
sed -i "s/DROPLET_IP=PLACEHOLDER/DROPLET_IP=$DROPLET_IP/" .env

# Wait for droplet to be ready
log_info "Waiting for droplet to be ready..."
sleep 30

# Configure firewall
log_info "Configuring firewall..."
doctl compute firewall create \
    --name healthpay-firewall \
    --inbound-rules "protocol:tcp,ports:22,sources:addresses:0.0.0.0/0,sources:addresses:::/0 protocol:tcp,ports:80,sources:addresses:0.0.0.0/0,sources:addresses:::/0 protocol:tcp,ports:443,sources:addresses:0.0.0.0/0,sources:addresses:::/0" \
    --outbound-rules "protocol:tcp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0 protocol:udp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0" \
    --droplet-ids $(doctl compute droplet list --format ID,Name --no-header | grep "$DROPLET_NAME" | awk '{print $1}') || log_warn "Firewall may already exist"

log_info "✓ Firewall configured"

# Save credentials
log_info "Saving credentials..."
cat > credentials.txt << EOF
========================================
HealthPay Wallet Deployment Credentials
========================================

Droplet Information:
- IP Address: $DROPLET_IP
- Region: Frankfurt (FRA1)
- Size: 8GB RAM, 4 vCPUs

Database Credentials:
- PostgreSQL Password: $POSTGRES_PASSWORD
- Redis Password: $REDIS_PASSWORD

Security:
- JWT Secret: $JWT_SECRET

Monitoring:
- Grafana Password: $GRAFANA_PASSWORD
- Grafana URL: http://$DROPLET_IP:3004

Application URLs:
- API Gateway: http://$DROPLET_IP:8000
- Wallet Dashboard: http://$DROPLET_IP:3001
- Admin Portal: http://$DROPLET_IP:3002
- Merchant Portal: http://$DROPLET_IP:3003
- Grafana: http://$DROPLET_IP:3004
- Prometheus: http://$DROPLET_IP:9090

SSH Access:
- ssh root@$DROPLET_IP

========================================
IMPORTANT: Keep this file secure!
========================================
EOF

log_info "✓ Credentials saved to credentials.txt"

log_info ""
log_info "========================================="
log_info "✓ Droplet Provisioned Successfully!"
log_info "========================================="
log_info "Droplet IP: $DROPLET_IP"
log_info ""
log_info "Next steps:"
log_info "1. SSH into droplet: ssh root@$DROPLET_IP"
log_info "2. Run setup script: ./setup-droplet.sh"
log_info "3. Deploy services: docker-compose up -d"
log_info ""
log_info "All credentials saved to: credentials.txt"
log_info ""
