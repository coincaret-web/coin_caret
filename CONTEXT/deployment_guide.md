# Production Deployment Guide: Coin Caret (Railway + GitHub Actions)

This guide provides step-by-step instructions for provisioning Railway cloud infrastructure, setting up the dedicated background block worker, configuring production environment variables, and establishing a discrete GitHub Actions CI/CD pipeline.

---

## 1. Railway Infrastructure Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        RAILWAY PROJECT: COIN CARET                     │
├───────────────────────┬────────────────────────┬───────────────────────┤
│ 1. Web Service        │ 2. Background Worker   │ 3. Managed PostgreSQL │
│    Service: coin-caret│    Service: cc-worker  │    Service: cc-postgres│
│    Command: npm start │    Command: npm run    │    PostgreSQL 16      │
│    Port: 3847 / Auto  │             worker:prod│                       │
└───────────┬───────────┴───────────┬────────────┴───────────┬───────────┘
            │                       │                        │
            └───────────────────────┴────────────────────────┘
```

---

## 2. Step-by-Step Railway Provisioning

### Step A: Provision Managed PostgreSQL
1. Log in to your **Railway Dashboard** ([https://railway.app](https://railway.app)).
2. Create a **+ New Project** > Click **Database** > Select **PostgreSQL**.
3. Railway provisions a high-availability PostgreSQL 16 database.
4. Go to **Variables** and verify the reference variable: `${{Postgres.DATABASE_URL}}`.

### Step B: Provision Next.js Web Service
1. Click **+ New** > Select **GitHub Repo** (connect your repository).
2. Name the service `coin-caret-web`.
3. Under **Settings** > **Build & Deploy**:
   - **Build Command:** `npx prisma migrate deploy && npm run build`
   - **Start Command:** `npm start`
4. Under **Settings** > **Networking**:
   - Generate a Railway domain or attach your custom domains (e.g. `app.coincaret.com`, `explorer.coincaret.com`).

### Step C: Provision Background Block Worker Service
1. In the same project, click **+ New** > Select the same GitHub Repo.
2. Name the service `coin-caret-worker`.
3. Under **Settings** > **Build & Deploy**:
   - **Build Command:** `npm run build:worker` (or `tsc -p tsconfig.worker.json`)
   - **Start Command:** `npm run worker:prod`
4. This persistent process runs the 10-second block generation engine and confirms transactions around the clock.

---

## 3. Production Environment Variables (Railway)

Set these variables in Railway for **both** the Web and Worker services:

| Variable | Description / Value |
|:---|:---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (automatic Railway connection) |
| `NEXTAUTH_SECRET` | 32-character random string (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Production URL (e.g. `https://app.coincaret.com` or Railway URL) |
| `ADMIN_SEED_PASSWORD` | Secure password for default platform owner account |
| `BLOCK_INTERVAL_MS` | `10000` (10-second block interval) |
| `STANDARD_FEE_CC` | `0.50` (Standard gas fee per transfer) |
| `REQUIRED_CONFIRMATIONS`| `3` (Blocks required for final settlement) |
| `NODE_ENV` | `production` |

---

## 4. Custom Subdomain & DNS Configuration

If configuring custom subdomains on Cloudflare / GoDaddy:

| Subdomain | Record Type | Target Value |
|:---|:---:|:---|
| `coincaret.com` | `CNAME` / `A` | Railway Public Service Target |
| `app.coincaret.com` | `CNAME` | Railway Web Service Target |
| `explorer.coincaret.com` | `CNAME` | Railway Web Service Target |
| `admin.coincaret.com` | `CNAME` | Railway Web Service Target |

---

## 5. GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

The CI workflow executes **discrete, individual quality steps** so any failure is instantly identifiable:

```yaml
name: Coin Caret CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality-gate:
    name: Quality & Testing Pipeline
    runs-on: ubuntu-latest

    services:
      postgres-test:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: coin_caret_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: 1. Checkout Repository
        uses: actions/checkout@v4

      - name: 2. Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 3. Install Dependencies
        run: npm ci

      - name: 4. Discrete Step: Lint Codebase
        run: npm run lint

      - name: 5. Discrete Step: TypeScript Typecheck
        run: npm run typecheck

      - name: 6. Setup Test Database Schema
        env:
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"
        run: npx prisma migrate deploy

      - name: 7. Discrete Step: Unit Tests
        env:
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"
        run: npm run test:unit

      - name: 8. Discrete Step: Integration Tests (Ledger & Engine)
        env:
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"
        run: npm run test:integration

      - name: 9. Discrete Step: Production Build
        env:
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"
          NEXTAUTH_SECRET: "ci-dummy-secret-key-123456789012"
          NEXTAUTH_URL: "http://127.0.0.1:3847"
        run: npm run build
```
