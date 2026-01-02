# HealthPay Flutter Mobile App

A comprehensive digital wallet mobile application for healthcare payments, built with Flutter.

## 🚀 Features

### Authentication
- Phone-based OTP login (Cequens SMS gateway)
- 4-digit PIN security with lockout protection
- Biometric authentication (Touch ID / Face ID)
- Session management with auto-logout

### Dashboard
- Real-time wallet balance display
- Daily spending limit visualization
- Quick action buttons (Transfer, Top-up, Bills, QR)
- Recent transactions list

### Money Transfer
- P2P transfers to other HealthPay users
- Real-time recipient validation
- PIN confirmation for security
- Transfer history and receipts

### Wallet Top-Up
- Multiple payment methods:
  - Bank Card (Visa/Mastercard)
  - Fawry
  - Vodafone Cash
  - InstaPay
- Quick amount selection
- Transaction confirmation

### Bill Payments
- 9 categories (Electricity, Water, Gas, etc.)
- Egyptian utility providers
- Bill inquiry before payment
- Saved billers for quick access

### Medical Card
- Virtual card display with QR code
- Card balance and limits
- For scanning at healthcare providers

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Flutter 3.16+ |
| Language | Dart 3.2+ |
| State Management | flutter_bloc 8.1+ |
| Navigation | go_router 12.0+ |
| DI | get_it 7.6+ |
| API | graphql_flutter 5.1+ |
| Storage | flutter_secure_storage, hive |
| Auth | local_auth (biometric) |

## 📁 Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # MaterialApp configuration
├── injection_container.dart  # Dependency injection
│
├── core/
│   ├── constants/           # App, API, Route constants
│   ├── errors/              # Exceptions & Failures
│   ├── network/             # GraphQL client, Storage
│   ├── theme/               # Colors, Typography, Theme
│   ├── utils/               # Validators, Formatters, Helpers
│   ├── widgets/             # Reusable UI components
│   └── router/              # GoRouter configuration
│
├── features/
│   ├── auth/                # Authentication flow
│   ├── dashboard/           # Home screen
│   ├── transfer/            # P2P transfers
│   ├── topup/               # Wallet top-up
│   ├── bills/               # Bill payments
│   ├── transactions/        # Transaction history
│   ├── profile/             # User profile
│   ├── settings/            # App settings
│   └── medical_card/        # Medical card
│
└── l10n/                    # Localization (ar, en)
```

## 🚀 Getting Started

### Prerequisites
- Flutter 3.16+
- Dart 3.2+
- Android Studio / Xcode

### Installation

```bash
# Clone or extract the project
cd healthpay_flutter

# Install dependencies
flutter pub get

# Run on device/simulator
flutter run
```

### Build

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## 🔧 Configuration

### Environment Variables

Create `lib/config/env.dart`:

```dart
class Env {
  static const String apiUrl = 'http://104.248.245.150:4000/graphql';
  static const String wsUrl = 'ws://104.248.245.150:4001';
}
```

### API Configuration

The app connects to the HealthPay GraphQL API. Update the base URL in:
`lib/core/constants/api_constants.dart`

## 📱 Supported Platforms

- iOS 12.0+
- Android 5.0+ (API 21)

## 🎨 Design

- **Primary Color**: Teal (#0D9488)
- **Font**: Cairo (Arabic-optimized)
- **RTL Support**: Full Arabic/English

## 📋 Test Credentials

| Field | Value |
|-------|-------|
| Phone | `01016464676` |
| OTP | Sent via Cequens SMS |
| PIN | Any 4 digits |

## 🔐 Security Features

- **Token Storage:** Encrypted with flutter_secure_storage
- **PIN Security:** 4-digit PIN with 3 max attempts, 5-minute lockout
- **Biometric Auth:** Face ID / Fingerprint support
- **Session Management:** Auto-logout after inactivity
- **Certificate Pinning:** For production builds

## 🚀 Deployment

### Android (Play Store)

```bash
# Generate signed APK
flutter build apk --release --dart-define=ENVIRONMENT=production

# Generate App Bundle
flutter build appbundle --release --dart-define=ENVIRONMENT=production
```

### iOS (App Store)

```bash
# Build for release
flutter build ios --release --dart-define=ENVIRONMENT=production

# Open in Xcode for archive
open ios/Runner.xcworkspace
```

## 🔥 Firebase Setup

1. Create Firebase project
2. Add Android app with package name `tech.healthpay.wallet`
3. Add iOS app with bundle ID `tech.healthpay.wallet`
4. Download config files:
   - `android/app/google-services.json`
   - `ios/Runner/GoogleService-Info.plist`

## 📄 License

© 2026 HealthPay. All rights reserved.
