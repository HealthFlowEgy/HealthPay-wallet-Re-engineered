# API Compatibility Analysis: Old vs New Architecture

**Date**: December 17, 2025  
**Old API**: https://documenter.getpostman.com/view/22876315/2sA3QmEv3i  
**New Architecture**: Event Sourcing + CQRS (HealthPay Ledger V2)

---

## Executive Summary

The existing Postman API documentation represents a **traditional GraphQL-based architecture** that is **fundamentally incompatible** with the new **Event Sourcing + CQRS architecture**. While the business logic and domain concepts remain largely the same, the API design, response patterns, and operational semantics have changed significantly.

**Compatibility Status**: ❌ **NOT COMPATIBLE** (Requires Migration)

**Migration Complexity**: **HIGH**

**Recommended Action**: **Create API Compatibility Layer** or **Migrate Clients to New API**

---

## Detailed Comparison

### 1. API Style & Protocol

| Aspect | Old Architecture | New Architecture | Compatible? |
|--------|------------------|------------------|-------------|
| **API Style** | GraphQL (single endpoint) | REST + GraphQL (separate services) | ❌ NO |
| **Endpoint** | `https://sword.back.healthpay.tech/graphql` | Command: `/api/wallet/*`, Query: `/graphql` or `/api/*` | ❌ NO |
| **Protocol** | GraphQL mutations/queries | REST (commands), GraphQL/REST (queries) | ❌ NO |
| **Request Format** | GraphQL query/mutation | JSON (REST), GraphQL (queries) | ❌ NO |
| **Response Format** | Synchronous data | Async (202 Accepted for commands), Sync (queries) | ❌ NO |

**Impact**: **CRITICAL** - Clients cannot directly use new API without modification.

---

### 2. Authentication & Authorization

| Aspect | Old Architecture | New Architecture | Compatible? |
|--------|------------------|------------------|-------------|
| **Method** | Custom two-tier (merchant + user) | SMS OTP + JWT | ⚠️ PARTIAL |
| **Headers** | `api-header` + `Authorization: Bearer` | `Authorization: Bearer` (JWT) | ⚠️ PARTIAL |
| **Merchant Auth** | `authMerchant` mutation | Not explicitly documented | ❌ NO |
| **User Auth** | `loginUser` + `authUser` (SMS OTP) | SMS OTP + JWT (similar) | ✅ YES |
| **Token Type** | Long-lasting JWT | Short-lived access (15min) + refresh (7day) | ❌ NO |
| **Session Management** | `logoutUser` mutation | JWT expiration + Redis revocation | ⚠️ PARTIAL |

**Impact**: **HIGH** - Authentication flow needs adaptation, especially for merchants.

**Key Differences**:
- Old system has explicit merchant authentication step
- New system uses shorter-lived access tokens with refresh mechanism
- Old system uses custom `api-header`, new system uses standard JWT

---

### 3. Wallet Operations

| Operation | Old API | New API | Compatible? |
|-----------|---------|---------|-------------|
| **Create Wallet** | Not documented | `POST /api/wallet` | ❌ NO |
| **Activate Wallet** | Not documented | `PUT /api/wallet/{id}/activate` | ❌ NO |
| **Top-up (Credit)** | `topupWalletUser` (mutation) | `POST /api/wallet/{id}/credit` | ⚠️ PARTIAL |
| **Deduct (Debit)** | `deductFromUser` (mutation) | `POST /api/wallet/{id}/debit` | ⚠️ PARTIAL |
| **Transfer** | Not documented | `POST /api/wallet/transfer` | ❌ NO |
| **View Balance** | `userWallet` (mutation/query) | `GET /api/wallet/{id}/balance` | ⚠️ PARTIAL |
| **Payment Request** | `sendPaymentRequest` (mutation) | Not explicitly documented | ❌ NO |
| **Pay to User** | `payToUser` (mutation) | Likely `POST /api/payment/*` | ⚠️ PARTIAL |
| **View Payment Requests** | `userPaymentRequests` (query) | GraphQL query or REST endpoint | ⚠️ PARTIAL |

