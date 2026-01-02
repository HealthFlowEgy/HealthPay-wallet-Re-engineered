# API Versioning Strategy - HealthPay Ledger V2

## 🎯 Versioning Approach

HealthPay Ledger uses **URL path versioning** as the primary strategy. This provides:
- Clear, visible version in URLs
- Easy routing and testing
- Good caching support
- Browser-friendly (can bookmark specific versions)

## 📍 Version Format

### Structure
```
https://api.healthpay.eg/{version}/{resource}
```

### Examples
```
https://api.healthpay.eg/v1/wallets
https://api.healthpay.eg/v2/wallets
https://api.healthpay.eg/v2/payments
```

## 🔄 Version Lifecycle

### Version States

1. **Development** (v2-alpha, v2-beta)
   - Active development
   - Breaking changes allowed
   - Not production-ready
   - Access: Staging environment only

2. **Current** (v2)
   - Latest stable version
   - Recommended for new integrations
   - Full feature set
   - Active development for new features
   - **Target: 99.9% uptime**

3. **Maintained** (v1)
   - Previous stable version
   - Bug fixes only
   - No new features
   - Sunset date announced
   - **Target: 99.5% uptime**

4. **Deprecated** (v0)
   - Sunset date reached
   - 6-month notice given
   - Security patches only
   - Migration guide published
   - **Target: 99% uptime**

5. **Retired**
   - Version removed
   - Returns 410 Gone
   - Redirects to migration guide

### Timeline

```
Development  →  Current  →  Maintained  →  Deprecated  →  Retired
                (18 months)  (12 months)   (6 months)
```

## 📋 Version Support Matrix

| Version | Status      | Release Date | EOL Date    | Migration Deadline |
|---------|-------------|--------------|-------------|-------------------|
| v3      | Development | 2025-Q4      | -           | -                 |
| v2      | **Current** | 2025-01-01   | 2027-01-01  | 2027-07-01       |
| v1      | Maintained  | 2024-01-01   | 2026-01-01  | 2026-07-01       |
| v0      | Retired     | 2023-01-01   | 2024-12-31  | 2025-06-30       |

## 🔧 Implementation

### 1. Route Structure (Express)

```typescript
// v1 routes
const v1Router = express.Router();
v1Router.get('/wallets', getWalletsV1);
v1Router.post('/wallets', createWalletV1);
app.use('/v1', v1Router);

// v2 routes
const v2Router = express.Router();
v2Router.get('/wallets', getWalletsV2);
v2Router.post('/wallets', createWalletV2);
app.use('/v2', v2Router);
```

### 2. Route Structure (Kong)

```yaml
services:
  - name: wallet-service-v1
    url: http://wallet-service-v1:3002
    routes:
      - paths: [/v1/wallets]
        
  - name: wallet-service-v2
    url: http://wallet-service-v2:3002
    routes:
      - paths: [/v2/wallets]
```

### 3. Shared Code Strategy

**Version-specific controllers:**
```
src/
├── controllers/
│   ├── v1/
│   │   ├── wallet.controller.ts
│   │   └── payment.controller.ts
│   └── v2/
│       ├── wallet.controller.ts
│       └── payment.controller.ts
├── services/
│   └── wallet.service.ts  # Shared business logic
└── models/
    └── wallet.model.ts    # Shared data models
```

**Version adapters:**
```typescript
// services/wallet.service.ts (shared)
export class WalletService {
  async getWallet(walletId: string): Promise<Wallet> {
    return await WalletModel.findById(walletId);
  }
}

// controllers/v1/wallet.controller.ts
export async function getWallet(req, res) {
  const wallet = await walletService.getWallet(req.params.id);
  res.json(adaptWalletToV1(wallet));  // V1 format
}

// controllers/v2/wallet.controller.ts
export async function getWallet(req, res) {
  const wallet = await walletService.getWallet(req.params.id);
  res.json(adaptWalletToV2(wallet));  // V2 format
}
```

## 🔀 Migration Patterns

### Pattern 1: Field Renaming

**V1:**
```json
{
  "wallet_id": "123",
  "available_balance": 1500.50,
  "pending_balance": 100.00
}
```

**V2:**
```json
{
  "id": "123",
  "availableBalance": 1500.50,
  "pendingBalance": 100.00
}
```

**Adapter:**
```typescript
function adaptWalletToV1(wallet: Wallet) {
  return {
    wallet_id: wallet.id,
    available_balance: wallet.availableBalance,
    pending_balance: wallet.pendingBalance,
  };
}

function adaptWalletToV2(wallet: Wallet) {
  return {
    id: wallet.id,
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance,
  };
}
```

### Pattern 2: Field Restructuring

**V1:**
```json
{
  "user_phone": "+201234567890",
  "user_email": "ahmed@example.com"
}
```

**V2:**
```json
{
  "user": {
    "phone": "+201234567890",
    "email": "ahmed@example.com"
  }
}
```

### Pattern 3: Pagination Changes

