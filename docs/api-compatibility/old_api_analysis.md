# Old HealthPay API Documentation Analysis

**Source**: https://documenter.getpostman.com/view/22876315/2sA3QmEv3i

## API Overview

**Base URL**: `https://sword.back.healthpay.tech/graphql`  
**Type**: GraphQL API  
**Authentication**: Bearer Token + Custom Headers

## API Endpoints (13 Total)

### Authentication Endpoints (3)

1. **authMerchant** (POST)
   - Purpose: Merchant authentication (first step)
   - Headers: `api-header`
   - Input: `apiKey`
   - Output: `token`
   - Note: First API call, no Authorization header required

2. **loginUser** (POST)
   - Purpose: User/provider login (first step, SMS OTP)
   - Description: Sends SMS with one-time password
   - Headers: `api-header`, `Authorization: Bearer <token>`

3. **authUser** (POST)
   - Purpose: User/provider authentication (second step)
   - Description: Verify OTP and get userToken
   - Headers: `api-header`, `Authorization: Bearer <token>`

### Wallet Operations (5)

4. **topupWalletUser** (POST)
   - Purpose: Add amount to user/provider wallet
   - Merchant permission: add `amount`

5. **deductFromUser** (POST)
   - Purpose: Deduct amount from user/provider wallet
   - Merchant permission: deduct `amount`

6. **sendPaymentRequest** (POST)
   - Purpose: Send payment request to user/provider

7. **payToUser** (POST)
   - Purpose: Pay to user/provider

8. **userWallet** (POST)
   - Purpose: View total wallet balance
   - User permission: view balance

9. **userPaymentRequests** (POST)
   - Purpose: Get all payment requests sent to user/provider
   - Returns: id, amount, status, createdAt

### MedCard Operations (2)

10. **createMedCard** (POST)
    - Purpose: Create medical card for user and/or relatives
    - Input: mobile, fullName, nationalId, birthDate, gender, relationId
    - Relations: Father(1), Mother(2), Brother(3), Sister(4), Son(5), Daughter(6), Husband(7), Wife(8), Grandfather(9), Grandmother(10), self(default)
    - Output: uid, nameOnCard

11. **getActiveMedCards** (POST)
    - Purpose: Get all active med cards related to merchant
    - Output: nameOnCard, uid, isActive, birthDate, user{uid, mobile}

### Session Management (1)

12. **logoutUser** (POST)
    - Purpose: Clears userToken and logout user from merchant
    - Output: isSuccess

### Webhook (1)

13. **notificationUrl** (GET)
    - Purpose: Webhook notification endpoint

## Authentication Flow

### Two-Step Authentication

**Step 1: Merchant Authentication**
```graphql
mutation authMerchant($apiKey: String!) {
  authMerchant(apiKey: $apiKey) {
    token
  }
}
```

**Step 2: User/Provider Authentication**
```
loginUser (SMS OTP) → authUser (verify OTP) → get userToken
```

## Authentication Headers

| Header | Used In | Value |
|--------|---------|-------|
| `api-header` | All requests | `H_0003rjeb7ke0dejn` (example) |
| `Authorization` | All except authMerchant | `Bearer <token>` |

## Token Types

| Token | Purpose | Lifespan |
|-------|---------|----------|
| `apiKey` | Merchant identification | Static |
| `token` | Merchant API access | Long-lasting JWT |
| `userToken` | User/provider session | Long-lasting JWT |

## Permissions Model

### Merchant Permissions
- Create/authenticate users and providers
- Deduct amount from authenticated users/providers
- Add amount to authenticated users/providers

### User/Provider Permissions
- View total wallet balance
- View last 10 logs
- Recharge wallet using designated methods

## Error Codes

### 2xxx - Invalid Authentication Headers
- `2001`: header: api-header is required
- `2002`: header: api-header is invalid
- `2004`: header: authorization is invalid

### 3xxx - Invalid Authentication Params
- `3001`: param: apiKey is invalid
- `3002`: param: userToken is invalid

### 5xxx - Invalid Operation
- `5001`: too many login otp sent. Please wait for 1 hour
- `5002`: invalid user otp

### 6xx - Unprocessed Operation
- `6001`: payment gateway unprocessed operation, Please try again

### 7xx - Invalid Wallet Operations
- `7001`: insufficient funds in payer wallet

## Definitions

**merchant**: Platforms that consume HealthPay APIs, have own providers/users

**provider**: Single person providing service/product at merchant's platform, user with extra permissions

**user**: Platform's end-user who uses wallet to pay for services

## Key Characteristics

1. **GraphQL-based**: All endpoints use GraphQL (mutations and queries)
2. **Merchant-centric**: Designed for merchants to manage their users
3. **Two-tier authentication**: Merchant auth + User auth
4. **Long-lasting tokens**: JWT tokens are long-lasting
5. **Custom headers**: Uses custom `api-header` for merchant identification
6. **SMS OTP**: Uses SMS for user authentication
7. **Wallet-focused**: Primary focus on wallet operations (topup, deduct, pay)
8. **MedCard support**: Healthcare-specific medical card management
9. **Payment requests**: Support for payment request flow
10. **Synchronous**: All operations appear to be synchronous

## Architecture Characteristics (Old System)

- **API Style**: GraphQL (single endpoint)
- **Authentication**: Custom two-tier (merchant + user)
- **State Management**: Likely traditional CRUD
- **Response Model**: Synchronous, immediate responses
- **Error Handling**: Numeric error codes
- **Wallet Operations**: Direct balance modification
- **Session Management**: Token-based, logout clears token
