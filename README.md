# HealthPay Wallet - Re-engineered

A comprehensive digital wallet platform for healthcare payments in Egypt, featuring event-sourcing architecture with CQRS pattern.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

---

## 🏗️ Architecture Overview

```
healthpay-wallet/
├── apps/                          # Frontend applications
│   ├── wallet-dashboard/          # Next.js User Wallet (Web)
│   ├── admin-portal/              # Admin Dashboard (Static HTML)
│   └── merchant-portal/           # Merchant Dashboard (Static HTML)
├── mobile-app/                    # Flutter Mobile App (iOS/Android)
├── services/                      # Backend microservices
│   └── graphql-api/               # GraphQL API Server
├── packages/                      # Shared packages
├── database/                      # Database schemas & migrations
├── deployment/                    # Deployment configurations
├── infrastructure/                # Infrastructure as code
├── monitoring/                    # Monitoring & alerting
├── docs/                          # Documentation
└── scripts/                       # Utility scripts
```

---

## 📱 Applications

### 1. User Wallet Dashboard (Web)
**Location:** `apps/wallet-dashboard/`  
**Technology:** Next.js 14 + TypeScript + Tailwind CSS

| Feature | Status |
|---------|--------|
| OTP Authentication (Cequens SMS) | ✅ |
| Bilingual Support (Arabic/English) | ✅ |
| RTL Layout Support | ✅ |
| Wallet Balance & Dashboard | ✅ |
| Money Transfer (P2P) | ✅ |
| Wallet Top-Up | ✅ |
| Bill Payments (9 categories) | ✅ |
| Transaction History | ✅ |
| Profile & Settings | ✅ |
| Medical Card | ✅ |

**Access URLs:**
- Arabic: `http://your-domain:3006/ar/auth/login`
- English: `http://your-domain:3006/en/auth/login`

### 2. Mobile App (iOS/Android)
**Location:** `mobile-app/`  
**Technology:** Flutter 3.16+ + Dart 3.2+ + BLoC Pattern

| Feature | Status |
|---------|--------|
| Clean Architecture + BLoC | ✅ |
| OTP Authentication (Cequens SMS) | ✅ |
| Bilingual Support (Arabic/English) | ✅ |
| Biometric Authentication | ✅ |
| PIN Security | ✅ |
| All Wallet Features | ✅ |
| Offline Support | ✅ |

### 3. Admin Portal
**Location:** `apps/admin-portal/`  
**Technology:** Static HTML + JavaScript

| Feature | Status |
|---------|--------|
| User Management | ✅ |
| Merchant Management | ✅ |
| Transaction Monitoring | ✅ |
| Cashout Requests | ✅ |
| Verification Requests | ✅ |
| Site Settings | ✅ |

### 4. Merchant Portal
**Location:** `apps/merchant-portal/`  
**Technology:** Static HTML + JavaScript

| Feature | Status |
|---------|--------|
| Dashboard & Analytics | ✅ |
| Transaction History | ✅ |
| Payment Requests | ✅ |
| Customer Management | ✅ |
| API Token Management | ✅ |
| Notification Config | ✅ |

---

## 🔧 Backend Services

### GraphQL API
**Location:** `services/graphql-api/`  
**Technology:** Node.js + Apollo Server + Prisma + PostgreSQL

**Key Features:**
- Event Sourcing with CQRS pattern
- Cequens SMS OTP Integration
- JWT Authentication with refresh tokens
- Real-time subscriptions
- Rate limiting & security

**API Endpoint:** `http://your-domain:4000/graphql`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Flutter SDK 3.16+ (for mobile app)
- PostgreSQL 15+
- Redis

### 1. Clone Repository
```bash
git clone https://github.com/HealthFlowEgy/HealthPay-wallet-Re-engineered.git
cd HealthPay-wallet-Re-engineered
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Services
```bash
# Start GraphQL API
cd services/graphql-api && npm run dev

# Start Wallet Dashboard
cd apps/wallet-dashboard && npm run dev

# Start Mobile App
cd mobile-app && flutter run
```

---

## 📋 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/healthpay

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Cequens SMS
CEQUENS_API_URL=https://apis.cequens.com
CEQUENS_API_KEY=your-api-key
CEQUENS_SENDER_NAME=HealthPay

# GraphQL
GRAPHQL_PORT=4000
GRAPHQL_PLAYGROUND=true
```

---

## 🧪 Test Credentials

### User Wallet
| Field | Value |
|-------|-------|
| Phone Number | `01016464676` |
| OTP | Sent via Cequens SMS |
| Test Balance | 500.00 EGP |

### Admin Portal
| Field | Value |
|-------|-------|
| Email | `admin@healthpay.tech` |
| Password | `admin123` |

### Merchant Portal
| Field | Value |
|-------|-------|
| Merchant ID | `MRC-000001` |
| Password | `merchant123` |

---

## 📊 API Documentation

### Authentication
```graphql
# Send OTP
mutation SendOTP($phoneNumber: String!) {
  sendOTP(phoneNumber: $phoneNumber) {
    success
    message
  }
}

# Verify OTP
mutation VerifyOTP($phoneNumber: String!, $code: String!) {
  verifyOTP(phoneNumber: $phoneNumber, code: $code) {
    success
    token
    refreshToken
    user { id phoneNumber fullName }
  }
}
```

### Wallet Operations
```graphql
# Get Wallet Balance
query GetWallet($userId: ID!) {
  wallet(userId: $userId) {
    id
    balance
    currency
    dailyLimit
  }
}

# Transfer Money
mutation TransferMoney($input: TransferInput!) {
  transferMoney(input: $input) {
    success
    transaction { id amount status }
  }
}

# Top Up Wallet
mutation TopUpWallet($input: TopUpInput!) {
  topUpWallet(input: $input) {
    success
    transaction { id amount status }
  }
}
```

### Bill Payments
```graphql
# Inquire Bill
mutation InquireBill($input: BillInquiryInput!) {
  inquireBill(input: $input) {
    success
    billDetails { amount dueDate }
  }
}

# Pay Bill
mutation PayBill($input: PayBillInput!) {
  payBill(input: $input) {
    success
    transaction { id amount status }
  }
}
```

---

## 🔐 Security Features

- **JWT Authentication** with access & refresh tokens
- **PIN Security** with lockout after failed attempts
- **Biometric Authentication** (Face ID / Fingerprint)
- **Rate Limiting** on all API endpoints
- **Input Validation** and sanitization
- **HTTPS** enforcement in production
- **Secure Token Storage** (flutter_secure_storage)

---

## 📱 Mobile App Build

### Android APK
```bash
cd mobile-app
flutter build apk --release
```

### iOS IPA
```bash
cd mobile-app
flutter build ios --release
```

### Debug Mode
```bash
flutter run --debug
```

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📈 Monitoring

### Services
| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3300 | admin/admin123 |
| Prometheus | http://localhost:9090 | - |
| Jaeger | http://localhost:16686 | - |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support and inquiries:
- **Email:** support@healthpay.tech
- **Documentation:** [docs/](docs/)

---

## 🏆 Credits

Developed by **HealthFlow Egypt** Team

---

**Last Updated:** January 3, 2026
