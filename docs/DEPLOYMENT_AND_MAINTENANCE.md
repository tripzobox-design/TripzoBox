# TripzoBox – Deployment & Maintenance Guide

**Project:** TripzoBox – Explore The World Without Limits  
**Domains:**  
- Production Frontend: `https://tripzobox.com`  
- Production Backend API: `https://tripzobox-api.onrender.com`  
- Database: MongoDB Atlas (Replica Set)  

---

## 1. Hosting Architecture Overview

```
 [Users Worldwide]
         │
         ▼ (HTTPS)
 [Cloudflare CDN & Pages] ─── Serves Pre-built React SPA (HTML / CSS / JS)
         │
         ▼ (API Requests: /api/v1/*)
 [Render Web Service] ──────── Node.js / Express / TypeScript API
         │
         ▼ (TLS Encrypted Mongoose Connection)
 [MongoDB Atlas] ──────────── Multi-region Replica Set Database
```

---

## 2. Frontend Deployment (Cloudflare Pages)

### 2.1 Repository & Branch Configuration
- **Hosting Platform:** Cloudflare Pages
- **Repository:** Connected GitHub repository (`main` branch)
- **Framework Preset:** `Vite` (or `None`)

### 2.2 Build Configuration
- **Root Directory:** `/` (or `Frontend` if configured as subfolder)
- **Build Command:**
  ```bash
  npm run build
  ```
  *(or `npm --prefix Frontend run build` if building from workspace root)*
- **Build Output Directory:**
  `Frontend/dist` (or `dist` if root directory is set to `Frontend`)
- **Node.js Version:** `18.x` or `20.x` (recommended: set `NODE_VERSION=20.18.0` in Environment Variables)

### 2.3 Frontend Environment Variables
Set these variables in the **Cloudflare Pages Dashboard > Settings > Environment Variables**:

| Variable Name | Production Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://tripzobox-api.onrender.com/api/v1` | Points frontend directly to the production Render backend API. |
| `VITE_GOOGLE_CLIENT_ID` | `<YOUR_GOOGLE_OAUTH_CLIENT_ID>` | Client ID from Google Cloud Console for Google Sign-In. |
| `VITE_APP_URL` | `https://tripzobox.com` | Base canonical domain of the production frontend. |

### 2.4 SPA Single-Page Routing (Catch-all)
To prevent `404 Not Found` errors when refreshing deep links (e.g. `/app/vault` or `/login`), ensure a `_redirects` file is present in `Frontend/public/_redirects`:
```
/*    /index.html   200
```
This is already included in `Frontend/public/`.

---

## 3. Backend Deployment (Render)

### 3.1 Service Type
- **Service Name:** `tripzobox-api`
- **Environment:** `Node`
- **Region:** Frankfurt (EU Central) or Oregon (US West) (matches closest user base / MongoDB cluster)
- **Branch:** `main`
- **Root Directory:** `Backend`

### 3.2 Build & Start Commands
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```

### 3.3 Backend Environment Variables Checklist
Configure these in **Render Dashboard > Service > Environment**:

| Variable Name | Required? | Example / Notes |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `5000` (or leave default assigned by Render) |
| `FRONTEND_URL` | Yes | `https://tripzobox.com` |
| `MONGODB_URI` | Yes | `mongodb+srv://<username>:<password>@cluster0.mongodb.net/tripzobox?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | 64-character cryptographically secure random string |
| `JWT_EXPIRES_IN` | Yes | `7d` |
| `GOOGLE_CLIENT_ID` | Yes | `<ID>.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | Yes | `https://tripzobox-api.onrender.com/api/auth/google/callback` |
| `SMTP_HOST` | Yes | e.g., `smtp.gmail.com` or SendGrid / Amazon SES |
| `SMTP_PORT` | Yes | `587` |
| `SMTP_USER` | Yes | SMTP account email address |
| `SMTP_PASS` | Yes | SMTP App Password (keep secret) |
| `EMAIL_FROM` | Yes | `TripzoBox <no-reply@tripzobox.com>` |
| `ADMIN_SECRET_KEY` | Yes | Secret token for administrative operations |

---

## 4. Google Cloud Console OAuth Configuration

To ensure seamless Google Sign-In on production:
1. Navigate to **[Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials**.
2. Select your Web OAuth 2.0 Client ID.
3. Under **Authorized JavaScript Origins**, add:
   - `https://tripzobox.com`
   - `https://tripzobox-api.onrender.com`
4. Under **Authorized Redirect URIs**, add:
   - `https://tripzobox-api.onrender.com/api/auth/google/callback`
   - `https://tripzobox.com/auth/callback`
5. Save changes. Changes take effect within 5 minutes.

---

## 5. Routine Maintenance & Operational Procedures

### 5.1 MongoDB Atlas Backups
- **Automated Snapshots:** Atlas provides automated continuous backups with point-in-time recovery on dedicated tiers (M10+) and daily snapshots on shared tiers.
- **Manual Export Command (Emergency Backup):**
  ```bash
  mongodump --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/tripzobox" --out=./backup-$(date +%F)
  ```

### 5.2 Seeding Admin Accounts
If setting up a fresh environment or resetting admin credentials:
```bash
cd Backend
npm run seed:admin
```
This initializes the superadmin account with secure bcrypt hashing.

### 5.3 Render Free Tier Sleep Notice
- On Render's Free instance tier, the web service automatically spins down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to boot.
- **Recommended Production Upgrade:** Upgrade the Render Web Service to the **Starter tier ($7/month)** to ensure 100% uptime with no cold starts or sleep cycles.

---

## 6. Estimated Monthly Hosting & Infrastructure Costs

| Service | Tier / Plan | Estimated Monthly Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | Free Plan | **$0.00** | Unlimited bandwidth, global CDN, automated SSL |
| **Render Web Service** | Starter Plan | **$7.00** | 24/7 always-on, zero cold-starts, 512MB RAM |
| **MongoDB Atlas** | M0 Free / Serverless | **$0.00 – $9.00** | Scalable document storage with automated SSL |
| **Google Cloud OAuth** | Standard | **$0.00** | Free tier covers standard OAuth 2.0 volume |
| **Transactional Email (Gmail/SES)** | Free / Tier 1 | **$0.00 – $1.00** | Standard SMTP transactional verification |
| **Total Estimated Operating Cost** | — | **~$7.00 – $17.00 / month** | Extremely cost-effective production footprint |