**V1:**
```json
{
  "wallets": [...],
  "total": 150,
  "page": 1,
  "per_page": 20
}
```

**V2:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Pattern 4: New Fields (Backward Compatible)

**V1:** (existing fields only)
```json
{
  "id": "123",
  "balance": 1500.50
}
```

**V2:** (adds new fields)
```json
{
  "id": "123",
  "balance": 1500.50,
  "currency": "EGP",
  "availableBalance": 1400.50,
  "pendingBalance": 100.00
}
```

## 📝 Deprecation Process

### Step 1: Announce (6-12 months before)
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: <https://docs.healthpay.eg/migration/v1-to-v2>; rel="deprecation"

{
  "data": {...},
  "_meta": {
    "deprecated": true,
    "sunsetDate": "2025-12-31T23:59:59Z",
    "migrationGuide": "https://docs.healthpay.eg/migration/v1-to-v2"
  }
}
```

### Step 2: Warning Period (3-6 months before)
- Email notifications to API consumers
- Dashboard warnings
- Console warnings in SDKs
- Increased logging

### Step 3: Grace Period (after sunset date)
- API still works
- Rate limiting reduced
- Performance not guaranteed
- "410 Gone" for new registrations

### Step 4: Retirement
```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": {
    "code": "VERSION_RETIRED",
    "message": "API v1 has been retired. Please use v2.",
    "migrationGuide": "https://docs.healthpay.eg/migration/v1-to-v2",
    "currentVersion": "v2"
  }
}
```

## 🚀 Rollout Strategy

### Phase 1: Alpha (Internal Only)
- Enable for testing in staging
- Feature flags for specific endpoints
- Monitor errors closely

```typescript
if (process.env.ENABLE_V2_ALPHA === 'true') {
  app.use('/v2', v2Router);
}
```

### Phase 2: Beta (Selected Partners)
- Whitelist specific API keys
- Gradual rollout (10% → 50% → 100%)
- Collect feedback

```typescript
function betaAccessMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (BETA_API_KEYS.includes(apiKey)) {
    next();
  } else {
    res.status(403).json({ error: 'v2 beta access required' });
  }
}

app.use('/v2', betaAccessMiddleware, v2Router);
```

### Phase 3: General Availability
- Public announcement
- Documentation updated
- Migration guide published
- V1 marked as "Maintained"

### Phase 4: V1 Deprecation
- 6-month notice
- Email campaigns
- Migration tracking dashboard
- Support for migrations

## 📊 Monitoring

### Key Metrics

1. **Version Usage**
   ```
   GET /metrics
   
   healthpay_api_requests_total{version="v1"} 45000
   healthpay_api_requests_total{version="v2"} 155000
   ```

2. **Migration Progress**
   - % of users on v2
   - % of traffic on v2
   - Active API keys per version

3. **Deprecation Impact**
   - Users still on deprecated versions
   - Failed migration attempts
   - Support tickets related to migration

### Dashboards

**Version Adoption Dashboard:**
```
┌────────────────────────────────────────────┐
│  API Version Usage (Last 30 Days)         │
├────────────────────────────────────────────┤
│  v2: ████████████████████  78%             │
│  v1: █████                 20%             │
│  v0: █                     2%              │
└────────────────────────────────────────────┘

Migration Progress: 78% of users migrated to v2
Estimated v1 retirement: 2026-01-01
```

## 🔐 Security Considerations

### JWT Tokens
- Include version claim in JWT
- Prevent v1 tokens from accessing v2 endpoints
- Grace period for token migration

```typescript
{
  "userId": "123",
  "version": "v2",  // API version this token is for
  "iat": 1640995200,
  "exp": 1640998800
}
```

### Rate Limiting
- Different limits per version
- Stricter limits on deprecated versions
- Encourage migration through pricing

## 📚 Documentation

### Version-Specific Docs
```
https://docs.healthpay.eg/v1/
https://docs.healthpay.eg/v2/
https://docs.healthpay.eg/migration/v1-to-v2
```

### Migration Guides
- Side-by-side comparisons
- Code examples
- Breaking changes highlighted
- Automated migration tools

### SDK Versions
```
npm install @healthpay/sdk@1.x  # For v1 API
npm install @healthpay/sdk@2.x  # For v2 API
```

## ✅ Best Practices

1. **Never break v1 while v1 is supported**
2. **Always provide migration path**
3. **Give 6+ months notice for deprecation**
4. **Monitor adoption metrics**
5. **Keep shared code DRY**
6. **Test both versions in CI/CD**
7. **Document all breaking changes**
8. **Provide automated migration tools**
9. **Offer migration support**
10. **Celebrate successful migrations** 🎉

## 🔮 Future: v3 Planning

When to introduce v3:
- Major architectural changes (e.g., GraphQL migration)
- Breaking changes that can't be avoided
- Industry standard updates (e.g., FHIR R5)
- After v2 has been stable for 18+ months

Current v3 candidates:
- Full GraphQL API
- WebSocket-first for real-time
- Hypermedia (HATEOAS) support
- Multi-region deployment
