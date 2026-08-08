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
