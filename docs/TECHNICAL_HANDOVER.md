# TripzoBox – Technical Handover Guide

**Project:** TripzoBox – Explore The World Without Limits  
**Date:** November 2026  
**Target Audience:** Lead Engineers, DevOps Engineers, and Full-Stack Developers  

---

## 1. System Architecture

TripzoBox is built as a modern, decoupled Single-Page Application (SPA) paired with a high-performance RESTful API backend:

- **Frontend Client:** React 18 with TypeScript, Vite bundler, Tailwind CSS for styling, and Lucide React icons.
- **Backend Service:** Node.js with Express and TypeScript, structured using modular MVC (Model-View-Controller) architecture with dedicated service and middleware layers.
- **Database:** MongoDB Atlas managed replica set accessed through Mongoose 8.x ODM with strict schema validation and unique compound indexing.
- **Authentication:** JWT (JSON Web Tokens) with cryptographic versioning (`tokenVersion`), atomic single-use password reset tokens (`ConsumedResetToken`), and Google OAuth 2.0 integration.

---

## 2. Directory Structure

```
TripzoBox/
├── Backend/
│   ├── src/
│   │   ├── config/             # Environment variables, database, passport config
│   │   ├── controllers/        # Request handlers (auth, user, trips, vault, admin)
│   │   ├── middleware/         # Auth verification, rate limiting, error handling, audit
│   │   ├── models/             # Mongoose schemas (User, Trip, Story, ConsumedResetToken, etc.)
│   │   ├── routes/             # Express API routes (/api/v1/...)
│   │   ├── scripts/            # Database initialization & admin seed utilities
│   │   ├── services/           # Business logic (email, Google OAuth, identity verification)
│   │   ├── types/              # Backend TypeScript interface definitions
│   │   ├── utils/              # Cryptographic helpers, validators, token generators
│   │   ├── app.ts              # Express application configuration & middleware pipeline
│   │   └── server.ts           # HTTP server listener & graceful shutdown handlers
│   ├── tests/                  # Vitest unit & integration test suites
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── public/                 # Static assets, favicon, robots.txt, _redirects
│   ├── src/
│   │   ├── components/         # Reusable UI primitives, modals, layout elements
│   │   ├── context/            # React contexts (AuthContext, TripsContext, VaultContext, DiaryContext)
│   │   ├── data/               # Curated promotional review content & static metadata
│   │   ├── hooks/              # Custom React utility hooks
│   │   ├── layouts/            # Layout shells (PublicShell, AppShell, AdminShell)
│   │   ├── lib/                # API client adapters (Axios instances, token handlers)
│   │   ├── pages/              # Route views (Home, Trips, TravelVault, Diary, Admin)
│   │   ├── types/              # Frontend TypeScript models
│   │   ├── App.tsx             # Root React component & route definitions
│   │   └── main.tsx            # Vite entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/                       # Complete project handover & operational documentation
```

---

## 3. Database Models & Schema Definitions

### 3.1 User (`Backend/src/models/User.ts`)
- `name`: String (Required, trimmed)
- `email`: String (Required, unique, lowercase, indexed)
- `password`: String (Bcrypt hashed, omitted from JSON output)
- `role`: Enum (`'user' | 'admin' | 'superadmin'`)
- `status`: Enum (`'active' | 'suspended' | 'deactivated'`)
- `tokenVersion`: Number (Monotonically incrementing integer for instant session revocation)
- `securityQuestion`: String (Optional user-selected security challenge question)
- `securityAnswerHash`: String (Bcrypt hashed answer, case-insensitive comparison)
- `recoveryCodes`: Array of `{ codeHash: String, used: Boolean, usedAt: Date }`
- `googleId`: String (Unique, sparse index for Google OAuth linkage)
- `location`: `{ city: String, country: String }` (Defaults to unset/empty)
- `isVerified`: Boolean (Email verification flag)

### 3.2 ConsumedResetToken (`Backend/src/models/ConsumedResetToken.ts`)
- `jti`: String (Unique JWT ID identifier; enforced via unique MongoDB index)
- `userId`: ObjectId referencing `User`
- `expiresAt`: Date (TTL index automatically purges records after token expiry)
- `consumedAt`: Date (Timestamp of redemption)

### 3.3 Trip (`Backend/src/models/Trip.ts`)
- `title`, `destination`, `startDate`, `endDate`, `budget`
- `creatorId`: ObjectId referencing `User`
- `itinerary`: Array of `{ day: Number, activities: [String] }`
- `collaborators`: Array of `{ userId: ObjectId, role: 'viewer' | 'editor' }`

