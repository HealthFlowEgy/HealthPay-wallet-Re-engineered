#!/bin/bash

#############################################################################
# HealthPay Wallet - Emergency Rollback Script
# 
# This script performs an emergency rollback to the previous deployment.
#
# Usage: ./scripts/rollback.sh [--to-version <version>]
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NAMESPACE="healthpay"

# Parse arguments
TO_VERSION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --to-version)
      TO_VERSION="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

main() {
  log_warn "========================================="
  log_warn "EMERGENCY ROLLBACK INITIATED"
  log_warn "========================================="
  log_warn "Timestamp: $(date)"
  log_warn "User: $(whoami)"
  log_warn ""
  
  # Confirmation
  read -p "Perform EMERGENCY ROLLBACK? (yes/no): " CONFIRM
  if [[ $CONFIRM != "yes" ]]; then
    log_info "Rollback cancelled"
    exit 0
  fi
  
  log_info "Rolling back deployments..."
  
  # Rollback all services
  kubectl rollout undo deployment/command-service -n $NAMESPACE
  kubectl rollout undo deployment/api-gateway -n $NAMESPACE
  kubectl rollout undo deployment/query-service -n $NAMESPACE
  
  # Wait for rollback
  log_info "Waiting for rollback to complete..."
  kubectl rollout status deployment/command-service -n $NAMESPACE
  kubectl rollout status deployment/api-gateway -n $NAMESPACE
  kubectl rollout status deployment/query-service -n $NAMESPACE
  
  log_info ""
  log_info "========================================="
  log_info "✓ Rollback Completed"
  log_info "========================================="
  log_info ""
  log_info "Next steps:"
  log_info "1. Verify services are working"
  log_info "2. Check logs for errors"
  log_info "3. Create incident report"
  log_info "4. Schedule post-mortem"
}

main