**Impact**: **HIGH** - API endpoints and request/response formats are different.

**Key Differences**:
- Old system: GraphQL mutations, synchronous responses
- New system: REST commands (async), GraphQL/REST queries (sync)
- Old system: Direct balance modification
- New system: Event-driven balance updates (eventual consistency)

**Example Transformation**:

**Old API (topupWalletUser)**:
```graphql
mutation topupWalletUser($userToken: String!, $amount: Float!) {
  topupWalletUser(userToken: $userToken, amount: $amount) {
    isSuccess
    newBalance
  }
}
```

**New API (creditWallet)**:
```http
POST /api/wallet/{walletId}/credit
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "EGP",
  "reference": "topup-123"
}

Response: 202 Accepted
{
  "eventId": "evt-456",
  "timestamp": "2025-12-17T10:00:00Z"
}
```

**Critical Change**: New API returns **202 Accepted** (async) instead of immediate balance.

---

### 4. MedCard Operations

| Operation | Old API | New API | Compatible? |
|-----------|---------|---------|-------------|
| **Create MedCard** | `createMedCard` (mutation) | `POST /api/medcard` (likely) | ⚠️ PARTIAL |
| **Get Active Cards** | `getActiveMedCards` (query) | GraphQL query or REST endpoint | ⚠️ PARTIAL |
| **Relation Mapping** | relationId (1-10) | Same concept, may differ in implementation | ✅ YES |

**Impact**: **MEDIUM** - Concepts are similar, but API structure differs.

**Key Differences**:
- Old system: GraphQL-based
- New system: REST (commands) + GraphQL (queries)
- Relation IDs appear to be the same

---

### 5. Response Patterns

| Aspect | Old Architecture | New Architecture | Compatible? |
|--------|------------------|------------------|-------------|
| **Command Response** | Synchronous (immediate result) | Asynchronous (202 Accepted + eventId) | ❌ NO |
| **Query Response** | Synchronous | Synchronous | ✅ YES |
| **Error Format** | Numeric codes (2xxx, 3xxx, 5xxx, 6xx, 7xx) | HTTP status + error object | ❌ NO |
| **Success Indicator** | `isSuccess: true/false` | HTTP status code | ❌ NO |

**Impact**: **CRITICAL** - Clients expect synchronous responses, new system is async for commands.

**Example**:

**Old System (Synchronous)**:
```json
{
  "data": {
    "topupWalletUser": {
      "isSuccess": true,
      "newBalance": 1100.00
    }
  }
}
```

**New System (Asynchronous)**:
```json
HTTP 202 Accepted
{
  "eventId": "evt-456",
  "timestamp": "2025-12-17T10:00:00Z"
}
```

**Client must then query** for updated balance:
```http
GET /api/wallet/{id}/balance
```

---

### 6. Error Handling

| Error Category | Old API | New API | Compatible? |
|----------------|---------|---------|-------------|
| **Auth Errors** | 2xxx (2001, 2002, 2004) | 401 Unauthorized, 403 Forbidden | ❌ NO |
| **Param Errors** | 3xxx (3001, 3002) | 400 Bad Request | ❌ NO |
| **Operation Errors** | 5xxx (5001, 5002) | 429 Too Many Requests, 400 Bad Request | ❌ NO |
| **Gateway Errors** | 6xx (6001) | 502 Bad Gateway, 503 Service Unavailable | ❌ NO |
| **Wallet Errors** | 7xx (7001) | 422 Unprocessable Entity | ❌ NO |

**Impact**: **HIGH** - Error handling logic needs to be rewritten.

**Old Error Format**:
```json
{
  "errors": [
    {
      "code": "7001",
      "message": "insufficient funds in payer wallet"
    }
  ]
}
```

**New Error Format**:
```json
HTTP 422 Unprocessable Entity
{
  "error": "InsufficientFundsError",
  "message": "Insufficient funds in wallet",
  "details": {
    "walletId": "wallet-123",
    "requestedAmount": 100.00,
    "availableBalance": 50.00
  }
}
```

---

