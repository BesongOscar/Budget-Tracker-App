# Sprint 6 — QA, Performance, and EAS Deployment

**Period:** September 2026
**Status:** In progress — backend test suites green (26 unit + 13 e2e), performance verification and deployment artifacts in place. Device QA and account-gated deployment (Neon / Render / EAS) pending completion on physical devices.

---

## Overview

Sprint 6 makes the app production-ready: a full automated test suite (unit + e2e) behind the backend, performance verification for the database indexes and the React Query cache, production infrastructure (Neon + Render), a mobile production build via EAS, push-notification verification, and the release documentation.

---

## Backend — Testing

### New test infrastructure
- **Dev deps:** `supertest`, `@types/supertest`
- **`apps/api/test/jest-e2e.json`** — e2e config (`testRegex: .e2e-spec.ts$`, `maxWorkers: 1` so suites share the single `budgettracker_test` DB serially, ts-jest)
- **`apps/api/test/setup-env.ts`** — loads `.env`, points `DATABASE_URL` at `budgettracker_test`, raises the throttle limit for non-rate-limit suites
- **`apps/api/test/create-app.ts`** — bootstraps the full `AppModule` with the same prefix/pipes/interceptor/filter as `main.ts`; overrides `EmailService` so tests never send real SMTP
- **`apps/api/test/db.ts`** — `resetDb()` truncates `User CASCADE`
- **`scripts/prepare-test-db.ps1`** + `npm run test:db:prepare` — creates + migrates the test DB

### Bug fixed during testing
- **Rate limiting was inert.** `ThrottlerModule` was configured in `app.module.ts` but `ThrottlerGuard` was never registered as an `APP_GUARD`, so the claimed 5 req/min protection did nothing. Now registered globally (`app.module.ts`), and the limit/ttl are env-driven (`THROTTLE_LIMIT`, `THROTTLE_TTL`) so e2e suites can lift it. The rate-limit e2e test (6.5) exercises the real 5/min limit.

### Test counts

| Suite | File | Cases |
|-------|------|-------|
| AuthService unit | `src/auth/auth.service.spec.ts` | 9 |
| BudgetsService unit | `src/budgets/budgets.service.spec.ts` | 17 |
| Transactions e2e | `test/transactions.e2e-spec.ts` | 5 |
| Budgets e2e | `test/budgets.e2e-spec.ts` | 4 |
| Dashboard e2e (task 6.7) | `test/dashboard.e2e-spec.ts` | 1 |
| Rate limit e2e (task 6.5) | `test/auth-rate-limit.e2e-spec.ts` | 1 |

**39 automated checks, all green.**

- `npm test` → 26 unit tests
- `npm run test:e2e` → 13 integration tests
- Dashboard known-data figures (task 6.7): income 3000 / spent 200 / allocated 2500 → `balance` 2800, `remainingToAllocate` 500.

---

## Backend — Performance (task 6.9)

`scripts/verify-indexes.sql` — lists `pg_indexes` and runs `EXPLAIN ANALYZE` on the five hot paths. Executed against a migrated DB; every path resolves through an index scan:

| Query path | Index used |
|------------|------------|
| Transaction list (`userId` + `ORDER BY date`) | `Transaction_userId_idx` |
| `recalculateSpent` aggregate | `Transaction_userId_idx` |
| Budgets for period (`userId` + `periodMonth`) | `Budget_userId_periodMonth_idx` |
| Budget status filter | `Budget_status_idx` |
| Dashboard period aggregates | `Transaction_userId_idx` |

> **Index-name note:** the sprint spec calls the status index `idx_budgets_status`; Prisma auto-generated it as **`Budget_status_idx`**. It IS present — only the name differs. No production migration is required.

---

## Frontend — Performance (task 6.10)

`docs/QUERY_CACHE_AUDIT.md` — full audit of React Query keys, reader/invalidator prefixes, `staleTime`/`gcTime`, and navigator lifecycle.

**Verdict: no unnecessary refetches on tab navigation.** 5-min `staleTime`, 30-min `gcTime`, `refetchOnWindowFocus: false`, persisted + prefetched dashboard, and `enabled:` guards on detail queries mean tab switches stay cache-served. No code changes needed.

---

## Deployment (tasks 6.11–6.16)

### Infrastructure
- **Neon (6.11):** provision a project, then run production migration with `DATABASE_URL` pointing at Neon:
  ```powershell
  $env:DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/budgettracker?sslmode=require"
  npx prisma migrate deploy
  ```
- **Render (6.12):** `render.yaml` blueprint at repo root — `budget-tracker-api` web service (`rootDir: apps/api`, `healthCheckPath: /api/v1/health`, secrets via `sync: false`). Connect the repo in the Render dashboard and fill `DATABASE_URL`, `JWT_*`, and `SMTP_*`.
- **Mobile prod URL (6.13):** set `EXPO_PUBLIC_API_BASE_URL=https://budget-tracker-api.onrender.com/api/v1` in `apps/mobile/.env` (or as an EAS environment variable) **before** building. The value is inlined at build time.
- **EAS production build (6.14):**
  ```powershell
  npx eas-cli login
  npx eas-cli build --profile production --platform all
  ```
- **Push verification (6.15):** `docs/QA_PUSH_PRODUCTION.md` + `scripts/smoke-sprint3.ps1` against production confirm all three conditions (THRESHOLD_80, OVER_BUDGET, once-per-period over-allocation).
- **Health endpoint (6.16):** already implemented (`GET /api/v1/health`, `@Public()` in `app.controller.ts`), now wired as the Render `healthCheckPath`.

---

## Manual QA (tasks 6.6, 6.8)

- `docs/QA_CHECKLIST.md` — 24 feature stories with steps + expected results for iOS and Android, plus the task 6.7 known-data table.
- `docs/QA_LOW_END_DEVICE.md` — how to measure cold launch (<3 s) and per-API latency (<500 ms) on a 2 GB Android device.

---

## Documentation (tasks 6.17, 6.18)

- **README.md** — added automated-test instructions, production deployment section (Neon → Render → EAS), and current-status update.
- **DECISIONS.md** — all previous decisions retained; three Sprint-6 ADRs appended (#31 test database strategy, #32 Render blueprint, #33 env-driven throttle); v3 decision roster confirmed covered.
- **New docs:** `docs/QUERY_CACHE_AUDIT.md`, `docs/QA_CHECKLIST.md`, `docs/QA_PUSH_PRODUCTION.md`, `docs/QA_LOW_END_DEVICE.md`.

---

## Build & Verification

- `npx tsc --noEmit` passes in `apps/api` (0 errors); `npm run build` succeeds.
- `npm test` → 26/26 green.
- `npm run test:e2e` → 13/13 green.
- Lint: `npm run lint` still fails on the pre-existing ESLint 9 flat-config gap (no `eslint.config.js`) — unchanged from Sprint 3, out of scope for this sprint's tasks.

## What's NOT Done (account-gated)

- **Neon provisioning + production `prisma migrate deploy`** — needs the user's Neon project/connection string.
- **Render service creation + secret env vars** — needs the user's Render account; blueprint is ready.
- **EAS production build** — needs `eas login` and the user's Expo account.
- **Physical-device QA runs (6.6, 6.8) and production push verification (6.15)** — needs real devices and the deployed endpoints.