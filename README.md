# Budget Tracker

A mobile-first personal finance app for tracking income, expenses, and monthly budgets. Built with Expo (React Native) and NestJS.

## Features

- **Transaction tracking** — Log income and expenses with categories
- **Budget management** — Set monthly spending limits per category
- **Analytics** — Visualize spending trends over time
- **Email authentication** — Register, login, email verification, password reset
- **Push notifications** — Alerts when approaching budget limits (planned)

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
- [Contributing](docs/CONTRIBUTING.md) — Development workflow and conventions
- [Decisions](DECISIONS.md) — Architecture decision log

## Current Status

**Sprint 1 complete** — Project foundation, database schema, full authentication system (register, login, email verification, password reset), and navigation scaffolding are in place.

See [docs/SPRINT_1.md](docs/SPRINT_1.md) for details on what was built.

## License

Private — All rights reserved.
