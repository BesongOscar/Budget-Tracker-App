# Architecture

This document describes the system architecture, key design patterns, and rationale behind technical decisions in the Budget Tracker app.

---

## System Overview

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│              │  HTTP   │                  │  SQL    │              │
│   Mobile App │ ◄─────► │   NestJS API     │ ◄─────► │  PostgreSQL  │
│   (Expo RN)  │         │   (apps/api)     │         │  Database    │
│              │         │                  │         │              │
└──────────────┘         └──────────────────┘         └──────────────┘
                                  │
                                  │ SMTP
                                  ▼
                          ┌──────────────┐
                          │  SMTP Server │
                          │  (Nodemailer) │
                          └──────────────┘
```

The mobile app communicates with the NestJS API over HTTP/JSON. The API persists data to PostgreSQL via Prisma and sends emails via Nodemailer.

---

## Monorepo Layout

```
Budget_Tracker_app/
├── apps/
│   ├── api/              # Backend — NestJS
│   └── mobile/           # Frontend — Expo React Native
├── shared/               # Shared TypeScript types
└── docs/                 # Documentation
```

**Why no workspaces:** For a solo developer project, a simple directory structure avoids the tooling overhead of Nx, Turborepo, or npm/yarn workspaces. Each app manages its own `node_modules` and dependencies independently.

---

## Authentication Flow

### Registration

```
Mobile                    API                     Email
  │                        │                        │
  │── POST /auth/register ─►                        │
  │   { email, password }  │                        │
  │                        │── Create user          │
  │                        │── Hash password (bcrypt)│
  │                        │── Seed categories      │
  │                        │── Generate 6-digit code │
  │                        │── Store VerificationToken│
  │                        │── Send verification email ►
  │◄── 201 { user, tokens }│                        │
  │                        │                        │
```

### Email Verification

```
Mobile                    API
  │                        │
  │── POST /auth/verify-email ─►
  │   { email, code }      │
  │                        │── Find VerificationToken
  │                        │── Check expiry
  │                        │── Validate code
  │                        │── Update user.emailVerifiedAt
  │                        │── Delete VerificationToken
  │◄── 200 { message }     │
```

### Login

```
Mobile                    API
  │                        │
  │── POST /auth/login ────►
  │   { email, password }  │
  │                        │── Find user
  │                        │── Compare bcrypt hash
  │                        │── Generate JWT access token (15min)
  │                        │── Generate refresh token (UUID, 7 days)
  │                        │── Store RefreshToken in DB
  │◄── 200 { user, tokens }│
```

### Token Refresh (Automatic)

```
Mobile (401 intercepted)   API
  │                        │
  │── POST /auth/refresh ──►
  │   { refreshToken }     │
  │                        │── Find RefreshToken in DB
  │                        │── Check expiry
  │                        │── Delete old RefreshToken
  │                        │── Generate new token pair
  │◄── 200 { tokens }      │
  │                        │
  │── Retry original request ─►
```

### Password Reset

```
Mobile                    API                     Email
  │                        │                        │
  │── POST /auth/forgot-password ─►                 │
  │   { email }            │                        │
  │                        │── Find user            │
  │                        │── Generate 6-digit code │
  │                        │── Store PasswordResetToken│
  │                        │── Send reset email    ──►
  │◄── 200 { message }     │                        │
  │                        │                        │
  │── POST /auth/reset-password ─►                   │
  │   { email, code, newPassword }│                  │
  │                        │── Validate code       │
  │                        │── Hash new password   │
  │                        │── Update user         │
  │                        │── Delete all RefreshTokens│
  │◄── 200 { message }     │                        │
```

---

## State Management

### Zustand (Client State)

Used exclusively for authentication state:

```typescript
// src/store/authStore.ts
{
  user: User | null,
  accessToken: string | null,
  isAuthenticated: boolean,
  setAuth: (user, token) => void,
  logout: () => void,
  setUser: (user) => void
}
```

**Why Zustand:** Minimal API, no boilerplate, works outside React components (needed for Axios interceptors). No Redux overhead for a solo-auth state.

### TanStack React Query (Server State)

Manages all API data fetching, caching, and synchronization:

- **Stale time:** 5 minutes (cache is fresh)
- **GC time:** 30 minutes (keep in memory)
- **Retry:** 2 attempts
- **Persistence:** AsyncStorage via `@tanstack/query-async-storage-persister`

**Why React Query + Zustand separation:** Server state (transactions, budgets, etc.) benefits from React Query's caching, background refetching, and optimistic updates. Auth state needs to be synchronous and accessible outside React (Axios interceptors), which Zustand handles cleanly.

---

## API Layer (Mobile)

### Axios Configuration

```
Request ──► Interceptor (attach Bearer token) ──► API Server
                                                         │