### 3.4 Story / Trip Diary (`Backend/src/models/Story.ts`)
- `userId`: ObjectId referencing `User`
- `title`: String
- `content`: String
- `location`: String
- `mediaUrls`: Array of Strings
- `isPublished`: Boolean (Controls public explore visibility)

### 3.5 VaultDocument (`Backend/src/models/VaultDocument.ts`)
- `userId`: ObjectId referencing `User` (Strict multi-tenant boundary)
- `title`, `type` (`Passport` | `Insurance` | `Tickets` | `Other`)
- `fileUrl`, `fileSize`, `encryptedData`
- `trustedContactAccess`: Array of authorized contact emails

---

## 4. Complete API Endpoint Catalog

All API endpoints are prefixed with `/api/v1` (with OAuth routes also accessible at `/api/auth`):

### 4.1 Authentication & Profile
- `POST /api/v1/auth/register` — Register a new account (accepts security question & answers, returns recovery codes).
- `POST /api/v1/auth/login` — Authenticate using email and password, returns JWT session.
- `GET /api/v1/auth/me` — Retrieve currently authenticated user profile.
- `GET /api/v1/auth/google` — Initiate Google OAuth 2.0 redirection flow.
- `GET /api/v1/auth/google/callback` — Google OAuth callback receiver.
- `POST /api/v1/auth/forgot-password` — Initiate email-based password reset.
- `POST /api/v1/auth/reset-password` — Consume atomic single-use reset token and update password.
- `POST /api/v1/auth/security-question/get` — Fetch security question for an account by email.
- `POST /api/v1/auth/security-question/verify` — Verify security answer and issue reset token.
- `POST /api/v1/auth/recovery-code/verify` — Verify single-use recovery code and issue reset token.
- `PUT /api/v1/auth/profile` — Update user profile details (name, bio, location).
- `POST /api/v1/auth/logout` — Revoke active session tokens.

### 4.2 Travel Vault
- `GET /api/v1/vault/documents` — Fetch encrypted documents belonging to authenticated user.
- `POST /api/v1/vault/documents` — Upload and store a new vault document.
- `DELETE /api/v1/vault/documents/:id` — Delete a document with ownership enforcement.
- `POST /api/v1/vault/trusted-contacts` — Add or modify emergency trusted contacts.

### 4.3 Trips & Planning
- `GET /api/v1/trips` — Fetch trips associated with user (created or joined).
- `POST /api/v1/trips` — Create a new trip.
- `GET /api/v1/trips/:id` — Retrieve specific trip details.
- `PUT /api/v1/trips/:id` — Update trip details and itinerary.
- `DELETE /api/v1/trips/:id` — Delete a trip (creator only).

### 4.4 Trip Diary & Stories
- `GET /api/v1/diary/entries` — Retrieve private user diary entries.
- `POST /api/v1/diary/entries` — Create a new private entry.
- `GET /api/v1/stories/community` — Fetch published public stories for Explore feed.

### 4.5 Administrative Console
- `POST /api/v1/admin/login` — Admin authentication.
- `GET /api/v1/admin/users` — Paginated user directory with status filters.
- `PATCH /api/v1/admin/users/:id/status` — Suspend or activate a user account.
- `GET /api/v1/admin/audit-logs` — Fetch immutable security audit trail.

---

## 5. Local Setup & Build Instructions

### Prerequisites
- Node.js (v18.0.0 or v20.0.0+)
- MongoDB (Local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- Git

### Installation Steps
```bash
# 1. Clone repository
git clone <repository_url>
cd TripzoBox

# 2. Install dependencies
cd Backend && npm install
cd ../Frontend && npm install
cd ..

# 3. Seed initial superadmin account
cd Backend
npm run seed:admin
# Output: Superadmin initialized: admin@tripzobox.com

# 4. Run test suites
npm test

# 5. Build applications
cd ../Frontend && npm run build
cd ../Backend && npm run build
```

---

## 6. Security & Token Revocation Architecture

1. **Monotonic `tokenVersion` Pattern:**  
   Every user record maintains a `tokenVersion` counter. Whenever a password is reset, security questions are changed, or "Logout from all devices" is triggered, `tokenVersion` increments atomically (`$inc: { tokenVersion: 1 }`). Any existing JWT token carrying an outdated version is rejected on the next request.
2. **Persistent Single-Use Token Registry:**  
   Password reset tokens contain a unique `jti`. Upon redemption, the JTI is registered in the MongoDB `ConsumedResetToken` collection with a unique index. Even across multi-instance clusters or server restarts, replaying a consumed token fails with `401 Unauthorized / Token has already been used`.
3. **Compensating Rollbacks:**  
   If an unexpected database interruption occurs between token consumption and password hashing, compensating rollback mechanisms ensure the user is not locked out.
