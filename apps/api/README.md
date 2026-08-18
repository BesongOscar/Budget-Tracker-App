# Budget Tracker API

NestJS backend for the Budget Tracker mobile app. Handles authentication, user management, categories, transactions, income-first budgeting, and push notifications via the Expo push service.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| NestJS 11 | Application framework |
| Prisma 6 | ORM + database migrations |
| PostgreSQL | Database |
| Passport + JWT | Authentication |
| bcrypt | Password hashing |
| Nodemailer | Email delivery |
| ThrottlerModule | Rate limiting |
| Expo push service | Push notification delivery (fetch-based) |

## Project Structure

```
src/
├── auth/
│   ├── auth.controller.ts       # Route handlers for /auth/*
│   ├── auth.service.ts          # Business logic (register, login, tokens, verification)
│   ├── auth.module.ts           # Module wiring (JWT, Passport, Prisma, Email)
│   ├── dto/                     # Request validation (class-validator)
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── verify-email.dto.ts
│   │   ├── resend-verification.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── reset-password.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # Global JWT guard
│   └── strategies/
│       └── jwt.strategy.ts      # Passport JWT strategy
├── categories/                  # Category CRUD
├── transactions/                # Transaction CRUD + budget spend sync
├── budgets/
│   ├── budgets.controller.ts    # /budgets* routes
│   ├── budgets.service.ts       # CRUD, copy-period, recalculateSpent, period summaries
│   ├── dto/                     # create/update/query/copy-period DTOs
│   └── budgets.module.ts
├── notifications/
│   ├── notifications.module.ts  # @Global module
│   └── notifications.service.ts # Expo push sender + budget event notifications
├── users/
│   ├── users.controller.ts      # /users/me/push-token* routes
│   ├── users.service.ts
│   └── dto/update-push-token.dto.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   └── public.decorator.ts         # @Public() — skip JWT guard
│   ├── filters/
│   │   └── http-exception.filter.ts    # Global error handler
│   └── interceptors/
│       └── response.interceptor.ts     # Wraps responses in { data, meta }
├── email/
│   ├── email.module.ts
│   └── email.service.ts         # SMTP transport, verification + reset emails
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts        # PrismaClient lifecycle management
├── app.module.ts                # Root module
├── app.controller.ts
├── app.service.ts
└── main.ts                      # Bootstrap + global config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- SMTP server (for email delivery)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secrets, SMTP credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for refresh token validation |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `PORT` | No | `3000` | Server port |
| `SMTP_HOST` | Yes | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | Yes | — | SMTP username |
| `SMTP_PASS` | Yes | — | SMTP password |
| `SMTP_FROM` | No | `Budget Tracker <noreply@budgettracker.com>` | Sender address |
| `EXPO_PUSH_ENDPOINT` | No | `https://exp.host/--/api/v2/push/send` | Expo push API endpoint |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start with file watching |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled output |
| `npm run lint` | ESLint fix |
| `npm run format` | Prettier format |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Tests with coverage |
| `npm run test:e2e` | End-to-end tests |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create new migration |
| `npm run prisma:deploy` | Apply migrations (production) |

## Security

- **Password hashing:** bcrypt with 12 salt rounds
- **JWT:** Access tokens (15min) + refresh tokens (7 days, stored in DB, rotated on use)
- **Rate limiting:** 5 requests per IP per minute (applied globally)
- **Validation:** Global `ValidationPipe` with whitelist + transform
- **User enumeration prevention:** Forgot-password always returns the same message
- **Token invalidation:** All refresh tokens deleted on password reset

## Database

Run `npx prisma studio` to open the browser-based database viewer.

The schema is defined in `prisma/schema.prisma`. Always run `npx prisma migrate dev` after schema changes.
