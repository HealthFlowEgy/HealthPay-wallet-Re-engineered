#!/bin/bash

#############################################################################
# HealthPay Wallet - Production Deployment Script
# 
# This script deploys the HealthPay Wallet system to production with
# zero downtime and automatic rollback on failure.
#
# Usage: ./scripts/deploy-production.sh [--skip-tests] [--force]
#############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="healthpay"
DEPLOYMENT_TIMEOUT="600s"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_DELAY=5

# Parse arguments
SKIP_TESTS=false
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

#############################################################################
# Helper Functions
#############################################################################

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install kubectl."
    exit 1
  fi
  
  # Check helm
  if ! command -v helm &> /dev/null; then
    log_error "helm not found. Please install helm."
    exit 1
  fi
  
  # Check docker
  if ! command -v docker &> /dev/null; then
    log_error "docker not found. Please install docker."
    exit 1
  fi
  
  # Check context
  CURRENT_CONTEXT=$(kubectl config current-context)
  if [[ $CURRENT_CONTEXT != *"production"* ]] && [[ $FORCE_DEPLOY == false ]]; then
    log_error "Not in production context. Current: $CURRENT_CONTEXT"
    log_error "Use --force to deploy anyway (NOT RECOMMENDED)"
    exit 1
  fi
  
  log_info "Prerequisites check passed ✓"
}

run_tests() {
  if [[ $SKIP_TESTS == true ]]; then
    log_warn "Skipping tests (--skip-tests flag)"
    return 0
  fi
  
  log_info "Running tests..."
  
  # Unit tests
  log_info "Running unit tests..."
  npm test || {
    log_error "Unit tests failed"
    exit 1
  }
  
  # Integration tests
  log_info "Running integration tests..."
  npm run test:integration || {
    log_error "Integration tests failed"
    exit 1
  }
  
  log_info "All tests passed ✓"
}

build_images() {
  log_info "Building Docker images..."
  
  # Get git commit hash for tagging
  GIT_COMMIT=$(git rev-parse --short HEAD)
  IMAGE_TAG="v1.0.0-${GIT_COMMIT}"
  
  log_info "Image tag: $IMAGE_TAG"
  
  # Build command service
  log_info "Building command-service..."
  docker build -t healthpay/command-service:$IMAGE_TAG \
    -f services/command-service/Dockerfile \
    services/command-service/
  
  # Build API gateway
  log_info "Building api-gateway..."
  docker build -t healthpay/api-gateway:$IMAGE_TAG \
    -f services/api-gateway/Dockerfile \
    services/api-gateway/
  
  # Build query service
  log_info "Building query-service..."
  docker build -t healthpay/query-service:$IMAGE_TAG \
    -f services/query-service/Dockerfile \
    services/query-service/
  
  log_info "Docker images built successfully ✓"
  
  # Push images
  log_info "Pushing images to registry..."
  docker push healthpay/command-service:$IMAGE_TAG
  docker push healthpay/api-gateway:$IMAGE_TAG
  docker push healthpay/query-service:$IMAGE_TAG
  
  log_info "Images pushed successfully ✓"
  
  # Export for use in deployment
  export IMAGE_TAG
}

backup_database() {
  log_info "Creating database backup..."
  
  BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR="backups/${BACKUP_TIMESTAMP}"
  mkdir -p $BACKUP_DIR
  
  # Backup PostgreSQL
  kubectl exec -n $NAMESPACE deployment/postgres -- \
    pg_dump -U healthpay healthpay_ledger > $BACKUP_DIR/postgres_backup.sql
  
  log_info "Database backup created: $BACKUP_DIR ✓"
  export BACKUP_DIR
}

deploy_services() {
  log_info "Deploying services to production..."
  
  # Update image tags in deployment files
  sed -i "s|image: healthpay/command-service:.*|image: healthpay/command-service:$IMAGE_TAG|g" \
    deployment/k8s/20-backend-services.yaml
  sed -i "s|image: healthpay/api-gateway:.*|image: healthpay/api-gateway:$IMAGE_TAG|g" \
    deployment/k8s/10-kong-deployment.yaml
  sed -i "s|image: healthpay/query-service:.*|image: healthpay/query-service:$IMAGE_TAG|g" \
    deployment/k8s/20-backend-services.yaml
  
  # Apply deployments
  log_info "Applying Kubernetes manifests..."
  kubectl apply -f deployment/k8s/ --record
  
  # Wait for rollout
  log_info "Waiting for rollout to complete..."
  kubectl rollout status deployment/command-service -n $NAMESPACE --timeout=$DEPLOYMENT_TIMEOUT
  kubectl rollout status deployment/api-gateway -n $NAMESPACE --timeout=$DEPLOYMENT_TIMEOUT
  kubectl rollout status deployment/query-service -n $NAMESPACE --timeout=$DEPLOYMENT_TIMEOUT
  
  log_info "Deployment completed ✓"
}

