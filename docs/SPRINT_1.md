# Sprint 1 — Foundation & Authentication

**Period:** June 14 – July 22, 2025
**Status:** Complete

---

## Overview

Sprint 1 established the full project foundation: monorepo structure, database schema, complete authentication system (backend + frontend), navigation architecture, and core UI scaffolding. The app is now in a state where a user can register, verify their email, log in, and navigate the protected tab structure.

---

## Deliverables

### Project Structure

```
Budget_Tracker_app/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 7 models, 3 migrations
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/                 # Auth module (controller, service, DTOs, guards, strategy)
│   │       ├── common/               # Decorators, filters, interceptors
│   │       ├── email/                # Nodemailer service
│   │       └── prisma/               # Prisma service
│   └── mobile/                       # Expo React Native
│       ├── app/
│       │   ├── (auth)/               # Auth flow screens
│       │   └── (protected)/          # Tab-based authenticated area
│       └── src/
│           ├── api/                  # Axios client + API functions
│           ├── Components/           # Reusable UI components
│           ├── constants/            # Theme, config
│           ├── hooks/                # useAuth, useColorScheme
│           ├── store/                # Zustand auth store
│           └── utils/                # QueryClient, persister
├── shared/types.ts                   # Shared TypeScript interfaces
└── docs/
```

### Database Schema (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Email, password hash, full name, currency code, push token, email verification |
| `RefreshToken` | JWT refresh tokens with expiry |
| `Category` | User-defined categories (INCOME/EXPENSE), icon, color |
| `Transaction` | Amount, description, date, type, linked to category |
| `Budget` | Monthly spending limits per category |
| `VerificationToken` | 6-digit email verification codes (10 min expiry) |
| `PasswordResetToken` | 6-digit password reset codes (10 min expiry) |

### Backend API (NestJS)

**8 Authentication Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account, seed default categories, send verification email |
| POST | `/api/v1/auth/login` | Login, return JWT pair |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Delete refresh token |
| POST | `/api/v1/auth/verify-email` | Verify 6-digit email code |
| POST | `/api/v1/auth/resend-verification` | Resend verification code |
| POST | `/api/v1/auth/forgot-password` | Send password reset code |
| POST | `/api/v1/auth/reset-password` | Reset password with code |

**Infrastructure:** Rate limiting (5 req/min), ValidationPipe, response wrapper, exception filter, CORS.

### Mobile App (Expo)

**Auth Screens:**
- Onboarding (3-slide animated carousel with Reanimated)
- Login (Formik form, show/hide password, error banners)
- Register (3-step flow: form → email verification → success modal)
- Forgot Password (email input, success state)
- Reset Password (6-digit code + new password, auto-redirect)

**Protected Area:**
- Tab navigator with custom tab bar + center FAB
- Routes: Home, Transactions, Budgets, Profile
- Auth-based redirect in root layout

**State Management:**
- Zustand for auth state
- TanStack React Query with AsyncStorage persistence

**API Layer:**
- Axios with request/response interceptors
- Automatic token refresh on 401

---

## What's NOT Done (Sprint 2+)

Placeholder screens (text only):
- Dashboard, Analytics, Transactions list/detail
- Budgets list/detail, Profile, Categories
- Settings, Insights, Add Transaction modal, Set Budget modal

---

## Default Categories (Seeded on Registration)

| Name | Icon | Color | Type |
|------|------|-------|------|
| Salary | 💼 | #34C759 | INCOME |
| Freelance | 💻 | #007AFF | INCOME |
| Other Income | 💰 | #FF9500 | INCOME |
| Food & Drinks | 🍕 | #FF3B30 | EXPENSE |
| Transport | 🚗 | #5856D6 | EXPENSE |
| Shopping | 🛍️ | #FF2D55 | EXPENSE |