### 7. Architectural Paradigm

| Aspect | Old Architecture | New Architecture | Compatible? |
|--------|------------------|------------------|-------------|
| **Pattern** | Traditional CRUD | Event Sourcing + CQRS | ❌ NO |
| **State Management** | Direct database updates | Event-driven state changes | ❌ NO |
| **Consistency** | Strong (immediate) | Eventual (async projections) | ❌ NO |
| **Audit Trail** | Likely separate logging | Built-in (event store) | N/A |
| **Temporal Queries** | Not supported | Supported (replay events) | N/A |
| **Read/Write Separation** | No | Yes (CQRS) | ❌ NO |

**Impact**: **CRITICAL** - Fundamental architectural differences affect client behavior.

**Key Implications**:
- **Eventual Consistency**: Clients must handle delay between command and query
- **Async Commands**: Clients cannot rely on immediate balance updates
- **Event-Driven**: Clients should subscribe to events (WebSocket) for real-time updates

---

### 8. Real-Time Updates

| Aspect | Old Architecture | New Architecture | Compatible? |
|--------|------------------|------------------|-------------|
| **Real-time Support** | Not documented | WebSocket server (port 8080) | ❌ NO |
| **Event Subscription** | Not documented | WebSocket subscriptions | ❌ NO |
| **Push Notifications** | `notificationUrl` (webhook) | WebSocket + webhooks | ⚠️ PARTIAL |

**Impact**: **MEDIUM** - New system offers better real-time capabilities.

**New Capability**: Clients can subscribe to wallet events via WebSocket:
```javascript
ws.subscribe('wallet.credited', (event) => {
  console.log('Wallet credited:', event.data);
});
```

---

## Compatibility Matrix

| Feature | Old API | New API | Compatibility | Migration Effort |
|---------|---------|---------|---------------|------------------|
| **API Protocol** | GraphQL | REST + GraphQL | ❌ NO | HIGH |
| **Authentication** | Custom two-tier | SMS OTP + JWT | ⚠️ PARTIAL | MEDIUM |
| **Wallet Operations** | Synchronous | Asynchronous | ❌ NO | HIGH |
| **MedCard Operations** | GraphQL | REST + GraphQL | ⚠️ PARTIAL | MEDIUM |
| **Error Handling** | Numeric codes | HTTP status | ❌ NO | MEDIUM |
| **Response Format** | Immediate | Async (commands) | ❌ NO | HIGH |
| **Real-time Updates** | Webhooks | WebSocket + Webhooks | ⚠️ PARTIAL | LOW |
| **Session Management** | Token-based | JWT + Refresh | ⚠️ PARTIAL | MEDIUM |

**Overall Compatibility**: ❌ **15% Compatible** (3 out of 20 aspects)

---

## Critical Incompatibilities

### 1. Synchronous vs Asynchronous Commands ⚠️ CRITICAL

**Problem**: Old API clients expect immediate responses with updated balances. New API returns 202 Accepted with eventId.

**Impact**: 
- Clients will break if they expect immediate balance in response
- UI/UX will need to handle loading states
- Polling or WebSocket required for real-time updates

**Solution**: 
- Implement compatibility layer that polls for updated state
- Migrate clients to async pattern with WebSocket
- Provide eventual consistency guarantees (typically < 100ms)

### 2. GraphQL vs REST ⚠️ CRITICAL

**Problem**: Old API uses GraphQL exclusively. New API uses REST for commands, GraphQL/REST for queries.

**Impact**:
- All client requests need to be rewritten
- Request/response parsing logic needs to change
- Error handling needs to be rewritten

**Solution**:
- Create GraphQL adapter layer that wraps REST commands
- Provide migration guide with request mapping
- Offer dual API support during transition period

### 3. Authentication Flow ⚠️ HIGH

**Problem**: Old API has explicit merchant authentication step (`authMerchant`). New API doesn't document this.

**Impact**:
- Merchant integration flow is unclear
- API key management may differ
- Token refresh mechanism is different

**Solution**:
- Document merchant authentication in new API
- Provide API key to JWT mapping
- Implement token refresh flow

