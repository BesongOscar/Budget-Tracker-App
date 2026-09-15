# Budget Tracker

A mobile-first personal finance app for tracking income, expenses, and monthly budgets. Built with Expo (React Native) and NestJS.

## Features

- **Transaction tracking** — Log income and expenses with categories
- **Budget management** — Income-first budgeting: monthly overview, allocate funds from income to expense categories, track spending vs allocation, copy a month forward
- **Push notifications** — Alerts when a budget crosses 80% or 100% of its allocation, and on over-allocation
- **Analytics** — Donut chart by expense category, daily spending bar chart, monthly trends, period comparison
- **Dashboard** — Income-first dashboard with balance hero, income/allocated/spent summary, budget progress bars, recent transactions
- **Insights** — Budget alerts with severity colors (80% threshold, over-budget, over-allocation)
- **Email authentication** — Register, login, email verification, password reset
- **Offline-first** — Saved data reads from cache while offline; every transaction/category/budget/profile write is queued and auto-synced on reconnect
- **Reactive currency** — Currency format updates across every screen the moment you change it in Settings
- **Profile & Settings** — Edit your name, pick a currency, manage push notifications, and sign out

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
│   │   └── test/         # e2e Jest suites + test DB bootstrap
│   └── mobile/           # Expo mobile app — see apps/mobile/README.md
├── shared/
│   └── types.ts          # Shared TypeScript interfaces
├── docs/                 # Documentation
│   ├── SPRINT_1.md       # Sprint 1 deliverables
│   ├── SPRINT_2.md       # Sprint 2 deliverables
│   ├── SPRINT_3.md       # Sprint 3 deliverables
│   ├── SPRINT_4.md       # Sprint 4 deliverables
│   ├── SPRINT_5.md       # Sprint 5 deliverables
│   ├── SPRINT_6.md       # Sprint 6 deliverables
│   ├── API_REFERENCE.md  # API endpoint reference
│   ├── ARCHITECTURE.md   # System architecture & design decisions
│   ├── QUERY_CACHE_AUDIT.md  # React Query cache-key audit
│   ├── QA_CHECKLIST.md   # Manual QA checklist (iOS + Android)
│   ├── QA_PUSH_PRODUCTION.md  # Production push verification
│   ├── QA_LOW_END_DEVICE.md   # Low-end device performance QA
│   └── CONTRIBUTING.md   # Contribution guide
├── scripts/
│   ├── smoke-sprint3.ps1 # API smoke tests (budgets, pushes, lifecycle)
│   ├── prepare-test-db.ps1   # Create + migrate budgettracker_test
│   └── verify-indexes.sql    # EXPLAIN ANALYZE index verification
├── render.yaml           # Render blueprint (production API service)
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
- [Sprint 4](docs/SPRINT_4.md) — Analytics & income-first dashboard deliverables
- [Sprint 5](docs/SPRINT_5.md) — Offline mode, settings & polish deliverables
- [Sprint 6](docs/SPRINT_6.md) — QA, performance & EAS deployment deliverables
- [Query Cache Audit](docs/QUERY_CACHE_AUDIT.md) — React Query key/invalidation audit
- [QA Checklist](docs/QA_CHECKLIST.md) — Manual QA on physical devices
- [QA Push](docs/QA_PUSH_PRODUCTION.md) — Production push-notification verification
- [QA Low-End Device](docs/QA_LOW_END_DEVICE.md) — 2 GB device performance targets
- [Contributing](docs/CONTRIBUTING.md) — Development workflow and conventions
- [Decisions](DECISIONS.md) — Architecture decision log

## Running Tests

### Backend unit tests

```bash
cd apps/api
npm test                 # Jest unit tests (src/**/*.spec.ts)
npm run test:cov         # with coverage
```

Covers: AuthService (register, login, refresh, logout) and BudgetsService (recalculateSpent, status transitions, over-allocation check, copy-period).

### Backend integration tests

The e2e tests need a dedicated PostgreSQL database (`budgettracker_test`). Prepare it once, then run:

```bash
cd apps/api
npm run test:db:prepare  # creates + migrates budgettracker_test
npm run test:e2e         # Jest e2e suite (test/*.e2e-spec.ts, runs serially)
```

