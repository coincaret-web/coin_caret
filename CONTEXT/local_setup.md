# Local Setup Guide: Coin Caret

This guide provides step-by-step instructions for running the **Coin Caret** platform locally with isolated Development and Test databases using Docker, Prisma, and Next.js.

---

## 1. Prerequisites

- **Node.js:** `v20.x` or `v22.x` (LTS)
- **Package Manager:** `npm` (or `pnpm`)
- **Docker & Docker Desktop:** Running locally for PostgreSQL containers

---

## 2. Docker Setup: Dev & Test Databases

We run two isolated PostgreSQL database instances on explicit IPv4 (`127.0.0.1`):
- **Development DB:** Port `5432` (`coin_caret_dev`)
- **Test DB:** Port `5433` (`coin_caret_test`)

### Option A: One-Liner Docker Commands

Run these two commands in PowerShell / Terminal:

```bash
# 1. Start Development Database (Port 5432)
docker run -d --name coin_caret_dev_db -p 127.0.0.1:5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=coin_caret_dev postgres:16-alpine

# 2. Start Isolated Test Database (Port 5433)
docker run -d --name coin_caret_test_db -p 127.0.0.1:5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=coin_caret_test postgres:16-alpine
```

### Option B: Docker Compose

If using Docker Compose, create/run `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dev-db:
    image: postgres:16-alpine
    container_name: coin_caret_dev_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: coin_caret_dev
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - dev_data:/var/lib/postgresql/data

  test-db:
    image: postgres:16-alpine
    container_name: coin_caret_test_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: coin_caret_test
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - test_data:/var/lib/postgresql/data

volumes:
  dev_data:
  test_data:
```

Start both containers:
```bash
docker compose up -d
```

---

## 3. Environment Variables Configuration

Copy the pre-configured example files into your local environment:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

### Direct Database Connection URLs

| Environment | File | Exact Connection URL |
|:---|:---|:---|
| **Development** | `.env` | `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/coin_caret_dev?schema=public"` |
| **Testing** | `.env.test` | `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"` |

---

## 4. Install Dependencies, Migrate & Seed

```bash
# 1. Install dependencies
npm install

# 2. Apply Prisma schema migrations to Dev DB
npx prisma migrate dev --name init_coin_caret_schema

# 3. Apply Prisma migrations to Test DB
dotenv -e .env.test -- npx prisma migrate deploy

# 4. Seed Dev DB with test wallets, initial CC supply, and demo accounts
npm run db:seed
```

### Pre-configured Seeded Demo Accounts

Running `npm run db:seed` provisions institutional demo accounts with pre-funded native CC balances, cryptographic `CC0x...` addresses, and system ledger accounts:

| Role | Email | Password | Initial Balance | Default CC Address | Notes |
|:---|:---|:---|:---:|:---|:---|
| **Institutional User** | `user@coincaret.com` | `Password123!` | **`5,000.00000000 CC`** | `CC0x7a89bc234def567890123456789abcdef0123456` | Pre-funded vault wallet with initial genesis allocation transaction |
| **Platform Owner** | `admin@coincaret.com` | `AdminPassword123!` | *Sovereign Treasury* | N/A | Full administrative & treasury minting privileges |

> [!TIP]
> On the `/login` screen, you can also click the **"Demo User"** or **"Platform Owner"** buttons for one-click credential autofill.

---

## 5. Running the Application Locally

The local server runs on dedicated non-standard port **`3847`**:

```bash
# Start the Next.js development server (Port 3847)
npm run dev

# (Optional) Run the background block engine in a separate terminal
npm run worker:dev
```

Open your browser at: [http://127.0.0.1:3847](http://127.0.0.1:3847)

---

## 6. Running Tests & Quality Verification

All unit, integration, and E2E tests automatically load `.env.test` and execute against the isolated test database:

```bash
# Run unit tests
npm run test:unit

# Run integration tests (against test DB)
npm run test:integration

# Run E2E tests (Playwright)
npm run test:e2e

# Run complete local CI quality check
npm run ci:quality
```