Response ◄── Interceptor (handle 401, refresh) ◄───────┘
```

**Token refresh logic:**
1. Request returns 401
2. Interceptor reads refresh token from SecureStore
3. Calls `/auth/refresh` directly (bypassing interceptors)
4. Updates Zustand store + SecureStore with new tokens
5. Retries original request with new access token
6. On failure: clears auth state, redirects to login

---

## Database Design

### Entity Relationships

```
User (1) ──── (N) Category (1) ──── (N) Transaction
   │                │
   │                └──── (N) Budget
   │
   ├── (N) RefreshToken
   ├── (1) VerificationToken
   └── (1) PasswordResetToken
```

### Key Design Decisions

- **Soft deletes for categories:** `deletedAt` field allows hiding categories without losing historical transaction data
- **Unique constraints:** `[userId, name]` on Category, `[userId, categoryId, periodMonth]` on Budget prevent duplicates
- **Decimal precision:** `Decimal(12, 2)` for monetary amounts avoids floating-point issues
- **Refresh tokens in DB:** Enables server-side revocation (logout, password reset invalidates all devices)
- **Income-first budgeting:** Income funds a shared pool; users allocate from pool to expense categories. Budgets track `allocatedAmount` (planned) and `spentAmount` (actual), with a `status` lifecycle (DRAFT → ACTIVE → COMPLETED / OVER_BUDGET → ARCHIVED)
- **BudgetStatus enum:** Server-evaluated only — status transitions enforced in Prisma `$transaction` blocks, never set by the client
- **Performance indexes:** Indexed on `userId`, `date`, `periodMonth`, and `status` for frequent query patterns

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt, 12 salt rounds |
| JWT access tokens | 15-minute expiry, signed with separate secret |
| Refresh tokens | UUID v4, 7-day expiry, stored in DB, rotated on use |
| Rate limiting | 5 requests per IP per minute (ThrottlerModule) |
| Input validation | Global ValidationPipe with whitelist + transform |
| User enumeration prevention | Forgot-password returns generic message regardless of email existence |
| Token invalidation | All refresh tokens deleted on password reset |
| CORS | Enabled (configure allowed origins for production) |

---

## Navigation Architecture

```
Root Stack
├── (auth)/              # Unauthenticated
│   ├── index            # Onboarding carousel (first launch only)
│   ├── login
│   ├── register         # 3-step: Form → Verify → Complete
│   ├── forgot-password
│   └── reset-password
├── add-transaction      # Modal (app-level)
└── (protected)/         # Authenticated (Tab Navigator)
    ├── (home)/          # Dashboard + analytics sub-route
    ├── (transactions)/  # List + [id] detail
    ├── (budgets)/       # List + [id] detail
    └── (Profile)/       # Index + categories + category/[id] + settings + insights
```

**Auth redirect:** The root layout checks `isAuthenticated` on segment changes and redirects accordingly.

---

## User Data Isolation (Global JwtAuthGuard)

The `JwtAuthGuard` is registered globally in `AppModule` as an `APP_GUARD`:

```typescript
providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

Every controller method therefore requires a valid JWT unless the route is decorated with `@Public()`. The guard reads the verified user payload into `request.user`, which `@CurrentUser('id')` extracts.

**Why global:** Every data query is scoped by `userId` (e.g. `where: { userId, id }`). If a controller forgets its guard, `userId` is `undefined` and Prisma silently ignores the filter — returning every user's rows. A global guard makes "protected by default" the rule and removes the need to remember `@UseGuards` per controller.

```text
Request ──► JwtAuthGuard (global) ──► @CurrentUser('id') ──► Prisma where { userId }
                 │
                 └─ @Public()? ── allow without token (auth endpoints, /health)
```

---

## Transaction Write Flow

Every transaction create/update/delete runs inside a Prisma `$transaction` block that also recalibrates the affected budget:

```text
POST /transactions
   │
   ├─ 1. Load category; validate category.type === body.type
   │         └─ mismatch → 422 Unprocessable Entity
   ├─ 2. Create/update/delete Transaction
   ├─ 3. RecalculateSpent(userId, categoryId, periodMonth):
   │         ├─ Sum spentAmount from transactions in period
   │         ├─ Compare to allocatedAmount
   │         └─ Set status: DRAFT ↔ ACTIVE ↔ OVER_BUDGET (bidirectional)
   └─ 4. Commit
```

`recalculateSpent` runs in the same transaction as the write, so `spentAmount` and `status` can never drift from the transactions they represent. The status is always server-evaluated — the client never sends it.

---

## Response Envelope & Services

- The global `ResponseInterceptor` wraps all successful responses as `{ data, meta: { timestamp } }`
- Service methods return **raw** data (arrays/objects); the interceptor adds the envelope
- A service must NOT return a `{ data }` object itself, or the interceptor double-wraps it and the mobile client's `Array.isArray` guard breaks (this bug was fixed in Sprint 2)

---

## Key Decisions (from DECISIONS.md)

| Decision | Rationale |
|----------|-----------|
| Monorepo without workspaces | Simple directory structure, no tooling overhead for solo dev |
| Expo managed workflow | No Xcode/Android Studio needed for development |
| Prisma over raw SQL | Type safety, migrations, schema-first approach |
| Zustand + React Query separation | UI state vs server cache, different concerns |
| ThrottlerModule | Built-in NestJS rate limiting, no external service needed |
