# TripzoBox – Production Google OAuth Login Failure Investigation and Fix Report

**Date:** November 25, 2026  
**Production Frontend:** https://tripzobox.com  
**Production Login Page:** https://tripzobox.com/login  
**Production Backend (Render):** https://tripzobox-api.onrender.com  

---

## Executive Summary

When a user on `https://tripzobox.com/login` clicked **"Continue with Google"**, the application failed with:
> *"Authentication server timed out. Please verify the backend is running on http://localhost:5000."*

A thorough forensic investigation revealed that:
1. **The Render backend is healthy and responding** (HTTP 200 on `/health` and HTTP 302 on `/api/auth/google`), but it operates on Render's free tier, which spins down into sleep during idle periods.
2. A cold start on Render requires **20 to 30 seconds**.
3. In `Frontend/src/pages/AuthPage.tsx`, the Google OAuth button handler executed a client-side `fetch('/health')` with a hardcoded **5-second timeout** (`window.setTimeout(() => controller.abort(), 5000)`).
4. When the Render instance was sleeping or taking longer than 5 seconds, `controller.abort()` fired an `AbortError`.
5. The catch block in `AuthPage.tsx` had a hardcoded string displaying `"Please verify the backend is running on http://localhost:5000."` to production end-users.
6. Furthermore, `Frontend/.env.production` was missing from the repository, and `Frontend/src/lib/api.ts` had a fallback that defaulted to `http://localhost:5000/api/v1` if environment variables were omitted during build.

All issues have been resolved without UI changes, preserving all existing authentication flows and local development configurations.

---

## Task 1: Complete Google Authentication Flow Trace

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser (tripzobox.com)
    participant FE as Frontend (AuthPage.tsx)
    participant BE as Backend (tripzobox-api.onrender.com)
    participant G as Google OAuth 2.0 (accounts.google.com)
    participant DB as MongoDB Atlas

    Note over User, FE: User visits https://tripzobox.com/login
    User->>FE: Clicks "Continue with Google"
    Note over FE: Previously: Blocked by 5s fetch('/health') abort timer<br/>Fixed: Directly initiates browser navigation
    FE->>BE: GET /api/auth/google?redirect=/app/dashboard
    Note over BE: Generates PKCE code_challenge & state cookie
    BE-->>User: 302 Found (Set-Cookie: tripzobox_oauth_state; Lax; Secure)<br/>Location: accounts.google.com/o/oauth2/v2/auth?...
    User->>G: User selects Google account & consents
    G-->>User: 302 Redirect to Backend Callback URI
    User->>BE: GET /api/auth/google/callback?code=...&state=...
    Note over BE: Validates PKCE verifier & state cookie<br/>Exchanges Google code for ID token
    BE->>DB: Finds or creates user profile
    BE->>DB: Stores temporary 60-second single-use OAuthHandoffCode
    BE-->>User: 302 Redirect to https://tripzobox.com/login?oauth=google&code=HANDOFF_CODE
    User->>FE: Lands on login page with oauth parameters
    FE->>BE: POST /api/v1/auth/google/exchange { code: HANDOFF_CODE }
    Note over BE: Atomically consumes handoff code<br/>Issues JWT & Sets HTTP-only auth cookie
    BE-->>FE: 200 OK { token, user }
    FE->>User: Confetti & Redirects to /app/dashboard
```

### Where the Failure Occurred
- **Stage of Failure:** Step 2 (Frontend initiating Google OAuth).
- **Failure Mechanism:** The frontend button handler in `AuthPage.tsx` ran `fetch(`${backendOrigin}/health`, { signal: controller.signal })` with a 5000ms abort limit.
- **Why it failed on production:** When the Render instance was idle, spinning up took 20-30s. The abort triggered at 5s, before the server could finish responding, and entered the catch block which explicitly printed `Please verify the backend is running on http://localhost:5000.`

---

## Task 2: Audit of Localhost References

