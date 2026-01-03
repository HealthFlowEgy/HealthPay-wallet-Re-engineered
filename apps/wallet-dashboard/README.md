# HealthPay Wallet Dashboard

A modern, mobile-first digital wallet application built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication**: Phone-based OTP login with PIN security
- **Dashboard**: Wallet balance, quick actions, transaction history
- **Transfers**: Send money to other users with PIN verification
- **Top-Up**: Multiple payment methods (Card, Fawry, Vodafone Cash, InstaPay)
- **Bill Payments**: 9+ categories, saved billers, payment history
- **Medical Card**: Virtual card with QR code, beneficiaries management
- **i18n**: Full Arabic and English support with RTL
- **PWA Ready**: Installable on mobile devices

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Apollo Client | 3.x | GraphQL data layer |
| next-intl | 3.x | Internationalization |

## 📁 Project Structure

```
wallet-dashboard/
├── src/
│   ├── app/
│   │   └── [locale]/          # Locale-based routing
│   │       ├── auth/          # Login, OTP, Register
│   │       ├── dashboard/     # Main dashboard
│   │       ├── transactions/  # Transaction history
│   │       ├── transfer/      # Send money
│   │       ├── topup/         # Wallet top-up
│   │       ├── bills/         # Bill payments
│   │       ├── profile/       # User profile
│   │       ├── settings/      # App settings
│   │       ├── notifications/ # Notifications
│   │       ├── medcard/       # Medical card
│   │       └── help/          # Help & FAQ
│   ├── components/
│   │   ├── ui/               # Reusable components
│   │   ├── modals/           # Modal dialogs
│   │   └── layouts/          # Layout components
│   ├── lib/
│   │   ├── graphql/          # Apollo client & queries
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Utility functions
│   ├── contexts/             # React contexts (Auth, Toast)
│   └── types/                # TypeScript definitions
├── public/
│   └── locales/              # Translation files (ar.json, en.json)
└── ...config files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or 20.x LTS
- npm or yarn

### Installation

```bash
# Clone or extract the project
cd wallet-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
npm run start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | GraphQL API endpoint | `http://104.248.245.150:4000/graphql` |
| `NEXT_PUBLIC_WS_URL` | WebSocket endpoint | `ws://104.248.245.150:4001` |

### API Integration

The app connects to the HealthPay GraphQL API. Available operations:

**Authentication:**
- `sendOTP(input: { phoneNumber })` - Send OTP to phone
- `verifyOTP(input: { phoneNumber, otp })` - Verify OTP and login
- `setPin(phoneNumber, pin)` - Set transaction PIN

**Wallet:**
- `wallet(id)` - Get wallet balance
- `transactionsByWallet(walletId, limit)` - Get transactions
- `topUpWallet(walletId, amount, method)` - Top up wallet
- `transferMoney(input)` - Transfer to another user

**Bills:**
- `billCategories` - Get bill categories
- `inquireBill(billerId, accountNumber)` - Inquire bill
- `payBill(input)` - Pay bill

## 📱 Deployment

### PM2 (Recommended)

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "healthpay-wallet" -- start

# Save PM2 configuration
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name wallet.healthpay.eg;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎨 Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (Teal) | `#14B8A6` | Main actions, highlights |
| Success (Green) | `#22C55E` | Credits, success states |
| Warning (Amber) | `#F59E0B` | Pending, warnings |
| Danger (Red) | `#EF4444` | Debits, errors |

### Components

- `Button` - Primary, Secondary, Outline, Ghost, Danger variants
- `Card` - Default, Elevated, Gradient variants
- `Input` - Text, Phone, OTP, Amount, PIN inputs
- `Modal` - Standard, Confirm, Success, PIN modals
- `Badge` - Status indicators
- `Toast` - Notification popups

## 📋 Test Credentials

For development testing:

| Field | Value |
|-------|-------|
| Phone | Any valid Egyptian format (01XXXXXXXXX) |
| OTP | `123456` (dev mode) |
| PIN | Any 4 digits |

## 📄 License

© 2026 HealthPay. All rights reserved.
