# HealthPay OneLink Top-Up Integration

Wallet top-up service integrating OneLink payment iframe with the HealthPay API using the new authentication flow.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Top-Up API    │     │   HealthPay     │
│   Widget        │────▶│   Service       │────▶│   GraphQL API   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   OneLink       │
                        │   Payment       │
                        └─────────────────┘
```

## 🔐 Authentication Flow

```
1. Merchant Auth (Server-side, once)
   ├── POST /graphql
   │   mutation authMerchant($apiKey)
   └── Returns: merchantToken (JWT)

2. User Auth (Per user session)
   ├── loginUser(mobile) → sends OTP
   └── authUser(mobile, otp) → returns userToken

3. All subsequent calls require:
   ├── Header: api-header: H_xxxxx
   └── Header: Authorization: Bearer {merchantToken}
```

## 📁 Project Structure

```
healthpay-onelink-topup/
├── src/
│   ├── server.js                    # Express server (JavaScript)
│   └── healthpay-onelink.service.ts # TypeScript service module
├── public/
│   └── healthpay-topup-widget.js    # Embeddable frontend widget
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# HealthPay API
HEALTHPAY_API_HEADER=H_0003rjeb7ke0dejn
HEALTHPAY_API_KEY=your_api_key

# OneLink
ONELINK_MERCHANT_ID=your_merchant_id
ONELINK_TERMINAL_ID=your_terminal_id
ONELINK_SECRET_KEY=your_secret_key
ONELINK_CALLBACK_URL=https://yourdomain.com/api/onelink/callback

# Server
PORT=3000
```

### 3. Start Server

```bash
npm start
# or for development
npm run dev
```

## 🔌 API Endpoints

### Authentication

#### POST /api/auth/login
Send OTP to user's mobile number.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+201012345678"}'
```

#### POST /api/auth/verify
Verify OTP and get userToken.

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+201012345678", "otp": "123456"}'
```

Response:
```json
{
  "authUser": {
    "userToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "uid": "user_123",
      "mobile": "+201012345678",
      "fullName": "Ahmed Mohamed"
    }
  }
}
```

### Wallet

#### GET /api/wallet/balance
Get user's wallet balance.

```bash
curl http://localhost:3000/api/wallet/balance \
  -H "x-user-token: USER_TOKEN_HERE"
