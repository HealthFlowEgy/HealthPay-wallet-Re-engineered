#!/bin/bash

#############################################################################
# HealthPay Wallet - Droplet Setup Script
# 
# This script sets up the droplet with all required dependencies and
# prepares it for deployment.
#
# Run this script ON THE DROPLET after SSH'ing in.
#
# Usage: ./setup-droplet.sh
#############################################################################

set -e

GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_info "========================================="
log_info "HealthPay Droplet Setup"
log_info "========================================="

# Update system
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
log_info "Installing Docker..."
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
log_info "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js
log_info "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Git
log_info "Installing Git..."
apt-get install -y git

# Configure firewall
log_info "Configuring UFW firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create deployment directory
log_info "Creating deployment directory..."
mkdir -p /opt/healthpay
cd /opt/healthpay

# Clone repository (you'll need to provide credentials)
log_info "Repository cloning instructions:"
log_info "Run: git clone https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered.git"
log_info "Then: cd HealthPay-wallet-Re-engineered/deployment/single-droplet"

# Optimize Docker
log_info "Optimizing Docker..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

log_info ""
log_info "========================================="
log_info "✓ Droplet Setup Complete!"
log_info "========================================="
log_info ""
log_info "Next steps:"
log_info "1. Clone the repository"
log_info "2. Navigate to deployment/single-droplet"
log_info "3. Copy .env file from local machine"
log_info "4. Run: docker-compose -f docker-compose.production.yml up -d"
log_info ""
