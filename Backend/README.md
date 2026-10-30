# TripzoBox Backend API

Production-ready RESTful backend API for the TripzoBox travel community platform built with **Node.js, Express, TypeScript, and MongoDB with Mongoose**.

---

## 1. Architecture Overview

The backend uses a clean, maintainable layered architecture:
```
Backend/
  src/
    config/         # Database connection and environment validation
    controllers/    # HTTP request handling and response orchestration
    middleware/     # Authentication, validation, rate limiting, error handling
    models/         # Mongoose schemas and database models
    routes/         # Express API route definitions
    utils/          # Response formatting, JWT signing, password helpers
    validators/     # Zod schema validation rules
    scripts/        # Seed scripts and database utilities
    app.ts          # Express application initialization and middleware
    server.ts       # Server entry point and graceful shutdown
  tests/            # Vitest integration tests
  .env.example      # Example environment configuration
  package.json      # Dependencies and scripts
  tsconfig.json     # TypeScript configuration
```

---

## 2. API Endpoints (`/api/v1`)

### Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Register new account (name, email/phone, password) | No |
| POST | `/api/v1/auth/login` | Authenticate user & issue JWT / HttpOnly cookie | No |
| POST | `/api/v1/auth/logout` | Clear authentication session & cookies | No |
| GET | `/api/v1/auth/me` | Retrieve authenticated user profile | Yes |
| PUT | `/api/v1/auth/profile` | Update profile details (bio, travel style, interests) | Yes |
| POST | `/api/v1/auth/security-question` | Configure account recovery question | Yes |
| GET | `/api/v1/auth/recovery-codes` | Retrieve or generate account recovery codes | Yes |
| POST | `/api/v1/auth/forgot-password/request` | Request password reset code via email or phone | No |
| POST | `/api/v1/auth/forgot-password/verify-otp` | Verify 6-digit OTP code | No |
| POST | `/api/v1/auth/forgot-password/reset` | Set new password | No |

### Trips & Discovery (`/api/v1/trips`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/trips` | Discover trips with filters (destination, dates, duration, budget, etc.) | Optional |
| GET | `/api/v1/trips/my` | Retrieve trips organized by or joined by current user | Yes |
| GET | `/api/v1/trips/saved` | Retrieve user's bookmarked trips | Yes |
| POST | `/api/v1/trips/saved/:id/toggle` | Bookmark or unbookmark a trip | Yes |
| GET | `/api/v1/trips/:id` | Retrieve detailed trip itinerary, members, rules | Optional |
| POST | `/api/v1/trips` | Create and publish a new trip | Yes |
| PUT | `/api/v1/trips/:id` | Update trip details (Trip Leader only) | Yes |
| DELETE | `/api/v1/trips/:id` | Cancel and delete trip (Trip Leader only) | Yes |
| PUT | `/api/v1/trips/:id/room-type` | Switch visibility between public and private | Yes |
| POST | `/api/v1/trips/:id/join` | Submit a join request | Yes |
| GET | `/api/v1/trips/:id/requests` | List join requests (Trip Leader only) | Yes |
| POST | `/api/v1/trips/:id/requests/:requestId/accept` | Approve join request & add member | Yes |
| POST | `/api/v1/trips/:id/requests/:requestId/decline` | Decline join request | Yes |

### Destinations (`/api/v1/destinations`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/destinations` | List destinations by category (Mountains, Beaches, Cities, etc.) | No |
| GET | `/api/v1/destinations/:slug` | Retrieve single destination details and attractions | No |
| POST | `/api/v1/destinations` | Add a new community destination or hidden spot | Yes |

### Travel Diary & Stories (`/api/v1/diary`, `/api/v1/stories`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/diary` | Retrieve user's travel diary entries | Yes |
| POST | `/api/v1/diary` | Save a new diary experience | Yes |
| PUT | `/api/v1/diary/:id` | Update diary experience | Yes |
| DELETE | `/api/v1/diary/:id` | Remove diary experience | Yes |
| GET | `/api/v1/stories` | Discover travel stories with filters & sorting | Optional |
| GET | `/api/v1/stories/:slug` | Retrieve full story guide, photos, and views | Optional |
| POST | `/api/v1/stories` | Publish a travel story | Yes |
| PUT | `/api/v1/stories/:id` | Edit published story | Yes |
| DELETE | `/api/v1/stories/:id` | Delete story | Yes |
| POST | `/api/v1/stories/:id/like` | Like or unlike a story | Yes |

### Messages & Notifications (`/api/v1/messages`, `/api/v1/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/messages/threads` | List group discussion threads for confirmed trips | Yes |
| GET | `/api/v1/messages/threads/:tripId` | Get messages in a trip discussion | Yes |
| POST | `/api/v1/messages/threads/:tripId` | Post a message into a trip discussion | Yes |
| GET | `/api/v1/notifications` | Get notifications and unread counter | Yes |
| PUT | `/api/v1/notifications/:id/read` | Mark individual notification as read | Yes |
| PUT | `/api/v1/notifications/read-all` | Mark all notifications as read | Yes |

### Travel Vault & Safety (`/api/v1/vault`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/vault/documents` | Get user's secure travel documents | Yes |
| POST | `/api/v1/vault/documents` | Add document (Passport, Aadhaar, Insurance, etc.) | Yes |
| PUT | `/api/v1/vault/documents/:id` | Update document details | Yes |
| DELETE | `/api/v1/vault/documents/:id` | Delete document | Yes |
| GET | `/api/v1/vault/emergency-contacts` | List emergency contacts | Yes |
| POST | `/api/v1/vault/emergency-contacts` | Add emergency contact | Yes |
| DELETE | `/api/v1/vault/emergency-contacts/:id` | Delete emergency contact | Yes |
| GET | `/api/v1/vault/trusted-contacts` | List trusted contacts | Yes |
| PUT | `/api/v1/vault/trusted-contacts/:id/toggle`| Toggle vault access permission | Yes |
| GET | `/api/v1/vault/shared-access` | List shared document records | Yes |
| POST | `/api/v1/vault/shared-access` | Share document with trip member | Yes |
| DELETE | `/api/v1/vault/shared-access/:id` | Revoke shared document access | Yes |
| GET | `/api/v1/vault/settings` | Get vault security settings & emergency config | Yes |
| PUT | `/api/v1/vault/emergency-config` | Update emergency access configuration | Yes |
| PUT | `/api/v1/vault/security-settings` | Update auto-lock and 2FA settings | Yes |

### File Uploads (`/api/v1/upload`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/upload` | Upload photo or document (multipart/form-data) | Yes |

---

## 3. Environment Variables

Create a `.env` file inside `Backend/`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/tripzobox
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long_for_security
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret_key_here
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

---

## 4. How to Run Locally

### 1. Database Setup
Ensure MongoDB is running locally:
```bash
# Verify connection
mongod --dbpath <data-dir>
```

### 2. Populate Database with Seed Data
```bash
npm run seed
```

### 3. Start Backend Server
```bash
npm run server
```

### 4. Start Frontend
```bash
npm run dev
```

### 5. Run Automated Tests
```bash
npm run test
```

### 6. Build Both for Production
```bash
npm run build
```