| Location | Original Reference | Impact | Resolution |
| :--- | :--- | :--- | :--- |
| `Frontend/src/pages/AuthPage.tsx:429` | `'Authentication server timed out. Please verify the backend is running on http://localhost:5000.'` | Displayed bogus localhost message to production users on timeout | Removed blocking fetch and replaced with direct browser navigation |
| `Frontend/src/lib/api.ts:10` | `'http://localhost:5000/api/v1'` (unconditional fallback) | Production builds without explicit env var defaulted to localhost | Implemented dynamic `resolveApiBaseUrl()` detecting production hostnames |
| `Frontend/src/lib/adminApi.ts:20` | `'http://localhost:5000/api/v1'` (unconditional fallback) | Admin panel defaulted to localhost in production | Implemented dynamic `resolveApiBaseUrl()` |
| `Frontend/.env.production` | Missing | Vite build fell back to `.env` | Created `.env.production` pointing to `https://tripzobox-api.onrender.com/api/v1` |
| `Backend/src/config/env.ts:45` | `GOOGLE_CALLBACK_URL \|\| 'http://localhost:5000/api/auth/google/callback'` | If unset in Render, OAuth callback defaulted to localhost | Added `isProduction` check to default to Render callback |
| `Backend/src/services/googleOAuthService.ts:35` | Hardcoded localhost callback fallback | Localhost callback if env var omitted | Added production check defaulting to Render backend callback |
| `Backend/src/services/identityVerificationService.ts:49` | Hardcoded `http://localhost:5173/app/profile...` | IDV redirection sent users to localhost | Changed to `${config.frontendUrl}/app/profile...` |
| `Frontend/src/pages/admin/AdminAuthSettingsPage.tsx:548, 1053` | Placeholder `http://localhost:5000/...` | Misleading UI input placeholder | Updated placeholders to Render production URLs |

---

## Task 3: Production Environment Configuration Audit

### Expected Production URLs
- **Frontend URL:** `https://tripzobox.com`
- **Backend URL:** `https://tripzobox-api.onrender.com`

### Verification Findings
1. **CORS Configuration (`Backend/src/app.ts`):**
   - Configured with `credentials: true`.
   - Origins allowed: `https://tripzobox.com`, `https://admin.tripzobox.com`, `*.tripzobox.com`, and `config.frontendUrl`.
   - Headers: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`, `Origin`.
2. **Cookie & Session Handling:**
   - Auth cookie (`tripzobox_token`): `SameSite=None`, `Secure=true`, `HttpOnly=true` in production (supports cross-site API calls between `tripzobox.com` and `onrender.com`).
   - OAuth state cookie (`tripzobox_oauth_state`): `SameSite=Lax`, `Secure=true`, `HttpOnly=true` (accompanies top-level GET redirect from Google to `onrender.com/api/auth/google/callback`).

---

## Task 4: Google Cloud Console Configuration

Live verification of `https://tripzobox-api.onrender.com/api/auth/google` confirmed the live parameters:
- **Client ID on Render:** `468263600275-5ftvkesg7quou9ilk7sekeono66i9ci9.apps.googleusercontent.com`
- **Redirect URI issued:** `https://tripzobox-api.onrender.com/api/auth/google/callback`

### Google Cloud Console Checklist
In the Google Cloud Console (under APIs & Services > Credentials > OAuth 2.0 Client IDs):

#### Authorized JavaScript Origins
```
https://tripzobox.com
https://tripzobox-api.onrender.com
http://localhost:5173
http://localhost:5000
```

#### Authorized Redirect URIs
```
https://tripzobox-api.onrender.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

> [!IMPORTANT]
> The redirect URI must be the **backend** callback (`https://tripzobox-api.onrender.com/api/auth/google/callback`), NOT the frontend `/login` URL. The backend receives Google's auth code and PKCE verifier, creates/fetches the user, issues the short-lived `OAuthHandoffCode`, and safely redirects the user to `https://tripzobox.com/login?oauth=google&code=...`.

---

## Task 5: Live Render Backend Verification

A direct live probe of the deployed Render instance was conducted:

1. **Health Check Probe:**
   ```bash
   GET https://tripzobox-api.onrender.com/health
   ```
   **Response (HTTP 200 OK):**
   ```json
   {
     "success": true,
     "message": "TripzoBox API Server OK",
     "data": {
       "status": "healthy",
       "database": "connected",
       "timestamp": "2026-11-25T05:32:00.456Z"
     }
   }
   ```
   - MongoDB database connection: **Connected**
   - API health status: **Healthy**

