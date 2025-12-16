# HealthPay Command Service - API Examples

## Setup

Start the service:
```bash
docker-compose up -d
```

## 1. Create Wallet

### Personal Wallet
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "walletType": "personal",
    "currency": "EGP",
    "kycLevel": "basic",
    "initialBalance": 1000
  }'
```

Response:
```json
{
  "success": true,
  "commandId": "cmd-123e4567-e89b-12d3-a456-426614174000",
  "walletId": "wallet-123e4567-e89b-12d3-a456-426614174000",
  "events": ["evt-123e4567-e89b-12d3-a456-426614174000"]
}
```

### Business Wallet
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: business-001" \
  -d '{
    "walletType": "business",
    "currency": "EGP",
    "kycLevel": "enhanced",
    "initialBalance": 50000
  }'
```

### Merchant Wallet
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: merchant-001" \
  -d '{
    "walletType": "merchant",
    "currency": "EGP",
    "kycLevel": "full",
    "initialBalance": 0
  }'
```

## 2. Activate Wallet

```bash
# Replace {walletId} with actual wallet ID from create response
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/activate \
  -H "X-User-Id: user-001"
```

Response:
```json
{
  "success": true,
  "commandId": "cmd-234e5678-e89b-12d3-a456-426614174000",
  "walletId": "wallet-123e4567-e89b-12d3-a456-426614174000",
  "events": ["evt-234e5678-e89b-12d3-a456-426614174000"]
}
```

## 3. Credit Wallet (Deposit)

```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 500,
    "transactionType": "deposit",
    "reference": "DEP-2025-001",
    "description": "Bank transfer from CIB"
  }'
```

Response:
```json
{
  "success": true,
  "commandId": "cmd-345e6789-e89b-12d3-a456-426614174000",
  "walletId": "wallet-123e4567-e89b-12d3-a456-426614174000",
  "events": ["evt-345e6789-e89b-12d3-a456-426614174000"]
}
```

## 4. Debit Wallet (Payment)

```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/debit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 250,
    "transactionType": "payment",
    "reference": "PAY-2025-001",
    "description": "Pharmacy payment - Al-Ezaby"
  }'
```

Response:
```json
{
  "success": true,
  "commandId": "cmd-456e7890-e89b-12d3-a456-426614174000",
  "walletId": "wallet-123e4567-e89b-12d3-a456-426614174000",
  "events": ["evt-456e7890-e89b-12d3-a456-426614174000"]
}
```

## 5. Transfer Between Wallets

```bash
curl -X POST http://localhost:3000/api/v2/commands/transfers \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "sourceWalletId": "wallet-source-uuid",
    "destinationWalletId": "wallet-dest-uuid",
    "amount": 300,
    "reference": "TXF-2025-001",
    "description": "P2P transfer to friend"
  }'
```

Response:
```json
{
  "success": true,
  "commandId": "cmd-567e8901-e89b-12d3-a456-426614174000",
  "aggregateId": "wallet-source-uuid",
  "events": [
    "evt-567e8901-e89b-12d3-a456-426614174000",
    "evt-678e9012-e89b-12d3-a456-426614174000"
  ]
}
```

## 6. Suspend Wallet

```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/suspend \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-001" \
  -d '{
    "reason": "Suspicious activity detected"
  }'
```

## 7. Close Wallet

```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/close \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "reason": "User requested account closure"
  }'
```

## Error Handling

### Insufficient Funds
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/debit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 99999,
    "transactionType": "payment",
    "reference": "PAY-ERROR-001"
  }'
```

Response:
```json
{
  "success": false,
  "commandId": "cmd-error-001",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient funds in wallet wallet-123",
    "details": {
      "walletId": "wallet-123",
      "required": 99999,
      "available": 1000
    }
  }
}
```

### Invalid Amount
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": -100,
    "transactionType": "deposit",
    "reference": "DEP-ERROR-001"
  }'
```

Response:
```json
{
  "success": false,
  "commandId": "cmd-error-002",
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Invalid amount: -100",
    "details": {
      "amount": -100
    }
  }
}
```

### Wallet Not Active
```bash
# Try to debit a pending wallet (before activation)
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/debit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 100,
    "transactionType": "payment",
    "reference": "PAY-ERROR-002"
  }'
```

Response:
```json
{
  "success": false,
  "commandId": "cmd-error-003",
  "error": {
    "code": "WALLET_NOT_ACTIVE",
    "message": "Wallet wallet-123 is not active (status: pending)",
    "details": {
      "walletId": "wallet-123",
      "status": "pending"
    }
  }
}
```

## Monitoring & Health

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "components": {
    "eventStore": {
      "status": "healthy",
      "connected": true
    }
  }
}
```

### Prometheus Metrics
```bash
curl http://localhost:3000/metrics
```

Response (sample):
```
# HELP healthpay_commands_total Total number of commands processed
# TYPE healthpay_commands_total counter
healthpay_commands_total{command_type="CreateWallet"} 150
healthpay_commands_total{command_type="CreditWallet"} 500
healthpay_commands_total{command_type="DebitWallet"} 450

# HELP healthpay_command_duration_seconds Command processing duration in seconds
# TYPE healthpay_command_duration_seconds histogram
healthpay_command_duration_seconds_bucket{command_type="CreateWallet",le="0.005"} 148
healthpay_command_duration_seconds_bucket{command_type="CreateWallet",le="0.01"} 150
...
```

## Complete Workflow Example

```bash
#!/bin/bash

# 1. Create wallet
WALLET_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v2/commands/wallets/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -d '{
    "walletType": "personal",
    "currency": "EGP",
    "kycLevel": "basic",
    "initialBalance": 1000
  }')

WALLET_ID=$(echo $WALLET_RESPONSE | jq -r '.walletId')
echo "Created wallet: $WALLET_ID"

# 2. Activate wallet
curl -s -X POST http://localhost:3000/api/v2/commands/wallets/$WALLET_ID/activate \
  -H "X-User-Id: test-user"

echo "Activated wallet: $WALLET_ID"

# 3. Credit wallet
curl -s -X POST http://localhost:3000/api/v2/commands/wallets/$WALLET_ID/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -d '{
    "amount": 500,
    "transactionType": "deposit",
    "reference": "DEP-TEST-001",
    "description": "Test deposit"
  }'

echo "Credited wallet: $WALLET_ID"

# 4. Debit wallet
curl -s -X POST http://localhost:3000/api/v2/commands/wallets/$WALLET_ID/debit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -d '{
    "amount": 200,
    "transactionType": "payment",
    "reference": "PAY-TEST-001",
    "description": "Test payment"
  }'

echo "Debited wallet: $WALLET_ID"
echo "Workflow complete!"
```

## Testing with Different Scenarios

### High-Value Transaction (Merchant)
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{merchantWalletId}/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: merchant-001" \
  -d '{
    "amount": 50000,
    "transactionType": "deposit",
    "reference": "SETTLEMENT-2025-001",
    "description": "Daily settlement - 1000 transactions"
  }'
```

### Refund Transaction
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 150,
    "transactionType": "refund",
    "reference": "REFUND-2025-001",
    "description": "Refund for cancelled order",
    "sourceWalletId": "merchant-wallet-uuid"
  }'
```

### Cashback
```bash
curl -X POST http://localhost:3000/api/v2/commands/wallets/{walletId}/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-001" \
  -d '{
    "amount": 25,
    "transactionType": "cashback",
    "reference": "CASHBACK-2025-001",
    "description": "2% cashback on pharmacy purchase"
  }'
```
