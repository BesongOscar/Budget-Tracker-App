# Contributing Guide

Development workflow and conventions for the Budget Tracker project.

---

## Development Setup

1. Clone the repo and follow the [README setup instructions](../README.md#getting-started)
2. Both apps should be running simultaneously:
   - **API:** `cd apps/api && npm run start:dev`
   - **Mobile:** `cd apps/mobile && npx expo start`

---

## Branch Naming

Use descriptive prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/transaction-list` |
| `fix/` | Bug fix | `fix/login-error-banner` |
| `chore/` | Maintenance, config, deps | `chore/update-expo-sdk` |
| `docs/` | Documentation only | `docs/api-reference` |
| `refactor/` | Code restructuring | `refactor/auth-service` |

```bash
git checkout -b feat/budget-modal
```

---

## Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

**Examples:**

```
feat(auth): add password reset flow
fix(api): handle expired refresh token gracefully
chore(mobile): update expo to SDK 54
docs: add API reference
```

---

## Code Style

Both apps use ESLint + Prettier. Before committing:

```bash
# Backend
cd apps/api
npm run lint
npm run format

# Mobile
cd apps/mobile
npm run lint
```

### General Conventions

- **TypeScript strict mode** — No `any` types unless absolutely necessary
- **Named exports** — Use `export default` for page components (Expo Router requirement), named exports for everything else
- **File naming:**
  - Components: `PascalCase.tsx` (e.g., `CTAbutton.tsx`)
  - Utilities/hooks: `camelCase.ts` (e.g., `useAuth.ts`)
  - Constants: `camelCase.ts` (e.g., `theme.ts`)
- **No inline comments** — Code should be self-documenting; add comments only for complex logic

---

## Adding a New Screen (Mobile)

1. Create the file in the appropriate `app/` directory:

   ```
   app/(protected)/(transactions)/new-screen.tsx
   ```

2. Export a default component:

   ```tsx
   import { View, Text } from 'react-native';

   export default function NewScreen() {
     return (
       <View>
         <Text>New Screen</Text>
       </View>
     );
   }
   ```

3. If it needs a nested layout, add `_layout.tsx` in the same directory.

4. For modals, add the screen to the root `Stack` in `app/_layout.tsx` with `presentation: 'modal'`.

---

## Adding a New API Endpoint (NestJS)

1. **Create or extend a module** in `src/`:

   ```
   src/
   └── transactions/
       ├── transactions.module.ts
       ├── transactions.controller.ts
       ├── transactions.service.ts
       └── dto/
           └── create-transaction.dto.ts
   ```

2. **Add to AppModule** in `src/app.module.ts`:

   ```typescript
   @Module({
     imports: [
       // ...existing modules
       TransactionsModule,
     ],
   })
   export class AppModule {}
   ```

3. **Follow existing patterns:**
   - Use `@Public()` decorator for public endpoints
   - Use `@CurrentUser()` to access the authenticated user
   - Validate request bodies with DTOs + `class-validator`
   - Return data through the response interceptor (it wraps in `{ data, meta }`)

---

## Adding a New Prisma Model

1. Edit `apps/api/prisma/schema.prisma`
2. Run migration:

   ```bash
   cd apps/api
   npx prisma migrate dev --name add_<model_name>
   ```
3. Update `shared/types.ts` with the corresponding TypeScript interface

---

## Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Run linting and type checks on both apps
4. Test the flow end-to-end (API + Mobile)
5. Push and create a PR with:
   - Clear description of changes
   - Screenshots/recordings for UI changes
   - Any migration or env var changes noted
6. Review and merge

---

## Testing

### Backend

```bash
cd apps/api
npm run test          # Unit tests
npm run test:cov      # With coverage
npm run test:e2e      # End-to-end tests
```

Tests are in `*.spec.ts` files alongside the source code.

### Mobile

No test framework is configured yet. When added, tests will live alongside components.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `prisma` client not found | Run `npx prisma generate` in `apps/api` |
| Expo can't reach API | Ensure `EXPO_PUBLIC_API_BASE_URL` points to your machine's IP (not `localhost` if testing on device) |
| 401 on every request | Check that `accessToken` is being attached — verify Zustand store state |
| Migration conflicts | Run `npx prisma migrate dev --create-only` and resolve manually |
