# Sprint 0: Foundation Setup (Week 1-2)

## 🎯 Sprint Goals

- ✅ Monorepo setup with Turborepo
- ✅ Project structure and configurations
- ✅ Docker Compose for development
- ✅ GitHub Actions CI/CD
- ✅ Database initialization scripts
- ✅ Documentation

## 📦 Deliverables

### 1. Repository Structure
```
healthpay-ledger-v2/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── apps/                          # Frontend applications (empty for now)
├── services/                      # Backend services (empty for now)
├── packages/                      # Shared packages (empty for now)
├── infrastructure/
│   └── monitoring/
│       └── prometheus.yml         # Prometheus config
├── scripts/
│   ├── postgres-init.sql          # PostgreSQL schema
│   ├── scylla-init.cql           # ScyllaDB schema
│   └── clickhouse-init.sql       # ClickHouse schema
├── docker-compose.yml             # Development environment
├── Makefile                       # Convenience commands
├── package.json                   # Root package.json
├── turbo.json                     # Turborepo config
├── tsconfig.json                  # TypeScript config
├── .gitignore                     # Git ignore rules
├── .env.example                   # Environment template
└── README.md                      # This file
```

### 2. Infrastructure
- ✅ Redpanda (Kafka-compatible message broker)
- ✅ ScyllaDB (Balance projections)
- ✅ PostgreSQL + TimescaleDB (Transaction history)
- ✅ ClickHouse (Analytics)
- ✅ Redis (Caching)
- ✅ Prometheus (Metrics)
- ✅ Grafana (Dashboards)
- ✅ Jaeger (Distributed tracing)

