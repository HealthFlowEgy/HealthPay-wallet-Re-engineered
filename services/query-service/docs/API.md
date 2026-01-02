# HealthPay Ledger V2 - API Documentation
## Sprint 4 Complete API Reference

**Version:** 2.0  
**Last Updated:** December 16, 2024

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [GraphQL API](#graphql-api)
4. [REST API](#rest-api)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Overview

HealthPay Ledger V2 provides both GraphQL and REST APIs:

- **GraphQL**: `POST /graphql` - Recommended for new integrations
- **REST**: `/api/v1/*` - Backward compatibility

**Base URL**: `https://api.healthpay.tech`

---

## Authentication

All API requests require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

### Obtaining a Token

```bash
POST /auth/login
Content-Type: application/json

{
  "phone_number": "+201234567890",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

---

## GraphQL API

### Create MedCard

```graphql
mutation CreateMedCard {
  createMedCard(input: {
    userId: "user-123"
    cardType: GOLD
    monthlyLimit: 5000.00
    copaymentPercentage: 20.0
    primaryHolder: {
      nationalId: "12345678901234"
      name: "Ahmed Mohamed"
      dateOfBirth: "1990-01-15"
      phoneNumber: "+201234567890"
    }
    expiryDate: "2026-12-31"
  }) {
    success
    medCardId
    message
  }
}
```

### Claim Prescription

```graphql
mutation ClaimPrescription {
  claimPrescription(input: {
    medCardId: "medcard-456"
    prescriptionId: "rx-789"
    pharmacyId: "pharmacy-101"
    beneficiaryId: "user-123"
    totalAmount: 350.00
    items: [{
      drugCode: "DRUG001"
      drugName: "Panadol Extra"
      quantity: 20
      unitPrice: 10.00
      totalPrice: 200.00
    }]
  }) {
    success
    message
  }
}
```

---

## REST API

### Create MedCard

```bash
POST /api/v1/medcards
Content-Type: application/json

{
  "userId": "user-123",
  "cardType": "gold",
  "monthlyLimit": 5000.00,
  "primaryHolder": {
    "nationalId": "12345678901234",
    "name": "Ahmed Mohamed"
  }
}
```

### Claim Prescription

```bash
POST /api/v1/medcards/:id/claims/prescriptions

{
  "prescriptionId": "rx-789",
  "pharmacyId": "pharmacy-101",
  "totalAmount": 350.00,
  "items": [...]
}
```

---

## Error Handling

```json
{
  "error": {
    "code": "INSUFFICIENT_LIMIT",
    "message": "Exceeds monthly limit"
  }
}
```

---

**For complete documentation, visit**: https://docs.healthpay.tech
