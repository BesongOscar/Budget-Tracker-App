# Budget Tracker Mobile

Expo React Native app for the Budget Tracker. Provides onboarding, authentication, transaction tracking, income-first budget management, and push notifications for budget events. Analytics is planned for a future sprint.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Expo SDK 54 | Development platform |
| React Native 0.81.5 | UI framework |
| Expo Router 6 | File-based navigation |
| Zustand | Client state (auth) |
| TanStack React Query | Server state + caching |
| Formik + Yup | Form handling + validation |
| Axios | HTTP client |
| expo-secure-store | Secure token storage |
| expo-notifications | Push notification registration + handling |
| Reanimated | Animations |

## Project Structure

```
app/
├── _layout.tsx                      # Root layout (auth redirect, providers)
├── (auth)/
│   ├── _layout.tsx                  # Auth stack navigator
│   ├── index.tsx                    # Onboarding carousel
│   ├── login.tsx                    # Login form
│   ├── register.tsx                 # Multi-step registration
│   ├── forgot-password.tsx          # Request reset code
│   └── reset-password.tsx           # Enter code + new password
├── (protected)/
│   ├── _layout.tsx                  # Tab navigator with custom tab bar
│   ├── (home)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Dashboard
│   │   └── analytics.tsx            # Analytics view
│   ├── (transactions)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Transaction list
│   │   └── [id].tsx                 # Transaction detail
│   ├── (budgets)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Monthly budget overview + summary
│   │   ├── [id].tsx                 # Budget detail
│   │   └── set-budget.tsx           # Create budget modal
│   └── (Profile)/
│       ├── _layout.tsx
│       ├── index.tsx                # Profile
│       ├── categories.tsx           # Category management
│       ├── category/
│       ├── settings.tsx             # Settings
│       └── insights.tsx             # Insights
└── +not-found.tsx

src/
├── api/
│   ├── axios.ts                     # Axios instance + interceptors
│   ├── auth.api.ts                  # Auth endpoints
│   ├── categories.api.ts            # Category endpoints
│   ├── transactions.api.ts          # Transaction endpoints
│   ├── budgets.api.ts               # Budget endpoints
│   └── users.api.ts                 # Push-token endpoints
├── Components/
│   ├── CTAbutton.tsx                # Reusable action button
│   ├── CustomTabBar.tsx             # Bottom tab bar with FAB
│   ├── EmptyState.tsx               # Empty list states
│   ├── (auth)/
│   │   ├── OAuthButton.tsx          # Social login placeholder
│   │   ├── PasswordStrenghtMeter.tsx
│   │   ├── StepIndicator.tsx        # Registration step indicator
│   │   └── Verification.tsx         # Verification placeholder
│   └── Budget/
│       ├── AllocationSummaryCard.tsx  # Income vs allocated summary
│       ├── BudgetCard.tsx             # Per-category budget row
│       ├── OverAllocationBanner.tsx   # Over-allocation warning
│       └── EndOfPeriodPrompt.tsx      # Copy-prev-month prompt
├── constants/
│   ├── config.ts                    # API base URL
│   ├── onBoardingTheme.ts           # Design tokens
│   └── theme.ts                     # Colors, fonts
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   ├── use-theme-color.ts
│   ├── useAuth.ts                   # Auth hook (login, register, logout, etc.)
│   └── usePushNotifications.ts      # Permission, token registration, handler
├── store/
│   └── authStore.ts                 # Zustand auth state
├── types/
│   └── budget.ts                    # Budget/period UI types
└── utils/
    ├── formatCurrency.ts            # Currency formatting (user's currencyCode)
    ├── formatDate.ts                # Date formatting
    ├── month.ts                     # Period-month helpers
    ├── persister.ts                 # AsyncStorage query persister
    └── queryClient.ts               # React Query client config
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`) or use `npx`
- Expo Go app on your phone, or an Android/iOS simulator

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env .env.example   # if needed
# Set EXPO_PUBLIC_API_BASE_URL in .env

# Start development server
npx expo start
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3000/api/v1` | Backend API base URL |

## Navigation Architecture

```
Root Stack
├── (auth)              # Unauthenticated users
│   ├── Onboarding      # First-launch carousel
│   ├── Login           # Email + password
│   ├── Register        # 3-step: Form → Verify → Complete
│   ├── Forgot Password
│   └── Reset Password
└── (protected)         # Authenticated users
    ├── (home)          # Dashboard + analytics
    ├── (transactions)  # List + detail
    ├── (budgets)       # List + detail + set-budget modal
    └── (Profile)       # Profile, categories, settings, insights
```

Auth-based redirect is handled in `app/_layout.tsx` — checks `useAuthStore().isAuthenticated` and routes accordingly.

## State Management

### Zustand (Client State)

`src/store/authStore.ts` manages:
- `user` — Current user object
- `accessToken` — JWT access token
- `isAuthenticated` — Boolean flag
- `setAuth()` / `logout()` / `setUser()` — State mutations

### TanStack React Query (Server State)

Configured in `src/utils/queryClient.ts`:
- 5 min stale time
- 30 min garbage collection
- 2 retries
- AsyncStorage persistence via `src/utils/persister.ts`

## API Layer

`src/api/axios.ts` configures an Axios instance with:
- **Request interceptor:** Attaches `Bearer` token from Zustand store
- **Response interceptor:** Catches 401 errors, attempts token refresh via SecureStore, retries the original request. On failure, clears auth state and redirects to login.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npx expo start` | Start Expo dev server |
| `npx expo run:android` | Build and run on Android |
| `npx expo run:ios` | Build and run on iOS |
| `npx expo start --web` | Start web version |
| `npm run lint` | ESLint |
