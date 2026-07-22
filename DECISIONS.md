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