### 4. Error Code Mapping ⚠️ HIGH

**Problem**: Old API uses numeric error codes (2xxx, 3xxx, etc.). New API uses HTTP status codes.

**Impact**:
- Client error handling logic needs to be rewritten
- Error messages may differ
- Backward compatibility is not possible

**Solution**:
- Provide error code mapping table
- Implement error translation layer
- Update client error handling

---

## Migration Strategies

### Strategy 1: API Compatibility Layer (Recommended for Gradual Migration)

**Approach**: Create a compatibility layer that translates old GraphQL API to new REST/GraphQL API.

**Pros**:
- Minimal client changes
- Gradual migration
- Backward compatibility

**Cons**:
- Additional complexity
- Performance overhead
- Maintains technical debt

**Implementation**:
```
Old Client → Compatibility Layer → New API
             (GraphQL to REST)     (Event Sourcing + CQRS)
```

**Compatibility Layer Responsibilities**:
1. Translate GraphQL mutations to REST commands
2. Poll for command completion (async to sync)
3. Translate GraphQL queries to new query API
4. Map error codes (numeric to HTTP status)
5. Handle authentication token conversion

**Estimated Effort**: 3-4 weeks

### Strategy 2: Direct Client Migration (Recommended for New Clients)

**Approach**: Migrate clients directly to new API, rewriting all integration code.

**Pros**:
- Clean architecture
- Full feature access
- No technical debt

**Cons**:
- High migration effort
- Requires client code changes
- Potential downtime

**Implementation**:
```
New Client → New API
             (Event Sourcing + CQRS)
```

**Migration Steps**:
1. Update authentication flow (SMS OTP + JWT)
2. Rewrite wallet operations (async commands)
3. Implement WebSocket for real-time updates
4. Update error handling (HTTP status codes)
5. Test thoroughly in staging

**Estimated Effort**: 4-6 weeks per client

### Strategy 3: Dual API Support (Recommended for Transition Period)

**Approach**: Run both old and new APIs in parallel during transition.

**Pros**:
- Zero downtime
- Flexible migration timeline
- Fallback option

**Cons**:
- High operational complexity
- Increased infrastructure cost
- Data synchronization challenges

**Implementation**:
```
Old Client → Old API → Compatibility Layer → New Backend
New Client → New API → New Backend
```

**Estimated Effort**: 2-3 months (including sync mechanism)

---

## Recommended Migration Path

### Phase 1: API Compatibility Layer (Weeks 1-4)

**Goal**: Enable old clients to work with new backend without changes.

**Tasks**:
1. Implement GraphQL to REST adapter
2. Implement async-to-sync polling mechanism
3. Map error codes
4. Handle authentication translation
5. Test with existing clients

**Deliverables**:
- Compatibility layer service
- API mapping documentation
- Test results

### Phase 2: Client Migration Guide (Weeks 5-6)

**Goal**: Provide comprehensive guide for client migration.

**Tasks**:
1. Document new API endpoints
2. Provide request/response examples
3. Create migration checklist
4. Provide code samples (JavaScript, Python, etc.)
5. Document WebSocket integration

**Deliverables**:
- Migration guide document
- Code samples
- API reference (OpenAPI/Swagger)

### Phase 3: Gradual Client Migration (Weeks 7-16)

**Goal**: Migrate clients one by one to new API.

**Tasks**:
1. Migrate internal clients first
2. Migrate external clients with support
3. Monitor and fix issues
4. Collect feedback

**Deliverables**:
- Migrated clients
- Issue tracker
- Feedback report

### Phase 4: Deprecate Old API (Week 17+)

**Goal**: Sunset compatibility layer and old API.

**Tasks**:
1. Announce deprecation timeline
2. Ensure all clients migrated
3. Disable compatibility layer
4. Remove old API infrastructure

**Deliverables**:
- Deprecation notice
- Final migration report

---

## API Mapping Table

### Authentication

