# Architecture Decisions

## Stack
- **Mobile**: Expo SDK 54 + Expo Router (file-based routing) + React Native 0.81.5
- **Backend**: NestJS 11 + Prisma ORM + PostgreSQL
- **State**: Zustand (client state) + TanStack React Query (server state)
- **Auth**: JWT access/refresh tokens with expo-secure-store

## Folder Structure
- `apps/api/` — NestJS backend
- `apps/mobile/` — Expo React Native app
- `shared/` — Shared TypeScript types between frontend and backend

## Key Decisions
1. **Monorepo without workspaces** — simple directory structure, no extra tooling overhead for solo dev
2. **Expo managed workflow** — no eject, no Xcode/Android Studio needed for development
3. **Prisma over raw SQL** — type safety, migrations, and schema-first approach
4. **Zustand + React Query separation** — UI state in Zustand, server cache in React Query
5. **ThrottlerModule for rate limiting** — 5 login attempts per IP per minute
6. **Income-first budgeting model** — Income funds a shared pool; users allocate from pool to expense categories. Models real personal budgeting behaviour instead of independent per-category limits.
7. **BudgetStatus lifecycle** — Budgets progress through DRAFT → ACTIVE → COMPLETED / OVER_BUDGET → ARCHIVED. Status transitions are evaluated server-side only inside Prisma `$transaction` blocks — the client never sets status directly.
8. **Category type enforcement** — Income transactions must use income categories; expense transactions must use expense categories. Validated at the API layer on every transaction write.
9. **Over-allocation: warn, do not block** — Users may have irregular income. Negative `remainingToAllocate` is allowed and shown in red, but not rejected.
10. **Error envelope format** — Errors return `{ error: { code, message, status } }`. Success returns `{ data, meta: { timestamp } }`. Consistent across all endpoints.
11. **Global JWT guard for user scoping** — `JwtAuthGuard` registered once as an `APP_GUARD` instead of `@UseGuards` per controller. Missing `userId` makes Prisma ignore the `where` filter (returning all users' rows), so protection is "on by default" and routes opt out via `@Public()`.
12. **Services return raw data** — Controllers/services return raw arrays/objects and the global `ResponseInterceptor` supplies the `{ data, meta }` envelope. A service returning `{ data }` gets double-wrapped and breaks client `Array.isArray` handling.
13. **Server-side budget status sync** — `recalculateSpent` runs inside the same Prisma `$transaction` as every transaction write (create/update/delete), so `spentAmount` and `status` always reflect actual transactions.
14. **Notifications fire after commit** — Budget events are collected inside the `$transaction` and dispatched only after it commits, so a rolled-back write never sends a notification. Expo push failures are logged and swallowed — a push outage can never fail an API request.
15. **Expo push service for delivery** — Pushes go through `https://exp.host/--/api/v2/push/send` (overridable via `EXPO_PUSH_ENDPOINT`); no custom push infrastructure. `DeviceNotRegistered`/`InvalidCredentials` responses null out the stored `User.expoPushToken`.
16. **Over-allocation warns once per period** — `BudgetPeriod.overAllocationWarnedAt` makes the over-allocation warning fire exactly once per month even when over-allocation persists across many writes.
17. **Threshold events fire on crossing only** — `THRESHOLD_80`/`OVER_BUDGET` fire when spend crosses the boundary, not on every subsequent transaction write.
18. **Budget delete restricted to DRAFT/ARCHIVED** — budgets with real spending history (`ACTIVE`/`OVER_BUDGET`/`COMPLETED`) cannot be deleted, preserving financial records.
19. **Copy-period uses upsert** — target-month budgets are created with `spentAmount: 0` and `DRAFT` status; existing target budgets are preserved untouched.
20. **`GET /budgets` returns `{ budgets, summary }`** — the list endpoint returns an object (not an array) because it carries the aggregated period summary; this is still compatible with the `{ data, meta }` envelope because the top-level key is not `data`.
21. **Analytics are read-only aggregation endpoints** — no new schema models; all queries use Prisma `aggregate` and `groupBy` on existing Transaction and Budget models. This avoids migration overhead and keeps the analytics layer decoupled from write paths.
22. **Dashboard balance vs remainingToAllocate are distinct** — `balance` is all-time `SUM(income) - SUM(expenses)` (net worth); `remainingToAllocate` is period-scoped `income - allocated` (budget pool). The dashboard makes this visual distinction clear with separate card components.
23. **Client-side daily analytics grouping** — the daily bar chart on the analytics screen groups expense transactions by day of month in JS rather than adding a dedicated backend endpoint. This keeps the API surface minimal for a feature that may evolve (e.g., switching to hourly granularity).
24. **Insights derived from existing dashboard data** — the insights screen computes alerts (budget 80%, over-budget, over-allocation) client-side from the dashboard response rather than adding a dedicated backend endpoint. Simple rule-based checks don't justify an extra API call.
25. **React Query prefetch on auth redirect** — dashboard data is prefetched in the root layout's auth redirect effect so the dashboard screen can render immediately from cache on cold start, targeting <3s render time.
