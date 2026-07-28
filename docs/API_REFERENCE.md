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

Most endpoints require a JWT access token in the `Authorization` header:

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

## Rate Limiting

All endpoints are rate-limited to **5 requests per IP per minute**. Exceeding this limit returns a `429 Too Many Requests` response.

---

## Email Templates

Both verification and password reset emails are sent via Nodemailer (SMTP). Templates use inline CSS and are HTML-formatted with the verification code displayed prominently.

- **Verification email** — Subject: "Your Budget Tracker Verification Code"
- **Password reset email** — Subject: "Your Budget Tracker Password Reset Code"

Both codes expire after **10 minutes**.