Covers: transactions CRUD + type enforcement + budget recalculation, budgets (income-category rejection, copy-period), login rate limiting (5/min), and the dashboard figures (balance / remainingToAllocate / spent) against known test data.

## Production Deployment

### 1. Database — Neon

1. Create a project in the [Neon console](https://console.neon.tech) and copy the connection string.
2. Apply the schema (do not use `migrate dev` against production):

```bash
cd apps/api
$env:DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require"
npx prisma migrate deploy
```

### 2. API — Render

1. Push the repo (the `render.yaml` blueprint is checked in).
2. In the Render dashboard: **New → Blueprint** and select the repo.
3. Set the secret env vars in the service: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
4. Render deploys and health-checks `GET /api/v1/health`.

Production environment variables:

| Variable | Set via | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Render secret | Neon connection string (sslmode=require) |
| `JWT_ACCESS_SECRET` | Render secret | 32+ random chars |
| `JWT_REFRESH_SECRET` | Render secret | 32+ random chars |
| `JWT_ACCESS_EXPIRES_IN` | blueprint | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | blueprint | `7d` |
| `THROTTLE_LIMIT` | blueprint | `5` requests/min |
| `THROTTLE_TTL` | blueprint | `60000` ms |
| `SMTP_*` | Render secret | Gmail/SMTP relay for verification + reset emails |

### 3. Mobile — EAS production build

`EXPO_PUBLIC_API_BASE_URL` is inlined into the JS bundle at build time, so set it to the production URL **before** building:

```bash
cd apps/mobile
# apps/mobile/.env:
#   EXPO_PUBLIC_API_BASE_URL=https://budget-tracker-api-7f17.onrender.com/api/v1
npx eas-cli login
npx eas-cli build --profile production --platform all
```

`eas.json` production profile builds an Android AAB and an iOS archive.

### 4. Production verification

- Push notifications: run `scripts/smoke-sprint3.ps1` with `-BaseUrl https://budget-tracker-api-7f17.onrender.com/api/v1` and confirm all three conditions on the device (see `docs/QA_PUSH_PRODUCTION.md`).
- Manual QA: `docs/QA_CHECKLIST.md`.
- Performance: `docs/QA_LOW_END_DEVICE.md`. Database index check: `psql "$DATABASE_URL" -f scripts/verify-indexes.sql`.

## Current Status

**Sprint 6 in progress** — Automated QA delivered: 26 unit tests + 13 e2e integration tests, index verification script, React Query cache audit, `render.yaml` blueprint, EAS builds complete, README + DECISIONS updates. Production API live on Render (`budget-tracker-api-7f17.onrender.com`). Remaining (device-gated): physical-device QA and production push verification.

**Sprint 5 complete** — Backend profile endpoints (`GET/PATCH /users/me`), offline-first mobile (NetInfo awareness, offline banner, persisted write queue with FIFO replay via `useOfflineMutation`/`useOfflineSync`), reactive currency (`currencyStore` + `useCurrency`), consolidated profile/settings screens, and full polish (loading skeletons, error states, pull-to-refresh, delete confirmations, KeyboardAvoidingView, budget progress colors).

**Sprint 4 complete** — Analytics endpoints (summary, by-category, trend), full income-first dashboard endpoint, mobile dashboard with greeting/balance/budget progress/transactions, analytics screen with donut + bar charts, insights screen with 3 alert types, and React Query cache prefetch for instant load.

**Sprint 3 complete** — Backend (budget CRUD + copy-period + allocation summary, push notifications via Expo, push-token endpoints) and mobile (budget overview/detail/set-budget UI, push-notification registration).

See [docs/SPRINT_6.md](docs/SPRINT_6.md), [docs/SPRINT_5.md](docs/SPRINT_5.md), [docs/SPRINT_4.md](docs/SPRINT_4.md), [docs/SPRINT_3.md](docs/SPRINT_3.md), [docs/SPRINT_2.md](docs/SPRINT_2.md), and [docs/SPRINT_1.md](docs/SPRINT_1.md) for sprint deliverables.

## License

Private — All rights reserved.