2. **Google OAuth Initiation Probe:**
   ```bash
   GET https://tripzobox-api.onrender.com/api/auth/google
   ```
   **Response (HTTP 302 Found):**
   - Status: `302 Found`
   - Set-Cookie: `tripzobox_oauth_state=...; Path=/; HttpOnly; Secure; SameSite=Lax`
   - Location: `https://accounts.google.com/o/oauth2/v2/auth?access_type=online&scope=openid%20email%20profile&...&client_id=468263600275-5ftvkesg7quou9ilk7sekeono66i9ci9.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Ftripzobox-api.onrender.com%2Fapi%2Fauth%2Fgoogle%2Fcallback`

---

## Task 6: Files Modified & Implemented Fixes

1. `Frontend/src/lib/api.ts`:
   Added `resolveApiBaseUrl()` that detects whether the application is running in production (`tripzobox.com` or `import.meta.env.PROD`). It automatically falls back to `https://tripzobox-api.onrender.com/api/v1` instead of `localhost:5000`.
2. `Frontend/src/lib/adminApi.ts`:
   Added matching `resolveApiBaseUrl()` to safeguard the admin client.
3. `Frontend/src/pages/AuthPage.tsx`:
   Eliminated the blocking 5-second `fetch('/health')` abort gate and hardcoded localhost error string. "Continue with Google" now navigates directly via `window.location.href = authApi.getGoogleAuthUrl(getRedirectTarget())`.
4. `Frontend/.env.production`:
   Created production environment file:
   ```env
   VITE_API_BASE_URL=https://tripzobox-api.onrender.com/api/v1
   VITE_API_URL=https://tripzobox-api.onrender.com/api/v1
   ```
5. `Frontend/.env.example`:
   Documented development and production settings.
6. `Backend/src/config/env.ts`:
   Added production fallback for `googleCallbackUrl` (`isProduction ? 'https://tripzobox-api.onrender.com/api/auth/google/callback' : 'http://localhost:5000/api/auth/google/callback'`).
7. `Backend/src/services/googleOAuthService.ts`:
   Added production callback fallback and dynamic frontend URL resolution.
8. `Backend/src/services/identityVerificationService.ts`:
   Replaced hardcoded `localhost:5173` with `${config.frontendUrl}`.
9. `Frontend/src/pages/admin/AdminAuthSettingsPage.tsx`:
   Updated placeholders from localhost to Render URLs.

---

## Test Execution & Verification

### Build Verification
- **Backend Build (`tsc`):** Clean exit (code 0), zero errors.
- **Frontend Build (`tsc && vite build`):** Clean exit (code 0).
- **Bundle Audit:** Inspected `Frontend/dist/assets/index-DSQq_JfK.js`:
  - Verified `https://tripzobox-api.onrender.com/api/v1` is inlined as default production API URL.
  - Verified the erroneous string `"Please verify the backend is running on http://localhost:5000."` is completely eradicated.

### Automated Test Suites
- `Backend/tests/googleOAuth.test.ts`: **9/9 tests passed (100%)**
- `Backend/tests/authSecurity.test.ts`: **44/44 tests passed (100%)**
- `Backend/tests/clientFeedbackVerification.test.ts`: **10/10 tests passed (100%)**
- **Total Tests Passing:** **63/63 (100%)**

---

## Deployment & Production Action Checklist

1. **Frontend Deployment:**
   - Build frontend using `npm run build` in `Frontend/` (picks up `.env.production`).
   - Deploy `Frontend/dist` to Cloudflare Pages / Vercel / host.
2. **Render Environment Variables (Backend):**
   Verify the following environment variables are set in the Render Dashboard:
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://tripzobox.com`
   - `GOOGLE_CLIENT_ID`: `468263600275-5ftvkesg7quou9ilk7sekeono66i9ci9.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: *(Google OAuth Client Secret)*
   - `GOOGLE_CALLBACK_URL`: `https://tripzobox-api.onrender.com/api/auth/google/callback`
3. **Google Cloud Console:**
   Verify `https://tripzobox-api.onrender.com/api/auth/google/callback` is listed under Authorized redirect URIs.