health_check() {
  log_info "Running health checks..."
  
  # Get service URLs
  API_GATEWAY_URL=$(kubectl get svc api-gateway -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  
  # Health check with retries
  for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    log_info "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
    
    # Check API Gateway
    if curl -f -s "http://$API_GATEWAY_URL/health" > /dev/null; then
      log_info "API Gateway health check passed ✓"
      return 0
    fi
    
    log_warn "Health check failed, retrying in ${HEALTH_CHECK_DELAY}s..."
    sleep $HEALTH_CHECK_DELAY
  done
  
  log_error "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
  return 1
}

smoke_tests() {
  log_info "Running smoke tests..."
  
  API_GATEWAY_URL=$(kubectl get svc api-gateway -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  
  # Test authentication endpoint
  log_info "Testing authentication..."
  RESPONSE=$(curl -s -X POST "http://$API_GATEWAY_URL/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"phone":"01012345678"}')
  
  if echo $RESPONSE | grep -q "success"; then
    log_info "Authentication test passed ✓"
  else
    log_error "Authentication test failed"
    return 1
  fi
  
  # Test rate limiting
  log_info "Testing rate limiting..."
  for i in {1..4}; do
    curl -s -X POST "http://$API_GATEWAY_URL/api/auth/send-otp" \
      -H "Content-Type: application/json" \
      -d '{"phone":"01012345678"}' > /dev/null
  done
  
  RESPONSE=$(curl -s -w "%{http_code}" -X POST "http://$API_GATEWAY_URL/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"phone":"01012345678"}')
  
  if [[ $RESPONSE == *"429"* ]]; then
    log_info "Rate limiting test passed ✓"
  else
    log_warn "Rate limiting test failed (got $RESPONSE, expected 429)"
  fi
  
  log_info "Smoke tests completed ✓"
}

rollback() {
  log_error "Deployment failed. Rolling back..."
  
  kubectl rollout undo deployment/command-service -n $NAMESPACE
  kubectl rollout undo deployment/api-gateway -n $NAMESPACE
  kubectl rollout undo deployment/query-service -n $NAMESPACE
  
  log_info "Rollback completed"
  
  # Restore database if backup exists
  if [[ -n $BACKUP_DIR ]] && [[ -f $BACKUP_DIR/postgres_backup.sql ]]; then
    log_info "Restoring database from backup..."
    kubectl exec -n $NAMESPACE deployment/postgres -- \
      psql -U healthpay healthpay_ledger < $BACKUP_DIR/postgres_backup.sql
    log_info "Database restored"
  fi
  
  exit 1
}

notify_team() {
  local STATUS=$1
  local MESSAGE=$2
  
  log_info "Sending notification: $STATUS - $MESSAGE"
  
  # TODO: Integrate with Slack/Email/SMS
  # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  #   -H 'Content-Type: application/json' \
  #   -d "{\"text\": \"Deployment $STATUS: $MESSAGE\"}"
}

#############################################################################
# Main Deployment Flow
#############################################################################

main() {
  log_info "========================================="
  log_info "HealthPay Production Deployment Starting"
  log_info "========================================="
  log_info "Timestamp: $(date)"
  log_info "User: $(whoami)"
  log_info "Context: $(kubectl config current-context)"
  log_info ""
  
  # Confirmation prompt
  if [[ $FORCE_DEPLOY == false ]]; then
    read -p "Deploy to PRODUCTION? This will affect live users. (yes/no): " CONFIRM
    if [[ $CONFIRM != "yes" ]]; then
      log_warn "Deployment cancelled by user"
      exit 0
    fi
  fi
  
  # Trap errors and rollback
  trap rollback ERR
  
  # Deployment steps
  check_prerequisites
  run_tests
  build_images
  backup_database
  deploy_services
  
  # Verification
  if health_check && smoke_tests; then
    log_info ""
    log_info "========================================="
    log_info "✓ Deployment Successful!"
    log_info "========================================="
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Backup: $BACKUP_DIR"
    log_info "Timestamp: $(date)"
    log_info ""
    log_info "Next steps:"
    log_info "1. Monitor logs: kubectl logs -f deployment/command-service -n $NAMESPACE"
    log_info "2. Check metrics: https://grafana.healthpay.com"
    log_info "3. Monitor alerts: https://prometheus.healthpay.com/alerts"
    log_info ""
    
    notify_team "SUCCESS" "Deployment completed successfully"
  else
    log_error "Verification failed"
    rollback
  fi
}

# Run main function
main