```

Response:
```json
{
  "userWallet": {
    "total": 1500.00,
    "balance": [
      {
        "uid": "txn_123",
        "amount": 500,
        "type": "TOPUP",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Top-Up

#### POST /api/topup/initiate
Initiate a top-up transaction.

```bash
curl -X POST http://localhost:3000/api/topup/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "userToken": "USER_TOKEN_HERE",
    "amount": 100,
    "customerName": "Ahmed Mohamed",
    "customerPhone": "+201012345678"
  }'
```

Response:
```json
{
  "success": true,
  "orderId": "TOPUP-1705312200000-A1B2C3D4",
  "iframeUrl": "https://checkout.onelink.eg/iframe?...",
  "amount": 100,
  "currency": "EGP"
}
```

#### GET /api/topup/iframe/:orderId
Get HTML page with embedded OneLink iframe.

```
http://localhost:3000/api/topup/iframe/TOPUP-1705312200000-A1B2C3D4
```

#### GET /api/topup/status/:orderId
Check transaction status.

```bash
curl http://localhost:3000/api/topup/status/TOPUP-1705312200000-A1B2C3D4
```

Response:
```json
{
  "orderId": "TOPUP-1705312200000-A1B2C3D4",
  "status": "completed",
  "amount": 100,
  "currency": "EGP",
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:35:00Z",
  "transactionId": "hp_txn_456"
}
```

### OneLink Callback

#### POST /api/onelink/callback
Webhook endpoint for OneLink payment notifications.

This is called automatically by OneLink when payment is completed.

## 🎨 Frontend Widget

### Embed in Your Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Wallet Top-Up</title>
</head>
<body>
  <!-- Widget container -->
  <div id="healthpay-topup-widget"></div>

  <!-- Load widget script -->
  <script src="https://your-api.com/healthpay-topup-widget.js"></script>
  
  <script>
    // Initialize widget
    HealthPayTopup.init({
      container: '#healthpay-topup-widget',
      apiUrl: 'https://your-api.com',
      userToken: 'USER_TOKEN_HERE',
      
      // Optional: Custom amounts
      amounts: [50, 100, 200, 500, 1000],
      
      // Optional: Custom theme
      theme: {
        primary: '#2e7d32',
        primaryDark: '#1a5f2a',
      },
      
      // Callbacks
      onSuccess: function(result) {
        console.log('Payment successful!', result);
        alert('Wallet credited with ' + result.amount + ' EGP');
      },
      
      onError: function(error) {
        console.error('Payment failed:', error);
        alert('Payment failed: ' + error.message);
      },
      
      onCancel: function() {
        console.log('Payment cancelled');
      }
    });
  </script>
</body>
</html>
```

### Widget Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `container` | string | Yes | CSS selector for widget container |
| `apiUrl` | string | Yes | Top-up API base URL |
| `userToken` | string | Yes | HealthPay user token |
| `amounts` | number[] | No | Quick amount buttons (default: [50, 100, 200, 500, 1000, 2000]) |
| `currency` | string | No | Currency code (default: "EGP") |
| `theme` | object | No | Custom colors |
| `onSuccess` | function | No | Success callback |
| `onError` | function | No | Error callback |
| `onCancel` | function | No | Cancel callback |

## 🔧 TypeScript Integration

Import the service module into your existing NestJS/Express backend:

```typescript
import { HealthPayOneLink } from './healthpay-onelink.service';

// Initialize
const onelink = new HealthPayOneLink({
  healthpay: {
    apiHeader: 'H_0003rjeb7ke0dejn',
    apiKey: 'your_api_key',
  },
  onelink: {
    merchantId: 'your_merchant_id',
    terminalId: 'your_terminal_id',
    secretKey: 'your_secret_key',
    callbackUrl: 'https://yourdomain.com/api/onelink/callback',
  },
});

// Initialize (authenticate merchant)
await onelink.initialize();

// Initiate top-up
const result = await onelink.initiateTopup({
  userToken: 'user_token_here',
  amount: 100,
  customerName: 'Ahmed',
  customerPhone: '+201012345678',
});

console.log(result.iframeUrl);
console.log(result.iframeHtml);  // Ready-to-use HTML

// Process callback (in your webhook handler)
const topupResult = await onelink.processCallback({
  order_id: 'TOPUP-xxx',
  transaction_id: 'onelink_txn_123',
  status: 'success',
  amount: '100.00',
  signature: 'xxx',
});
```

## 📋 Complete Flow Example

### 1. User Login
```javascript
// Send OTP
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile: '+201012345678' })
});

// Verify OTP
const authResponse = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile: '+201012345678', otp: '123456' })
});

const { authUser } = await authResponse.json();
const userToken = authUser.userToken;
```

### 2. Check Balance
```javascript
const balanceResponse = await fetch('/api/wallet/balance', {
  headers: { 'x-user-token': userToken }
});

const { userWallet } = await balanceResponse.json();
console.log('Balance:', userWallet.total, 'EGP');
```

### 3. Initiate Top-Up
```javascript
const topupResponse = await fetch('/api/topup/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userToken: userToken,
    amount: 100
  })
});

const { iframeUrl, orderId } = await topupResponse.json();

// Open iframe or redirect
window.open(iframeUrl, 'payment', 'width=500,height=600');
```

### 4. Handle Callback (Server-side)
```javascript
app.post('/api/onelink/callback', async (req, res) => {
  const { order_id, status, amount } = req.body;
  
  if (status === 'success') {
    // Wallet is automatically credited by the service
    console.log('Payment successful for order:', order_id);
  }
  
  res.json({ success: true });
});
```

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| 2001 | api-header is required |
| 2002 | api-header is invalid |
| 2004 | Authorization header is invalid |
| 3001 | apiKey is invalid |
| 3002 | userToken is invalid |
| 5001 | Too many OTPs sent (wait 1 hour) |
| 5002 | Invalid OTP |
| 6001 | Payment gateway error |
| 7001 | Insufficient funds |

## 🔒 Security Notes

1. **Never expose** `apiKey` or `merchantToken` to frontend
2. Store `userToken` securely (httpOnly cookies recommended)
3. Verify OneLink signatures in production
4. Use HTTPS in production
5. Implement rate limiting

## 📝 License

MIT
