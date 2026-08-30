# API Reference

Base URL: `http://localhost:3000/api/v1`

All endpoints are prefixed with `/api/v1`. The backend uses NestJS with global ValidationPipe and a custom response interceptor.

---

## Response Format

### Success

All successful responses are wrapped in a `{ data, meta }` envelope:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

### Error

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials",
    "status": 401
  }
}
```

Errors with multiple validation failures return a comma-separated message string.

---

## Authentication

All endpoints except those marked **Auth: Public** require a JWT access token in the `Authorization` header. A global `JwtAuthGuard` enforces this — routes decorated with `@Public()` (the auth endpoints and `GET /health`) are exempt.

```
Authorization: Bearer <accessToken>
```

The access token is returned from the login/register endpoints. Access tokens expire after 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`).

When the access token expires, the mobile app automatically uses the refresh token to obtain a new pair. The refresh token is stored securely on the device (expo-secure-store) and in the database.

---

## Endpoints

### POST `/auth/register`

Create a new user account. Seeds 6 default categories and sends a verification email.

**Auth:** Public

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number |
| `fullName` | string | No | — |

**Response (201):**

```json
{
  "data": {
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "currencyCode": "USD",
      "emailVerifiedAt": null,
      "createdAt": "2025-06-14T00:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "uuid"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `409 Conflict` — Email already registered
- `400 Bad Request` — Validation failed

---

### POST `/auth/login`

Authenticate with email and password.

**Auth:** Public

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response (200):**

```json
{
  "data": {
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "currencyCode": "USD"
    },
    "accessToken": "eyJ...",
    "refreshToken": "uuid"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — Invalid credentials

---

### POST `/auth/refresh`

Rotate a refresh token. Returns a new access/refresh token pair. The old refresh token is deleted.

**Auth:** Public

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | Yes |

**Response (200):**

```json
{
  "data": {
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "currencyCode": "USD"
    },
    "accessToken": "eyJ...",
    "refreshToken": "new-uuid"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — Invalid or expired refresh token

---

### POST `/auth/logout`

Delete a refresh token, effectively logging the user out.

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | Yes |

**Response (200):**

```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

---

### POST `/auth/verify-email`

Verify a user's email address using the 6-digit code sent via email.

**Auth:** Public

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `code` | string | Yes (6 digits) |

**Response (200):**

```json
{
  "data": {
    "message": "Email verified successfully"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — User not found, no code found, code expired, or invalid code

---

### POST `/auth/resend-verification`

Resend the email verification code. Deletes any existing code and generates a new one (10 min expiry).

**Auth:** Public

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

**Response (200):**

```json
{
  "data": {
    "message": "Verification code sent"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — User not found

---

### POST `/auth/forgot-password`

Send a password reset code to the user's email. Always returns the same message to prevent user enumeration.

**Auth:** Public

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

**Response (200):**

```json
{
  "data": {
    "message": "If an account with that email exists, a password reset code has been sent."
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

---

### POST `/auth/reset-password`

Reset a user's password using the 6-digit code from the forgot-password email. Invalidates all existing refresh tokens for the user.

**Auth:** Public

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | — |
| `code` | string | Yes | 6 digits |
| `newPassword` | string | Yes | Min 8 chars, 1 uppercase, 1 number |

**Response (200):**

```json
{
  "data": {
    "message": "Password reset successfully"
  },
  "meta": {
    "timestamp": "2025-06-14T12:00:00.000Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — User not found, no code found, code expired, or invalid code

---

## Categories

All category endpoints are scoped to the authenticated user.

### GET `/categories`

List the user's categories.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | No | Filter by `INCOME` or `EXPENSE` |

**Response (200):**

```json
{
  "data": [
    {
      "id": "cuid",
      "name": "Food & Drinks",
      "icon": "🍕",
      "color": "#FF3B30",
      "type": "EXPENSE"
    }
  ],
  "meta": { "timestamp": "2025-06-14T12:00:00.000Z" }
}
```

### GET `/categories/:id`

**Auth:** JWT Required

**Errors:**
- `404 Not Found` — Category not found for this user

### POST `/categories`

Create a category. Category `type` is immutable after creation.

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | Max 50 chars |
| `type` | string | Yes | `INCOME` or `EXPENSE` |
| `icon` | string | No | Emoji |
| `color` | string | No | Hex color |

**Errors:**
- `409 Conflict` — Category name already exists for this user
- `400 Bad Request` — Validation failed

### PATCH `/categories/:id`

Update category `name`, `icon`, or `color`.

**Auth:** JWT Required

### DELETE `/categories/:id`

Soft-delete a category (sets `deletedAt`; historical transactions are preserved).

**Auth:** JWT Required

**Errors:**
- `404 Not Found` — Category not found for this user

---

## Transactions

All transaction endpoints are scoped to the authenticated user. A transaction's `type` must match its category's `type`.

### GET `/transactions`

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | No | Filter by `INCOME` or `EXPENSE` |
| `categoryId` | string | No | Filter by category |
| `from` | string | No | ISO date range start |
| `to` | string | No | ISO date range end |
| `page` | number | No | Pagination page (default 1) |
| `limit` | number | No | Page size, max 100 (default 20) |

**Response (200):**

```json
{
  "data": [
    {
      "id": "cuid",
      "amount": 2500,
      "description": "Groceries",
      "type": "EXPENSE",
      "date": "2025-06-14T12:00:00.000Z",
      "category": {
        "id": "cuid",
        "name": "Food & Drinks",
        "icon": "🍕",
        "color": "#FF3B30"
      }
    }
  ],
  "meta": { "timestamp": "2025-06-14T12:00:00.000Z" }
}
```

### GET `/transactions/:id`

**Auth:** JWT Required

**Errors:**
- `404 Not Found` — Transaction not found for this user

### POST `/transactions`

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `amount` | number | Yes | > 0, max 999999999999.99 |
| `type` | string | Yes | `INCOME` or `EXPENSE` |
| `categoryId` | string | Yes | Must match `type` |
| `date` | string | Yes | ISO date |
| `description` | string | No | Max 255 chars |

**Errors:**
- `422 Unprocessable Entity` — Transaction type does not match category type
- `404 Not Found` — Category not found
- `400 Bad Request` — Validation failed

**Side effects:** updates the linked budget's `spentAmount` and `status` for the transaction's period.

### PATCH `/transactions/:id`

Update any field. Changing `categoryId` or `type` re-validates type/category matching and re-syncs budget spend for both old and new periods.

**Auth:** JWT Required

**Errors:**
- `422 Unprocessable Entity` — Transaction type does not match category type
- `404 Not Found` — Transaction or category not found

### DELETE `/transactions/:id`

**Auth:** JWT Required

**Side effects:** subtracts the transaction amount from the linked budget's `spentAmount` and recalculates `status`.

---

## Budgets

Budgets are per expense category per month (`YYYY-MM`). A budget's `status` is always evaluated server-side (never set by the client) and progresses through `DRAFT → ACTIVE → OVER_BUDGET / COMPLETED → ARCHIVED`. Budget writes can trigger push notifications (see [Push Notifications](#push-notifications)).

### GET `/budgets`

List the user's budgets for a period, along with a monthly allocation summary. Only non-deleted EXPENSE categories are included.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `month` | string | No | `YYYY-MM` period (defaults to current month) |
| `periodMonth` | string | No | Alias for `month` |
| `status` | string | No | Filter by `BudgetStatus` |
| `categoryId` | string | No | Filter by category |

**Response (200):**

```json
{
  "data": {
    "budgets": [
      {
        "id": "cuid",
        "allocatedAmount": 50000,
        "spentAmount": 32000,
        "status": "ACTIVE",
        "periodMonth": "2026-08",
        "categoryId": "cuid",
        "category": {
          "id": "cuid",
          "name": "Food & Drinks",
          "icon": "🍕",
          "color": "#FF3B30"
        }
      }
    ],
    "summary": {
      "income": 100000,
      "allocated": 50000,
      "remainingToAllocate": 50000,
      "isOverAllocated": false
    }
  },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

### GET `/budgets/:id`

**Auth:** JWT Required

**Errors:**
- `404 Not Found` — Budget not found for this user

### POST `/budgets`

Create a budget for an expense category and period.

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `categoryId` | string | Yes | Expense category owned by the user |
| `periodMonth` | string | No | `YYYY-MM` (defaults to current month) |
| `allocatedAmount` | number | No | ≥ 0, max 999999999999.99 (defaults to 0) |

**Response (201):** the created budget (status `DRAFT`), with `category` included.

**Errors:**
- `404 Not Found` — Category not found
- `422 Unprocessable Entity` — Category is an INCOME category
- `409 Conflict` — A budget already exists for this category and period
- `400 Bad Request` — Validation failed

**Side effects:** recomputes the period summary; if total allocations exceed total income and no over-allocation warning has been sent for the period yet, an over-allocation push notification is fired.

### PATCH `/budgets/:id`

Update the budget's allocated amount. Status and spend are re-evaluated.

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `allocatedAmount` | number | Yes | ≥ 0, max 999999999999.99 |

**Response (200):** the updated budget, with `category` included.

**Errors:**
- `404 Not Found` — Budget not found for this user

**Side effects:** fires `THRESHOLD_80`/`OVER_BUDGET` notifications when spend crosses the relevant boundary, plus the once-per-period over-allocation warning if applicable.

### DELETE `/budgets/:id`

Delete a budget. Only `DRAFT` or `ARCHIVED` budgets can be deleted.

**Auth:** JWT Required

**Response (200):**

```json
{
  "data": { "message": "Budget deleted" },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

**Errors:**
- `404 Not Found` — Budget not found for this user
- `409 Conflict` — Budget status is not `DRAFT` or `ARCHIVED`

### POST `/budgets/copy-period`

Copy all of a source month's budgets into a target month. Target budgets start with `spentAmount: 0` and status `DRAFT`; existing target budgets are left unchanged (upsert).

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `fromMonth` | string | Yes | `YYYY-MM` |
| `toMonth` | string | Yes | `YYYY-MM`, must differ from `fromMonth` |

**Response (200):**

```json
{
  "data": { "copied": 3 },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

**Errors:**
- `400 Bad Request` — Source and target months are the same

**Side effects:** recomputes the target month's summary and may fire the once-per-period over-allocation warning.

---

## Analytics

All analytics endpoints are scoped to the authenticated user and provide read-only aggregated data.

### GET `/analytics/summary`

Get income vs expense totals for a given period.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `periodMonth` | string | No | `YYYY-MM` (defaults to current month) |

**Response (200):**

```json
{
  "data": {
    "period": "2026-08",
    "totalIncome": 5000,
    "totalExpenses": 3200,
    "netBalance": 1800
  },
  "meta": { "timestamp": "2026-08-21T12:00:00.000Z" }
}
```

### GET `/analytics/by-category`

Get spending breakdown by expense category for a period.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `periodMonth` | string | No | `YYYY-MM` (defaults to current month) |

**Response (200):**

```json
{
  "data": {
    "period": "2026-08",
    "categories": [
      {
        "categoryId": "cuid",
        "categoryName": "Food & Drinks",
        "icon": "🍕",
        "color": "#FF3B30",
        "totalSpent": 850,
        "transactionCount": 12,
        "percentage": 26.56
      }
    ],
    "grandTotal": 3200
  },
  "meta": { "timestamp": "2026-08-21T12:00:00.000Z" }
}
```

### GET `/analytics/trend`

Get monthly income and expense totals for the last N months.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `months` | number | No | Number of months (2–12, defaults to 6) |

**Response (200):**

```json
{
  "data": [
    {
      "periodMonth": "2026-03",
      "income": 4500,
      "expenses": 3800,
      "netBalance": 700
    },
    {
      "periodMonth": "2026-04",
      "income": 5000,
      "expenses": 4200,
      "netBalance": 800
    }
  ],
  "meta": { "timestamp": "2026-08-21T12:00:00.000Z" }
}
```

---

## Dashboard

### GET `/dashboard`

Get the full income-first dashboard payload for a period. Returns income, allocated, spent, all-time balance, remaining to allocate, over-allocation flag, per-category budget progress, and recent transactions.

**Auth:** JWT Required

**Query Params:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `periodMonth` | string | No | `YYYY-MM` (defaults to current month) |

**Response (200):**

```json
{
  "data": {
    "period": "2026-08",
    "income": 5000,
    "allocated": 3500,
    "spent": 2800,
    "balance": 12450.75,
    "remainingToAllocate": 1500,
    "isOverAllocated": false,
    "budgetProgress": [
      {
        "categoryId": "cuid",
        "categoryName": "Food & Drinks",
        "icon": "🍕",
        "colorHex": "#FF3B30",
        "allocated": 800,
        "spent": 650,
        "remaining": 150,
        "percentUsed": 81,
        "status": "ACTIVE"
      }
    ],
    "recentTransactions": [
      {
        "id": "cuid",
        "amount": 45.50,
        "description": "Groceries",
        "date": "2026-08-20T14:30:00.000Z",
        "type": "EXPENSE",
        "categoryId": "cuid",
        "category": {
          "id": "cuid",
          "name": "Food & Drinks",
          "icon": "🍕",
          "color": "#FF3B30"
        }
      }
    ]
  },
  "meta": { "timestamp": "2026-08-21T12:00:00.000Z" }
}
```

**Key distinction:** `balance` is the all-time net worth (`SUM(income) - SUM(expenses)` across all periods). `remainingToAllocate` is the period-scoped allocation budget (`period income - period allocated`). These are intentionally distinct values.

---

## Users

All user endpoints are scoped to the authenticated user.

### PATCH `/users/me/push-token`

Register (or replace) the user's Expo push token so budget events can be delivered as push notifications.

**Auth:** JWT Required

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `pushToken` | string | Yes | Matches `^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$` |

**Response (200):**

```json
{
  "data": { "message": "Push token saved" },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

### DELETE `/users/me/push-token`

Remove the user's push token.

**Auth:** JWT Required

**Response (200):**

```json
{
  "data": { "message": "Push token removed" },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

### POST `/users/me/push-token/test`

Send a test push notification to the registered token.

**Auth:** JWT Required

**Response (200):**

```json
{
  "data": { "message": "Test push sent" },
  "meta": { "timestamp": "2026-08-11T12:00:00.000Z" }
}
```

**Errors:**
- `404 Not Found` — No push token registered (`PATCH /users/me/push-token` first)
- `502 Bad Gateway` — Expo rejected the push (see server logs)

---

## Push Notifications

Budget events generate push notifications via the Expo push service:

| Event | When | Title |
|-------|------|-------|
| `THRESHOLD_80` | spend crosses 80% of allocation | "Budget almost reached" |
| `OVER_BUDGET` | spend crosses 100% of allocation | "Budget exceeded" |
| Over-allocation | total allocated > total income for a period | "Over-allocation warning" |

- Threshold/over-budget events fire only at the moment spend **crosses** the boundary, and only on transaction writes and allocation updates
- Over-allocation warnings fire **once per period** (tracked in the `BudgetPeriod` record)
- Notification sends happen **after** the triggering database transaction commits; Expo send failures are logged and do not fail the API request
- When Expo reports `DeviceNotRegistered` or `InvalidCredentials`, the stored push token is cleared automatically
- No notification is sent when the user has no registered push token

---

## Rate Limiting

All endpoints are rate-limited to **5 requests per IP per minute**. Exceeding this limit returns a `429 Too Many Requests` response.

---

## Email Templates

Both verification and password reset emails are sent via Nodemailer (SMTP). Templates use inline CSS and are HTML-formatted with the verification code displayed prominently.

- **Verification email** — Subject: "Your Budget Tracker Verification Code"
- **Password reset email** — Subject: "Your Budget Tracker Password Reset Code"

Both codes expire after **10 minutes**.