### 3. CI/CD Pipeline
- ✅ Lint checking (ESLint + Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit tests
- ✅ Docker builds
- ✅ Security scanning (Trivy + npm audit)

---

## 🚀 GitHub Repository Setup Guide

### Step 1: Create GitHub Repository

Use **Manus agent** to create the repository:

```
Repository Name: healthpay-ledger-v2
Description: HealthPay Ledger V2 - Event Sourcing + CQRS Architecture
Visibility: Private
Initialize: Do NOT add README, .gitignore, or license (we have our own)
```

### Step 2: Initial Commit & Push

**Using Manus Agent:**

1. **Initialize Git repository locally**
```bash
cd /path/to/sprint-0
git init
git branch -M main
```

2. **Add all files**
```bash
git add .
```

3. **Create initial commit**
```bash
git commit -m "Sprint 0: Initial project setup

- Monorepo structure with Turborepo
- Docker Compose for development environment
- Database initialization scripts (PostgreSQL, ScyllaDB, ClickHouse)
- GitHub Actions CI/CD pipeline
- Monitoring setup (Prometheus, Grafana, Jaeger)
- Environment configuration templates

Deliverables:
✅ Complete project structure
✅ Docker infrastructure (8 services)
✅ Database schemas
✅ CI/CD workflows
✅ Documentation"
```

4. **Link to remote repository**
```bash
git remote add origin https://github.com/healthflow/healthpay-ledger-v2.git
```

5. **Push to GitHub**
```bash
git push -u origin main
```

### Step 3: Create Development Branch

```bash
git checkout -b develop
git push -u origin develop
```

### Step 4: Set Branch Protection Rules

**Using GitHub UI (or Manus Agent):**

**For `main` branch:**
- ✅ Require pull request before merging
- ✅ Require 2 approvals
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date
- ✅ Include administrators

**For `develop` branch:**
- ✅ Require pull request before merging
- ✅ Require 1 approval
- ✅ Require status checks to pass (CI)

### Step 5: Add GitHub Secrets

**Required secrets for CI/CD:**

```
Settings → Secrets and variables → Actions → New repository secret
```

Add these secrets:
- `CODECOV_TOKEN` (if using Codecov)
- `DOCKER_USERNAME` (for Docker Hub)
- `DOCKER_PASSWORD` (for Docker Hub)

---

## 📝 Commit Message Convention

For all future commits, use this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat(domain): Add Wallet aggregate implementation

- Implement Wallet aggregate with event sourcing
- Add command handlers for credit/debit operations
- Include unit tests with 90% coverage

Closes #123

---

fix(projection): Resolve race condition in balance projection

The balance projection was not handling concurrent updates correctly.
Added optimistic locking using version numbers.

Closes #456

---

docs(readme): Update installation instructions

Added troubleshooting section for common Docker issues.
```

---

## 🧪 Verification Steps

After pushing to GitHub, verify:

### 1. CI Pipeline Running
- Go to: `Actions` tab on GitHub
- Check that CI workflow is running
- All jobs should pass (lint, typecheck, test, build)

### 2. Repository Structure
- Browse repository on GitHub
- Verify all files are present
- Check `.gitignore` is working (no `node_modules/`, `.env`, etc.)

### 3. Branch Protection
- Try to push directly to `main` (should fail)
- Create a test PR to verify approval requirements

---

## 💻 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/healthflow/healthpay-ledger-v2.git
cd healthpay-ledger-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 4. Start Docker Services

```bash
make docker-up
# or
docker-compose up -d
```

Wait for all services to be healthy (about 2-3 minutes).

### 5. Verify Services

```bash
make health
```

Expected output:
```
🏥 Checking service health...
healthpay-redpanda: healthy
healthpay-scylla: healthy
healthpay-postgres: healthy
healthpay-clickhouse: healthy
healthpay-redis: healthy
...
```

### 6. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Redpanda Console | http://localhost:8080 | - |
| Grafana | http://localhost:3300 | admin/admin123 |
| Jaeger | http://localhost:16686 | - |
| Prometheus | http://localhost:9090 | - |

---

## 🔧 Useful Commands

```bash
# Development
make install          # Install dependencies
make dev             # Start all services in dev mode
make build           # Build all packages
make test            # Run tests
make lint            # Run linter
make format          # Format code

# Docker
make docker-up       # Start Docker services
make docker-down     # Stop Docker services
make docker-logs     # View logs
make docker-ps       # Show running services

# Database
make db-shell-postgres    # PostgreSQL shell
make db-shell-scylla      # ScyllaDB shell
make db-shell-redis       # Redis CLI

# Utilities
make clean           # Clean build artifacts
make verify          # Verify environment setup
make health          # Check service health
```

---

## 📊 Sprint 0 Metrics

### Completed:
- ✅ Repository structure (100%)
- ✅ Docker infrastructure (100%)
- ✅ Database schemas (100%)
- ✅ CI/CD pipeline (100%)
- ✅ Documentation (100%)

### Next Sprint (Sprint 1):
- 🎯 Domain models & event types
- 🎯 Event store integration
- 🎯 Command service implementation
- 🎯 Basic unit tests

---

## 🐛 Troubleshooting

### Issue: Docker services not starting

```bash
# Check Docker daemon
docker info

# Check service logs
make docker-logs

# Restart services
make docker-down && make docker-up
```

### Issue: Port conflicts

Edit `docker-compose.yml` to use different ports:
```yaml
services:
  postgres:
    ports:
      - "15432:5432"  # Changed from 5432
```

### Issue: Database initialization failed

```bash
# Remove volumes and recreate
make docker-down-volumes
make docker-up

# Check initialization logs
docker-compose logs postgres
docker-compose logs scylla
docker-compose logs clickhouse
```

---

## 📚 References

- **Turborepo**: https://turbo.build/repo/docs
- **Docker Compose**: https://docs.docker.com/compose/
- **GitHub Actions**: https://docs.github.com/en/actions
- **ScyllaDB**: https://docs.scylladb.com/
- **TimescaleDB**: https://docs.timescale.com/
- **ClickHouse**: https://clickhouse.com/docs/

---

## ✅ Sprint 0 Checklist

- [ ] GitHub repository created
- [ ] Initial commit pushed to `main`
- [ ] `develop` branch created
- [ ] Branch protection rules configured
- [ ] CI pipeline passing
- [ ] Team members added to repository
- [ ] Local development environment verified
- [ ] Docker services running successfully
- [ ] Documentation reviewed
- [ ] Sprint 0 demo completed

---

## 👥 Team Sign-off

**Tech Lead:** [ ] Reviewed and approved  
**Backend Team:** [ ] Environment setup complete  
**Frontend Team:** [ ] Environment setup complete  
**DevOps:** [ ] Infrastructure verified  
**QA:** [ ] Testing environment ready  

---

## 📅 Next Steps

**Sprint 1 (Week 3-4): Core Event Sourcing**

Will include:
- Domain aggregates (Wallet, Payment, MedCard)
- Event types & command types
- Event store integration with Kafka
- Command handlers
- Unit tests (>80% coverage)

**Estimated LOC:** ~2,000 lines  
**Files:** ~15 TypeScript files  

---

**Sprint 0 Complete! ✅**  
**Date:** December 16, 2024  
**Status:** Ready for Sprint 1
