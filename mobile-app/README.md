# HealthPay Wallet - Flutter Mobile Application

## Overview

This directory contains the Flutter mobile application for HealthPay Wallet, providing a unified mobile experience for Customers, Admins, and Merchants.

## Features

### Customer Portal
- OTP Authentication with Biometric Login
- Wallet Dashboard with Real-time Balance
- Send Money & Receive Money (QR Code)
- Top-up Wallet
- Transaction History
- KYC Document Upload
- Settings & Profile Management

### Admin Portal
- Email/Password Authentication
- System Dashboard with Analytics
- User Management
- Merchant Management
- Transaction Monitoring
- KYC Approval Workflow
- Withdrawal Approval

### Merchant Portal
- Merchant ID Authentication
- Sales Dashboard
- Accept Payments via QR Code
- Request Withdrawals
- Transaction History
- Business Settings

## Tech Stack

- **Framework:** Flutter (Dart)
- **State Management:** BLoC Pattern
- **API Client:** GraphQL (graphql_flutter)
- **Secure Storage:** flutter_secure_storage
- **Navigation:** go_router
- **Localization:** English + Arabic (RTL support)

## Quick Start

```bash
# Install dependencies
flutter pub get

# Generate code
dart run build_runner build --delete-conflicting-outputs

# Run the app
flutter run
```

## API Integration

The app connects to the HealthPay GraphQL API at:
- **Production:** http://104.248.245.150/graphql
- **WebSocket:** ws://104.248.245.150/graphql

## Build APK

See [BUILD-APK.md](BUILD-APK.md) for detailed instructions on building release APKs.

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # App configuration
├── config.dart               # Environment configuration
├── injection.dart            # Dependency injection
├── network.dart              # GraphQL client setup
├── services.dart             # Business logic services
├── utils.dart                # Utility functions
├── models.dart               # Data models
├── repositories.dart         # Data repositories
├── queries.dart              # GraphQL queries
├── mutations.dart            # GraphQL mutations
├── subscriptions.dart        # GraphQL subscriptions
├── auth_bloc.dart            # Authentication BLoC
├── wallet_bloc.dart          # Wallet BLoC
├── app_router.dart           # Navigation routing
├── app_localizations.dart    # Internationalization
├── auth_pages.dart           # Authentication screens
├── customer_pages.dart       # Customer portal screens
├── admin_pages.dart          # Admin portal screens
├── merchant_pages.dart       # Merchant portal screens
├── widgets.dart              # Reusable widgets
└── wallet_widgets.dart       # Wallet-specific widgets
```

## Documentation

- [SRS Document](../docs/flutter_app_srs.md) - Software Requirements Specification
- [BUILD-APK.md](BUILD-APK.md) - Build instructions

## License

Proprietary - HealthFlow Group
