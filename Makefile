.PHONY: help install dev build test lint format clean docker-up docker-down docker-logs db-shell-postgres db-shell-scylla db-shell-redis db-migrate db-seed health

help: ## Show this help message
	@echo "HealthPay Ledger V2 - Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	npm install

dev: ## Start all services in development mode
	npm run dev

build: ## Build all packages
	npm run build

test: ## Run all tests
	npm run test

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

typecheck: ## Run TypeScript type checking
	npm run typecheck

clean: ## Clean all build artifacts and dependencies
	npm run clean
	rm -rf node_modules

docker-up: ## Start Docker services
	docker-compose up -d
	@echo "✅ All services started"
	@echo "📊 Redpanda Console: http://localhost:8080"
	@echo "📈 Grafana: http://localhost:3300 (admin/admin123)"
	@echo "🔎 Jaeger: http://localhost:16686"
	@echo "🔍 Prometheus: http://localhost:9090"

docker-down: ## Stop Docker services
	docker-compose down

docker-down-volumes: ## Stop Docker services and remove volumes (⚠️ DATA LOSS)
	docker-compose down -v

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-logs-backend: ## Show backend service logs only
	docker-compose logs -f command-service query-service projection-service

docker-restart: ## Restart all Docker services
	docker-compose restart

docker-ps: ## Show running Docker services
	docker-compose ps

db-shell-postgres: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U healthpay -d healthpay_ledger

db-shell-scylla: ## Open ScyllaDB shell
	docker-compose exec scylla cqlsh

db-shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

db-migrate: ## Run database migrations
	npm run db:migrate

db-seed: ## Seed test data
	npm run db:seed
	@echo "✅ Test data seeded"

health: ## Check health of all Docker services
	@echo "🏥 Checking service health..."
	@docker-compose ps --format json | jq -r '.[] | "\(.Name): \(.Health)"'

verify: ## Verify development environment setup
	@echo "🔍 Verifying environment..."
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose not installed"; exit 1; }
	@echo "✅ Node.js: $$(node --version)"
	@echo "✅ npm: $$(npm --version)"
	@echo "✅ Docker: $$(docker --version)"
	@echo "✅ Docker Compose: $$(docker-compose --version)"
	@echo "✅ Environment verification passed!"