| Old API | New API | Method | Notes |
|---------|---------|--------|-------|
| `authMerchant` | TBD (needs documentation) | POST | Merchant auth flow |
| `loginUser` | `/api/auth/login` (likely) | POST | SMS OTP |
| `authUser` | `/api/auth/verify` (likely) | POST | Verify OTP |
| `logoutUser` | `/api/auth/logout` (likely) | POST | Revoke token |

### Wallet Operations

| Old API | New API | Method | Response |
|---------|---------|--------|----------|
| `topupWalletUser` | `/api/wallet/{id}/credit` | POST | 202 Accepted |
| `deductFromUser` | `/api/wallet/{id}/debit` | POST | 202 Accepted |
| `userWallet` | `/api/wallet/{id}/balance` | GET | 200 OK |
| `sendPaymentRequest` | TBD | POST | 202 Accepted |
| `payToUser` | `/api/payment/*` (likely) | POST | 202 Accepted |
| `userPaymentRequests` | `/api/wallet/{id}/payment-requests` (likely) | GET | 200 OK |
| N/A | `/api/wallet` | POST | Create wallet |
| N/A | `/api/wallet/{id}/activate` | PUT | Activate wallet |
| N/A | `/api/wallet/transfer` | POST | P2P transfer |

### MedCard Operations

| Old API | New API | Method | Response |
|---------|---------|--------|----------|
| `createMedCard` | `/api/medcard` (likely) | POST | 202 Accepted |
| `getActiveMedCards` | `/api/medcard/active` (likely) | GET | 200 OK |

---

## Recommendations

### Immediate Actions (Week 1)

1. ✅ **Document Merchant Authentication** in new API
   - Define merchant API key flow
   - Document JWT issuance for merchants
   - Provide merchant onboarding guide

2. ✅ **Create OpenAPI/Swagger Specification** for new REST API
   - Complete API reference
   - Request/response examples
   - Error code documentation

3. ✅ **Implement Compatibility Layer** (Priority: HIGH)
   - GraphQL to REST adapter
   - Async-to-sync polling
   - Error code mapping

### Short-term Actions (Weeks 2-4)

4. ✅ **Create Migration Guide**
   - Step-by-step instructions
   - Code samples (multiple languages)
   - WebSocket integration guide

5. ✅ **Set Up Dual API Environment**
   - Run old and new APIs in parallel
   - Implement data synchronization
   - Monitor both systems

6. ✅ **Communicate with Clients**
   - Announce new API
   - Provide migration timeline
   - Offer migration support

### Long-term Actions (Weeks 5-16)

7. ✅ **Migrate Clients Gradually**
   - Start with internal clients
   - Migrate external clients with support
   - Monitor and fix issues

8. ✅ **Deprecate Old API**
   - Announce deprecation date (6 months notice)
   - Ensure all clients migrated
   - Sunset compatibility layer

9. ✅ **Continuous Improvement**
   - Collect feedback
   - Improve documentation
   - Enhance API based on feedback

---

## Conclusion

The existing Postman API documentation represents a **fundamentally different architecture** from the new Event Sourcing + CQRS system. While the business logic and domain concepts are largely compatible, the **API design, response patterns, and operational semantics are incompatible**.

**Key Takeaways**:

1. **Direct compatibility is not possible** - Clients cannot use the new API without modification.

2. **A compatibility layer is recommended** - This provides a gradual migration path with minimal client disruption.

3. **Async commands are a critical change** - Clients must adapt to eventual consistency and async response patterns.

4. **Migration effort is significant** - Estimated 3-6 months for complete migration including all clients.

5. **WebSocket support is a major improvement** - New system offers better real-time capabilities.

6. **Documentation is critical** - Comprehensive API documentation and migration guide are essential for successful migration.

**Final Recommendation**: Implement a **compatibility layer** for existing clients while providing a **comprehensive migration guide** for new integrations. Run both systems in parallel for 6 months to allow gradual migration, then deprecate the old API.

---

**Status**: ⚠️ **MIGRATION REQUIRED**  
**Priority**: **HIGH**  
**Estimated Timeline**: **3-6 months**  
**Risk Level**: **MEDIUM** (with compatibility layer)
