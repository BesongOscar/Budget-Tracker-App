# Budget Tracker

A mobile-first personal finance app for tracking income, expenses, and monthly budgets. Built with Expo (React Native) and NestJS.

## Features

- **Transaction tracking** — Log income and expenses with categories
- **Budget management** — Income-first budgeting: monthly overview, allocate funds from income to expense categories, track spending vs allocation, copy a month forward
- **Push notifications** — Alerts when a budget crosses 80% or 100% of its allocation, and on over-allocation
- **Analytics** — Visualize spending trends over time
- **Email authentication** — Register, login, email verification, password reset

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router |
| Backend | NestJS 11, Prisma ORM, PostgreSQL |
| State | Zustand (client), TanStack React Query (server) |
| Auth | JWT access/refresh tokens, bcrypt, Nodemailer |

## Project Structure

```
Budget_Tracker_app/
├── apps/
│   ├── api/              # NestJS backend — see apps/api/README.md
│   └── mobile/           # Expo mobile app — see apps/mobile/README.md
├── shared/
│   └── types.ts          # Shared TypeScript interfaces
├── docs/                 # Documentation
│   ├── SPRINT_1.md       # Sprint 1 deliverables
│   ├── SPRINT_2.md       # Sprint 2 deliverables
│   ├── SPRINT_3.md       # Sprint 3 deliverables
│   ├── API_REFERENCE.md  # API endpoint reference
│   ├── ARCHITECTURE.md   # System architecture & design decisions
│   └── CONTRIBUTING.md   # Contribution guide
└── DECISIONS.md          # Architecture decision log
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`) or use `npx`
- Expo Go app (for testing on physical device) or Android/iOS simulator

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Budget_Tracker_app
```

### 2. Set up the backend

```bash
cd apps/api
npm install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SMTP credentials

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start the API server
npm run start:dev
```

API runs at `http://localhost:3000/api/v1`.

### 3. Set up the mobile app

```bash
cd ../mobile
npm install

# Configure environment
# Create .env and set EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Start Expo
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Access token signing secret |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `PORT` | No | `3000` | Server port |
| `SMTP_HOST` | Yes | — | SMTP hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | Yes | — | SMTP username |
| `SMTP_PASS` | Yes | — | SMTP password |

### Mobile (`apps/mobile/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3000/api/v1` | Backend API URL |

## Documentation

- [API Reference](docs/API_REFERENCE.md) — All endpoints with request/response formats
- [Architecture](docs/ARCHITECTURE.md) — System design, auth flows, state management
- [Sprint 1](docs/SPRINT_1.md) — Foundation & authentication deliverables
- [Sprint 2](docs/SPRINT_2.md) — Categories, transactions & budget context deliverables
- [Sprint 3](docs/SPRINT_3.md) — Budgets & push notifications deliverables
- [Contributing](docs/CONTRIBUTING.md) — Development workflow and conventions
- [Decisions](DECISIONS.md) — Architecture decision log

## Current Status

**Sprint 3 in progress** — Backend (budget CRUD + copy-period + allocation summary, push notifications via Expo, push-token endpoints) and mobile (budget overview/detail/set-budget UI, push-notification registration) are implemented and typechecked. Phase 5 — real-device EAS build verification of the push flow (requires Firebase/FCM setup) — is pending.

**Sprint 2 complete** — Categories and Transactions CRUD (backend + mobile) with type enforcement, user-scoped data isolation via a global JWT guard, budget spend synchronization, and a budget context card in the add-transaction screen.

See [docs/SPRINT_1.md](docs/SPRINT_1.md), [docs/SPRINT_2.md](docs/SPRINT_2.md), and [docs/SPRINT_3.md](docs/SPRINT_3.md) for sprint deliverables.

## License

Private — All rights reserved.
