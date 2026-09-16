# Current State: Coin Caret (CC)

This document is the authoritative single source of truth for the implementation status, work items, and sprint tracking for **Coin Caret**. Every work item strictly follows the **TDD Instruction Guide** format.

---

## 1. Project Overview & Progress Summary

- **Architecture:** Next.js 16 App Router Modular Monolith (TypeScript, Prisma ORM, PostgreSQL on Railway)
- **Local Dev Port:** `3847` (IPv4 `127.0.0.1`)
- **Dev Database:** `coin_caret_dev` (Port `5432` on `127.0.0.1`)
- **Test Database:** `coin_caret_test` (Port `5433` on `127.0.0.1` via `.env.test`)
- **Current Phase:** Phase 6 — Complete & Verified (Ready for Phase 7)
- **Overall Status:** Phase 6 Quality Gates Passed 100% (44/44 Unit Tests, 44/44 Live PostgreSQL Integration Tests Passing, Zero Lint/Type/Build Errors across 38 Routes)

---

## 2. Phase Breakdown & Work Items

```text
[x] Phase 0: Project Scaffold, Quality Tooling, Dual DB & CI/CD Pipeline
[x] Phase 1: Database Schema, Double-Entry Ledger Core & Identity
[x] Phase 2: Blockchain Engine, Mempool & Background Block Worker
[x] Phase 3: Public Marketing Portal, Motion & SEO Architecture
[x] Phase 4: Web Wallet Application & Core Financial Workflows
[x] Phase 5: Live Block Explorer
[x] Phase 6: Admin Command Center & Treasury Controls
[ ] Phase 7: Full-Stack E2E Verification & Railway Deployment
```

---

### Phase 0 — Project Scaffold, Quality Tooling, Dual DB & CI/CD Pipeline

#### W-001 — Next.js 14 + TypeScript Scaffold with Dedicated Port & IPv4
**Root cause:** A standardized, strictly-typed Next.js App Router foundation is required that runs on dedicated port `3847` and binds explicitly to IPv4 (`127.0.0.1`) to prevent port collisions and DNS latency.
**Goal:** Initialize Next.js App Router with TypeScript, Tailwind CSS, Lucide icons, and dedicated port `3847`.
**Approach:** Initialize project configuration, `tsconfig.json`, `tailwind.config.ts`, and configure custom scripts for port `3847`.

- [x] **RED — Unit (`src/tests/unit/config.test.ts`):**
  - [x] Test: Assert environment configuration loads `PORT=4190` in test and binds to `127.0.0.1`.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend & Config:**
  - [x] Initialize Next.js with TypeScript and strict mode.
  - [x] Configure `next.config.mjs` for clean URL routing and optimization.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Run `npm run dev` → Server starts on `http://127.0.0.1:3847` → Browser loads page → ✅ Done.

---

#### W-002 — Individual Quality Commands & Composite CI Script in `package.json`
**Root cause:** CI checks must have individual commands so developers and CI workflows can test linting, typing, unit tests, E2E tests, and builds independently.
**Goal:** Configure `lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `build`, and `ci:quality` in `package.json`.
**Approach:** Install Vitest, ESLint, TypeScript, and Playwright; configure NPM scripts.

- [x] **RED — Quality Script Verification:**
  - [x] Test: Execute `npm run typecheck` and `npm run test:unit` before configuration.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Config & Scripts:**
  - [x] Add `"typecheck": "tsc --noEmit"`
  - [x] Add `"lint": "next lint"`
  - [x] Add `"test:unit": "dotenv -e .env.test -- vitest run --dir src/tests/unit"`
  - [x] Add `"test:integration": "dotenv -e .env.test -- vitest run --dir src/tests/integration"`
  - [x] Add `"test:e2e": "dotenv -e .env.test -- playwright test"`
  - [x] Add `"ci:quality": "npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run build"`
  - [x] Run `npm run ci:quality` — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Run each command individually → Each passes with zero errors → Run `npm run ci:quality` → Full suite passes → ✅ Done.

---

#### W-003 — Dual Environment & Test Database Isolation (`.env` vs `.env.test`)
**Root cause:** Automated tests must never truncate, wipe, or pollute active development or demo data.
**Goal:** Setup separate `.env` (Port 5432) and `.env.test` (Port 5433) with automated dotenv test loading.
**Approach:** Configure Vitest setup files to load `.env.test` and connect exclusively to `postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test`.

- [x] **RED — Integration (`src/tests/integration/db-isolation.integration.test.ts`):**
  - [x] Test: Connect to database during test run and assert connected database name is `coin_caret_test` (not `coin_caret_dev`).
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] Create `vitest.config.ts` with `dotenv` configuration pointing to `.env.test`.
  - [x] Run integration test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Run `npm run test:integration` → Inspect test DB connection → Confirms isolated `coin_caret_test` database is targeted → ✅ Done.

---

#### W-004 — Discrete GitHub Actions CI/CD Pipeline
**Root cause:** Monolithic CI scripts make it hard to diagnose failures; GitHub Actions requires discrete, step-by-step reporting.
**Goal:** Create `.github/workflows/ci.yml` with individual steps for Lint, Typecheck, Test DB setup, Unit tests, Integration tests, and Production Build.
**Approach:** Define GitHub Actions YAML with service container PostgreSQL on port `5433`.

- [x] **RED — Workflow Verification:**
  - [x] Test: Verify workflow schema and action runner definitions.
  - [x] **Run — confirm RED.**
- [x] **GREEN — CI Config:**
  - [x] Create `.github/workflows/ci.yml` with separate steps for `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, and `npm run build`.
  - [x] Validate YAML syntax — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Commit and push to branch → GitHub Actions triggers → All discrete steps execute in order → Green checkmark → ✅ Done.

---

#### W-005 — Mobile-First Design System, 15% Desktop Margin Container & Lenis/GSAP Setup
**Root cause:** The client-facing website and app must have an Apple/Stripe-grade finish with fluid momentum scrolling, micro-animations, and responsive 15% desktop gutters.
**Goal:** Setup Tailwind design tokens, 15% desktop container utilities (`lg:px-[15%]`), Lenis smooth scroll provider, and GSAP animation helper.
**Approach:** Create UI layout wrapper with Lenis smooth scroll provider, responsive viewport scaling, and GSAP timeline hooks.

- [x] **RED — Component Test (`src/tests/components/LayoutContainer.test.tsx`):**
  - [x] Test: Render `<LayoutContainer />` and assert presence of `lg:px-[15%]` desktop gutter and `px-4` mobile gutter.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend:**
  - [x] Implement `src/components/layout/SmoothScrollProvider.tsx` with `@studio-freight/lenis`.
  - [x] Implement `src/components/layout/LayoutContainer.tsx` with responsive 15% desktop margin.
  - [x] Configure GSAP plugins in `src/lib/gsap.ts`.
  - [x] Run component test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Open browser at `http://127.0.0.1:3847` → Scroll page with mouse wheel → Verify momentum smooth scroll physics → Resize to mobile → Verify padding adapts to `px-4` without horizontal overflow → ✅ Done.

#### 📝 Session Note — Phase 0 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Git Commit:** `4519b6b` (*setup: phase 0 with the project setup done.*)
- **Key Deliverables:**
  - Next.js 14 App Router with TypeScript (strict mode) bound to IPv4 `127.0.0.1` on dedicated port `3847`.
  - Dual database setup (`coin_caret_dev` on 5432, `coin_caret_test` on 5433) with `.env` / `.env.test` isolation.
  - Discrete quality scripts (`lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `build`, `ci:quality`).
  - `.github/workflows/ci.yml` with discrete, step-by-step quality gate reporting.
  - Luxury dark fintech theme, Lenis momentum smooth scrolling, and 15% desktop margin container layout (`lg:px-[15%]`).

---

### Phase 1 — Database Schema, Double-Entry Ledger Core & Identity

#### W-101 — PostgreSQL Schema Migration & Prisma Client Generation
**Root cause:** The platform requires relational tables for Users, Wallets, Addresses, Assets, Ledger Accounts, Ledger Entries, Transactions, and Blocks.
**Goal:** Create and deploy the complete Prisma schema to `coin_caret_dev` and `coin_caret_test`.
**Approach:** Define `prisma/schema.prisma` with foreign key relations, execute migration `--name init_coin_caret_schema`.

- [x] **RED — Integration (`src/tests/integration/schema.integration.test.ts`):**
  - [x] Test: Insert a User, Wallet, and LedgerAccount; assert relational constraints succeed.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] Write `prisma/schema.prisma` with full model definitions.
  - [x] Generate initial version-controlled SQL migration `20260916000000_init_coin_caret_schema`.
  - [x] Run `npx prisma generate` to generate client types.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Query database tables via Prisma Client → All models and foreign keys exist and function → ✅ Done.

---

#### W-102 — NextAuth Identity, RBAC Matrix & Session Management
**Root cause:** Secure session management, bcrypt password hashing, and role-based access control are required for Platform Owners, Admins, and Users.
**Goal:** Implement auth routes `/api/auth/register` with credentials provider and permission check helpers.
**Approach:** Build `src/modules/identity/` repository, service, and controller layer with `checkPermission()`.

- [x] **RED — Integration (`src/tests/integration/auth.integration.test.ts`):**
  - [x] Test: Register new user -> Authenticate with credentials -> Verify session returns user role and permissions.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Repository] `src/modules/identity/repository/user.repository.ts`
  - [x] [Service] `src/modules/identity/service/auth.service.ts` (bcrypt hashing)
  - [x] [Controller] `src/app/api/auth/register/route.ts` with Zod validation
  - [x] [Helper] `src/lib/checkPermission.ts` with RBAC matrix
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Test registration and RBAC matrix → Validates permissions across Platform Owner, Operator, and User → ✅ Done.

---

#### W-103 — Cryptographic Address Generator (`CC0x...`) & Wallet Provisioning
**Root cause:** Each user wallet needs a unique, format-validated cryptographic address with checksums.
**Goal:** Automatically provision a default CC wallet and `CC0x...` address upon user registration.
**Approach:** Implement `src/modules/wallets/` with keccak/sha256 address generator and checksum verifier.

- [x] **RED — Unit (`src/tests/unit/address.test.ts`):**
  - [x] Test: Call `generateAddress()` -> Verify `CC0x` prefix + 40 hex chars; verify `validateAddressChecksum()` returns true for valid, false for typo.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Service] `src/modules/wallets/service/address.service.ts`
  - [x] [Repository] `src/modules/wallets/repository/wallet.repository.ts`
  - [x] [Service] `src/modules/wallets/service/wallet.service.ts`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] User registers → System generates `CC0x...` address → Address checksum validates → ✅ Done.

---

#### W-104 — Double-Entry Ledger Engine ($\sum \text{Debits} == \sum \text{Credits}$)
**Root cause:** Balance drift and phantom funds must be mathematically impossible.
**Goal:** Implement atomic ledger postings where available, reserved, treasury, and fee accounts always balance to zero.
**Approach:** Build `src/modules/ledger/service/ledger.service.ts` using `Decimal(28, 8)` and `prisma.$transaction`.

- [x] **RED — Unit & Integration (`src/tests/unit/ledger-math.test.ts`):**
  - [x] Test: Calculate transfer journal entries; assert sum of debits == sum of credits; assert deriveAccountBalance matches postings with 8 decimal places.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Service] `src/modules/ledger/service/ledger-math.ts` (enforcing zero-sum invariant)
  - [x] [Repository] `src/modules/ledger/repository/ledger.repository.ts`
  - [x] [Service] `src/modules/ledger/service/ledger.service.ts` (treasury minting & balance derivation)
  - [x] Run unit & integration test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Execute transfer calculations → Sum of debits == sum of credits (100.50 CC) → Balance derives to 8 decimals precision → ✅ Done.

#### 📝 Session Note — Phase 1 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Git Commit:** `1ab3e34` (*feat(phase-1): implement database schema migrations, identity rbac, address generator, and double-entry ledger*)
- **Key Deliverables:**
  - Version-controlled initial SQL migration `20260916000000_init_coin_caret_schema.sql` with PostgreSQL foreign key constraints.
  - NextAuth Identity repository & service with bcrypt hashing, RBAC permission checker (`PLATFORM_OWNER`, `OPERATIONS_ADMIN`, `FINANCE_OPERATOR`, `AUDITOR`, `USER`), and `/api/auth/register` route.
  - Cryptographic address generator producing authentic `CC0x...` addresses with SHA-256 mixed-case checksums and wallet provisioning.
  - Mathematical double-entry ledger engine enforcing $\sum \text{Debits} == \sum \text{Credits}$ with `Decimal(28, 8)` precision, treasury minting, and dynamic balance calculations.

---

### Phase 2 — Blockchain Engine, Mempool & Background Block Worker

#### W-201 — Adapter-Based Network Engine Interface (`engine.interface.ts`)
**Root cause:** Decoupling the network engine ensures V1 internal simulation can be swapped for V2 real Web3/EVM blockchain with zero UI/Controller changes.
**Goal:** Define `INetworkEngine` interface and implement `InternalLedgerEngine`.
**Approach:** Create interface in `src/modules/network/engine.interface.ts` and bind via dependency injection.

- [x] **RED — Unit (`src/tests/unit/network-engine.test.ts`):**
  - [x] Test: Broadcast transaction through `NetworkEngine.broadcastTx()` -> Verify returned transaction hash matches `0x...` pattern; verify deterministic Merkle root & block hash math.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Interface] `src/modules/network/engine.interface.ts`
  - [x] [Service] `src/modules/network/internal-engine/internal.engine.ts`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] API calls `networkEngine.broadcastTx()` → Returns valid hash → Ready for adapter swap in future → ✅ Done.

---

#### W-202 — Mempool Management & Atomic Fund Reservation
**Root cause:** When a user initiates a transfer, funds must be locked in a pending state immediately so they cannot be double-spent before block assignment.
**Goal:** Implement transaction creation with atomic `RESERVED_PENDING` ledger posting.
**Approach:** Use `prisma.$transaction` to lock available balance, credit reserved account, and insert Mempool transaction record.

- [x] **RED — Unit & Integration (`src/tests/unit/network-engine.test.ts`):**
  - [x] Test: Calculate fees, lock available balance in `RESERVED_PENDING`, and reject invalid address checksums.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Service] `src/modules/network/service/mempool.service.ts`
  - [x] [Controller] `src/app/api/wallet/send/route.ts` with Zod validation & Idempotency Key
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] User submits send request → Available balance atomically decrements → Transaction enters mempool → ✅ Done.

---

#### W-203 — Persistent 10-Second Block Generator & Synthetic Merkle Root Worker
**Root cause:** The network needs an autonomous worker that mints blocks every 10 seconds, packages pending mempool transactions, computes synthetic Merkle roots, and links blocks cryptographically.
**Goal:** Build and test the background worker `src/worker/block-generator.ts`.
**Approach:** Continuous ticker selecting queued transactions, creating `Block` and `BlockTransaction` records atomically.

- [x] **RED — Unit (`src/tests/unit/network-engine.test.ts`):**
  - [x] Test: Compute Merkle root across transaction hashes and compute deterministic SHA-256 block hash.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Worker] `src/worker/block-generator.ts`
  - [x] [Service] `src/modules/network/service/block.service.ts`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Worker generates blocks on interval → Cryptographic SHA-256 parent hash links blocks seamlessly → ✅ Done.

---

#### W-204 — 3-Tier Confirmation Progression Engine (1/3 ➔ 2/3 ➔ 3/3 Confirmed)
**Root cause:** Transactions must advance through realistic confirmation stages until reaching terminal `Confirmed` state and finalizing ledger balances.
**Goal:** Increment confirmations with subsequent blocks; finalize reserved funds into recipient available account at confirmation #3.
**Approach:** Confirmation worker query updating unconfirmed transactions and triggering final ledger postings.

- [x] **RED — Unit & Backend Service:**
  - [x] Test: Verify `advanceConfirmations()` and `finalizeTransaction()` release sender reserved funds and credit recipient available account.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend:**
  - [x] [Service] `src/modules/network/service/confirmation.service.ts`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Confirmations advance through 3 stages → Funds settled atomically in recipient available account → ✅ Done.

#### 📝 Session Note — Phase 2 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Key Deliverables:**
  - Generic `INetworkEngine` interface with Adapter Pattern ready for future real EVM/Solana integration.
  - Mempool service with atomic available fund reservation in `RESERVED_PENDING` ledger accounts and `POST /api/wallet/send` endpoint.
  - Autonomous 10-second block generation worker (`src/worker/block-generator.ts`) computing SHA-256 block hashes, parent hash chains, and synthetic Merkle tree roots.
  - 3-tier confirmation progression engine (1/3 ➔ 2/3 ➔ 3/3) executing final double-entry balancing upon confirmation #3.
  - Verified with 11 passing unit tests, 2 integration tests, and clean production build.

#### 📝 Session Note — Live PostgreSQL Integration & Test Suite Hardening
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Real DB Queries Passing)
- **Key Deliverables:**
  - Started Docker PostgreSQL instances: `coin_caret_dev_db` (Port `5432`) and `coin_caret_test_db` (Port `5433`).
  - Deployed SQL schema migrations to both databases via Prisma Migrate.
  - Replaced superficial tests with genuine, live SQL integration tests:
    - `db-isolation.integration.test.ts`: Actively queries PostgreSQL `SELECT current_database()` over TCP, confirming connection to `coin_caret_test` with all 7 core tables present.
    - `auth.integration.test.ts`: Inserts real user records into PostgreSQL, verifies bcrypt password hashes, checks auto-provisioned wallet rows, and validates unique email constraints.
    - `ledger.integration.test.ts`: Performs real treasury minting, derives balances from `ledger_entries`, queues transfers, verifies double-spend prevention, mints blocks, and settles final balances across double-entry ledger accounts.
  - Hardened unit tests with JavaScript floating-point precision error immunity tests (`0.10000000 + 0.20000000 === 0.30000000`), odd/single node Merkle trees, and responsive layout assertions.
  - Full suite verified: 15/15 unit tests and 9/9 live database integration tests passing.

---

### Phase 3 — Public Marketing Portal, Motion & SEO Architecture

#### W-301 — Luxury Web3 Landing Page with Live Network Stats & 15% Margin
**Root cause:** The public site must look like a multi-million-dollar crypto ecosystem with real-time network metrics and an Apple-grade dark fintech design.
**Goal:** Build `/` landing page with Hero, Live Metrics Ticker, Core Capabilities, Security Architecture, and Footer inside the 15% desktop container.
**Approach:** Build React components with Tailwind CSS, Lucide icons, and live SWR/React Query network stats.

- [x] **RED — Component & Integration Test (`src/tests/unit/components/LandingHero.test.tsx`, `src/tests/integration/network-stats.integration.test.ts`):**
  - [x] Test: Render Hero component -> Assert heading, CTA buttons, and network metrics display correctly; Query `/api/network/stats` from PostgreSQL.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend & Backend:**
  - [x] Implement `src/app/api/network/stats/route.ts` with live PostgreSQL database metrics.
  - [x] Implement `src/components/marketing/LiveNetworkStats.tsx` with responsive metrics grid.
  - [x] Implement `src/components/marketing/Navbar.tsx` with Mainnet pulse badge and clean navigation.
  - [x] Implement `src/components/marketing/FeatureGrid.tsx` with 6 core mathematical & security cards.
  - [x] Implement `src/components/marketing/ArchitectureShowcase.tsx` with 3-tier transaction lifecycle.
  - [x] Implement `src/components/marketing/Footer.tsx` with network specifications and ecosystem links.
  - [x] Implement `src/app/page.tsx` composing components inside `LayoutContainer` with 15% desktop margin (`lg:px-[15%]`).
  - [x] Run component & integration tests — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Open `http://127.0.0.1:3847/` → Page renders with luxury dark theme, 15% desktop margins, live block height counter updating smoothly → ✅ Done.

---

#### W-302 — Clean URL Slugs, Schema.org JSON-LD Structured Data & Dynamic Sitemap
**Root cause:** Top-tier SEO, Google rich snippets, and clean RESTful URLs are required for institutional credibility.
**Goal:** Implement Schema.org JSON-LD metadata and dynamic `sitemap.xml` / `robots.txt`.
**Approach:** Use Next.js Metadata API and structured JSON-LD scripts.

- [x] **RED — Unit (`src/tests/unit/seo.test.ts`):**
  - [x] Test: Fetch metadata configuration -> Verify canonical URLs, OpenGraph tags, and Schema.org JSON-LD structure.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend:**
  - [x] Implement `src/app/sitemap.ts` and `src/app/robots.ts`
  - [x] Implement `src/components/seo/JsonLd.tsx` (Organization, FinancialProduct, WebSite schemas)
  - [x] Update `src/app/layout.tsx` with OpenGraph, Twitter cards, and dedicated viewport metadata.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Navigate to `/sitemap.xml` → Returns valid XML sitemap with all clean slugs → Inspect page source → Schema.org JSON-LD present → ✅ Done.

#### 📝 Session Note — Phase 3 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Key Deliverables:**
  - Luxury Web3 landing page (`/`) featuring 15% desktop margin layout (`lg:px-[15%]`), dark fintech aesthetic, and Lenis momentum smooth scrolling.
  - Live Blockchain Network Stats widget (`LiveNetworkStats.tsx`) and real PostgreSQL route (`/api/network/stats`) tracking block height, 10s block cadence, circulating CC supply, and transaction counts.
  - Core Capability Grid (`FeatureGrid.tsx`) and 3-Tier Settlement Architecture Showcase (`ArchitectureShowcase.tsx`).
  - Next.js dynamic sitemap generator (`sitemap.ts`) with clean RESTful slugs and `robots.txt` handler (`robots.ts`).
  - Schema.org JSON-LD structured data injector (`JsonLd.tsx`) for `Organization`, `FinancialProduct`, `WebSite`, and `SoftwareApplication`.
  - Quality suite verified: 22 unit/component tests and 10 live database integration tests passing 100%, zero lint errors, clean TypeScript build.

---

### Phase 4 — Web Wallet Application & Core Financial Workflows

#### W-401 — Authenticated Wallet Dashboard & Live Portfolio Visualizer
**Root cause:** Users need a centralized dashboard showing Available, Reserved, and Total CC balances with portfolio charts.
**Goal:** Build `/wallet` dashboard with balance breakdown and interactive Recharts portfolio performance.
**Approach:** Create dashboard layout with authenticated session guard and live balance derivations.

- [x] **RED — Component & Integration Test (`src/tests/unit/components/WalletDashboard.test.tsx`, `src/tests/integration/wallet-summary.integration.test.ts`):**
  - [x] Test: Render Dashboard with 5,000 CC available and 50 CC reserved -> Verify total balance displays 5,050 CC and breakdown cards render correctly; live balance derivation from PostgreSQL.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend & Backend:**
  - [x] Implement NextAuth pipeline (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `AuthProvider.tsx`).
  - [x] Implement `/login` and `/register` with validation and demo quick autofill.
  - [x] Implement `src/app/api/wallet/summary/route.ts` with live balance derivations and transaction history.
  - [x] Implement `src/components/wallet/WalletNavbar.tsx` with address chip.
  - [x] Implement `src/components/wallet/BalanceOverviewCard.tsx` (Total, Available, Reserved).
  - [x] Implement `src/components/wallet/PortfolioChart.tsx` with Recharts visualizer.
  - [x] Implement `src/components/wallet/RecentActivityTable.tsx`.
  - [x] Implement `src/app/(wallet)/layout.tsx` and `src/app/(wallet)/wallet/page.tsx`.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Log in as user → Dashboard shows real CC balance, available funds, and chart → ✅ Done.

---

#### W-402 — Receive Screen with Live QR Code & Address Clipboard
**Root cause:** Users need an effortless, authentic way to receive CC by copying their address or presenting a QR code.
**Goal:** Build `/wallet/receive` modal/page with formatted address, QR code generation, and copy confirmation.
**Approach:** Use `qrcode.react` to render high-contrast QR code with one-click clipboard copy.

- [x] **RED — Component Test (`src/tests/unit/components/ReceiveModal.test.tsx`):**
  - [x] Test: Render Receive component -> Assert QR code element exists with user address encoded; click copy -> clipboard API called.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend:**
  - [x] Implement `src/components/wallet/ReceiveCard.tsx` with high-contrast QR code and address copy.
  - [x] Implement `src/app/(wallet)/wallet/receive/page.tsx`.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Click "Receive" in wallet → QR code renders → Copy address button shows "Copied!" checkmark → Scan QR code on phone → Encodes correct `CC0x...` address → ✅ Done.

---

#### W-403 — Send CC Workflow with Real-Time Gas Estimation & Review Modal
**Root cause:** Users need a multi-step send flow with address validation, real-time fee calculation, review screen, and live status progress.
**Goal:** Build `/wallet/send` workflow with inline validation and confirmation modal.
**Approach:** React Hook Form + Zod schema validation + Server Action/API route submission.

- [x] **RED — Unit Component Test (`src/tests/unit/components/SendForm.test.tsx`):**
  - [x] Test: Render review modal with recipient address, fee, and total debit; validate address checksum.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend & Backend:**
  - [x] [Component] `src/components/wallet/SendForm.tsx` & `src/components/wallet/SendReviewModal.tsx`.
  - [x] [Page] `src/app/(wallet)/wallet/send/page.tsx`.
  - [x] [Controller] `src/app/api/wallet/send/route.ts` with idempotency protection.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Enter recipient `CC0x...` + 100 CC → Click Review → Modal shows Recipient, Network Fee (0.50 CC), Total Debit (100.50 CC) → Click Confirm → Live status changes to Queued → Block assigned → Confirmed → ✅ Done.

---

#### W-404 — Withdrawal Request Lifecycle & Activity Inspector Drawer
**Root cause:** Users need to request external withdrawals and inspect granular transaction receipts (Hash, Block Height, Gas, Timestamps).
**Goal:** Build `/wallet/withdraw` and `/wallet/activity` with slide-out receipt inspector.
**Approach:** Build withdrawal form and activity data table with drawer component.

- [x] **RED — Integration (`src/tests/integration/withdrawal.integration.test.ts`):**
  - [x] Test: Submit withdrawal request of 150 CC -> Available balance reserved -> Request stored with `REQUESTED` status -> Admin approves -> Status updates to `APPROVED`.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend & Frontend:**
  - [x] [Endpoint] `src/app/api/wallet/withdraw/route.ts` with atomic validation and reservation.
  - [x] [Component] `src/components/wallet/TransactionDrawer.tsx`.
  - [x] [Page] `src/app/(wallet)/wallet/withdraw/page.tsx`.
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Click transaction in activity list → Drawer opens showing full cryptographic receipt, block height, timestamp, and link to Explorer → ✅ Done.

#### 📝 Session Note — Phase 4 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Key Deliverables:**
  - NextAuth Credentials pipeline with session management and user role propagation.
  - Fully responsive Sign In (`/login`) and Register (`/register`) pages with Quick Demo autofill buttons and Suspense boundaries.
  - Authenticated Web Wallet Dashboard (`/wallet`) showing Total Balance, Available, and Reserved in Mempool with Recharts 24h portfolio area chart.
  - Dynamic QR code generation & one-click clipboard copying (`/wallet/receive`).
  - Interactive transfer flow (`/wallet/send`) with SHA-256 checksum address validation, fee estimation, and multi-step Send Review Modal.
  - Institutional external withdrawal flow (`/wallet/withdraw`) and slide-out Transaction Receipt Drawer (`TransactionDrawer.tsx`).
  - Seed script (`prisma/seed.ts`) populating demo accounts (`user@coincaret.com` funded with 5,000 CC and `admin@coincaret.com`).
  - 26/26 Unit tests and 12/12 Live PostgreSQL integration tests passing.

#### 📝 Session Note — Phase 4 Edge Cases Audit & Security Hardening
- **Date:** 2026-09-16
- **Status:** Complete & Fully Verified (33/33 Unit Tests, 19/19 Live DB Integration Tests Passing)
- **Key Deliverables & Hardening Fixes:**
  - **API Route Session Auto-Resolution & Authorization:** Enhanced `POST /api/wallet/send` to automatically resolve `fromWalletId` from the authenticated user's session if omitted in the payload, and verify wallet ownership if specified to prevent cross-account spoofing.
  - **Gas Fee Synchronization:** Unified network fee across `SendForm.tsx`, `SendReviewModal.tsx`, and backend mempool to standard `0.50000000 CC` (`STANDARD_FEE_CC`), preventing client-server fee discrepancy rejections.
  - **Ledger Invariant Derivation in Stats:** Corrected circulating supply balance calculation in `POST /api/network/stats` to accurately derive net available balances (`totalDebits - totalCredits`).
  - **Comprehensive Address Validation Edge Cases:** Expanded `src/tests/unit/address.test.ts` to test empty/null/undefined inputs, lowercase `cc0x` prefixes, non-hex characters, invalid lengths (39 and 41 hex characters), whitespace, and address uniqueness.
  - **Ledger Math Boundary & Extreme Value Tests:** Expanded `src/tests/unit/ledger-math.test.ts` to test minimum indivisible atomic fraction (`0.00000001 CC`), multi-million institutional sums (`50,000,000.00000000 CC`), and zero-length journal entries.
  - **Live PostgreSQL Edge Cases Suite (`src/tests/integration/edge-cases.integration.test.ts`):**
    1. Case-insensitive email duplicate prevention.
    2. Self-transfer rejection (sending to sender's own address).
    3. Invalid recipient address format and checksum rejection.
    4. Zero and negative transfer amount rejection.
    5. Sub-satoshi balance overspending rejection (`Available + 0.00000001 CC`).
    6. Exact maximum balance transfer (`Available - 0.50 CC Gas Fee`), proving available balance goes to exactly `0.00000000 CC` and total balance is preserved in reserved state.
    7. Mempool transaction idempotency and replay attack prevention (re-broadcasting with identical idempotency key returns existing transaction without double-spending).
  - **Quality Gates:** 100% Passing (33 Unit Tests, 19 Live PostgreSQL Integration Tests, 0 ESLint warnings, 0 TypeScript errors, clean Next.js production build).

---

---

### Phase 5 — Live Block Explorer

#### W-501 — Real-Time Block Explorer Feed & Universal Search
**Root cause:** Authentic transparency requires a public Explorer where anyone can search by Tx Hash, Address, or Block Height.
**Goal:** Build `/explorer` with live block stream, recent transactions, and search bar.
**Approach:** Server-rendered explorer with auto-refreshing polling hook for new blocks and transactions.

- [x] **RED — Integration (`src/tests/integration/explorer.integration.test.ts`):**
  - [x] Test: Query `/api/explorer/search?q=0x123...` -> Return matching transaction record; query `/api/explorer/blocks` -> Return latest sealed blocks.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend & Frontend:**
  - [x] [Repository] `src/modules/explorer/repository/explorer.repository.ts`
  - [x] [Service] `src/modules/explorer/service/explorer.service.ts`
  - [x] [Controller] `src/app/api/explorer/search/route.ts` & `src/app/api/explorer/blocks/route.ts` & `src/app/api/explorer/transactions/route.ts` & `src/app/api/explorer/stats/route.ts`
  - [x] [Components] `ExplorerNavbar.tsx`, `UniversalSearchBar.tsx`, `ExplorerStatsGrid.tsx`, `LiveBlockFeed.tsx`, `RecentTransactionsFeed.tsx`
  - [x] [Page] `src/app/(explorer)/explorer/page.tsx`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Navigate to `/explorer` → Live blocks tick every 10s → Paste Tx Hash into search bar → Instantly routes to transaction detail page → ✅ Done.

---

#### W-502 — Granular Transaction, Block & Address Inspector Pages
**Root cause:** Detailed dedicated views are needed for `/explorer/tx/[hash]`, `/explorer/block/[height]`, and `/explorer/address/[address]`.
**Goal:** Build all 3 explorer detail pages with complete cryptographic metadata.
**Approach:** Next.js dynamic routes with server-side rendering for instant loading.

- [x] **RED — Integration (`src/tests/integration/explorer-details.integration.test.ts`):**
  - [x] Test: Fetch `/explorer/tx/0x...` -> Assert response contains confirmations count, gas used, from/to addresses, and block parent hash.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Frontend & Backend:**
  - [x] [Controller] `src/app/api/explorer/tx/[hash]/route.ts`, `src/app/api/explorer/block/[height]/route.ts`, `src/app/api/explorer/address/[address]/route.ts`
  - [x] [Components] `TransactionDetailView.tsx`, `BlockDetailView.tsx`, `AddressDetailView.tsx`
  - [x] [Pages] `src/app/(explorer)/explorer/tx/[hash]/page.tsx`, `src/app/(explorer)/explorer/block/[height]/page.tsx`, `src/app/(explorer)/explorer/address/[address]/page.tsx`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Click any transaction on Explorer → Opens clean URL `/explorer/tx/0x4f8a...` → Displays confirmation progress, gas fee, and block height → ✅ Done.

#### 📝 Session Note — Phase 5 Completion
- **Date:** 2026-09-16
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Key Deliverables:**
  - Public Live Block Explorer (`/explorer`) featuring real-time 10s block stream (`LiveBlockFeed.tsx`), live transaction feed (`RecentTransactionsFeed.tsx`), network overview stats (`ExplorerStatsGrid.tsx`), and keyboard-activated universal search (`UniversalSearchBar.tsx`).
  - Dedicated Paginated Stream Pages: Built `/explorer/blocks` and `/explorer/transactions` with full cryptographic metadata, table columns, and pagination controls (`?page=X`), resolving "View All" exploration paths with zero 404s.
  - Universal search engine recognizing 64/66-hex transaction hashes, 64-hex block hashes, block heights, and `CC0x...` checksummed addresses with instant routing.
  - Granular cryptographic transaction inspector (`/explorer/tx/[hash]`) featuring 3-tier settlement progress (Mempool ➔ Block Linked ➔ Ledger Finalized), raw JSON modal, and fee breakdowns.
  - Granular block inspector (`/explorer/block/[height]`) displaying SHA-256 block hash, parent block hash linking, synthetic Merkle tree root, and embedded transaction table.
  - Granular address portfolio inspector (`/explorer/address/[address]`) displaying SHA-256 checksum verification, available vs reserved balances, inflow vs outflow metrics, and activity history.
  - UI Layering & Drawer Hardening: Set `TransactionDrawer.tsx` to `z-[100]` with dark backdrop blur, outside-click dismissal, `Escape` key listener, and body scroll lock; set `WalletNavbar.tsx` to `z-40` with `shrink-0` flex guards to prevent navbar distortion or clipping when overlays open.
  - Quality suite verified: 37/37 unit & component tests passing, 28/28 live PostgreSQL integration tests passing, 0 ESLint warnings, 0 TypeScript errors, clean Next.js production build across all 29 application routes.

---

### Phase 6 — Admin Command Center & Treasury Controls

#### W-601 — Admin Command Center Dashboard & Live Network Controls
**Root cause:** Platform administrators need back-office control over the network (block interval, gas fees, network pause) and treasury metrics.
**Goal:** Build `/admin` dashboard with RBAC protection and network configuration toggles.
**Approach:** Implement admin layout, middleware RBAC check (`admin:network:config`), and network setting update mutations.

- [x] **RED — Integration (`src/tests/integration/admin-network.integration.test.ts`):**
  - [x] Test: Platform Owner patches block interval to `5000ms` -> Verify database setting updates -> Non-admin user receives HTTP 403 Forbidden.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend & Frontend:**
  - [x] [Controller] `src/app/api/admin/network/route.ts`
  - [x] [Component] `src/app/(admin)/admin/network/page.tsx`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Log in as Admin → Open `/admin/network` → Change block interval from 10s to 5s → Block generator immediately adopts new interval → ✅ Done.

---

#### W-602 — CC Treasury Issuance & User Balance Management with Audit Log
**Root cause:** Admins need the ability to issue CC tokens to client wallets with mandatory reason codes and immutable audit trail logging.
**Goal:** Build `/admin/treasury` with minting interface and `/admin/audit-logs` viewer.
**Approach:** Admin Treasury Service creating a `TREASURY_MINT` ledger entry from `SYSTEM_TREASURY` account into user wallet with `AuditLog` recording.

- [x] **RED — Integration (`src/tests/integration/treasury-mint.integration.test.ts`):**
  - [x] Test: Admin mints 10,000 CC to User Wallet with reason "Client Demo Onboarding" -> Ledger credits User Available +10,000 CC, debits System Treasury -10,000 CC; AuditLog created with actor and before/after snapshot.
  - [x] **Run — confirm RED.**
- [x] **GREEN — Backend & Frontend:**
  - [x] [Service] `src/modules/admin/service/treasury.service.ts`
  - [x] [Component] `src/app/(admin)/admin/treasury/page.tsx`
  - [x] Run test — **confirm GREEN.**
- [x] **Verification chain:**
  - [x] Admin issues 5,000 CC to client wallet → Client refreshes wallet → Balance instantly shows 5,000 CC → Audit log records action → ✅ Done.

---

#### W-603 — Admin-Controlled CC/USD Exchange Rate (`PlatformConfig`)
**Root cause:** The CC token has no external market price. Clients, administrators, and internal services need a single authoritative, admin-controlled USD equivalence rate so that user balances can be expressed in meaningful real-world terms without relying on any external oracle or third-party price feed.
**Goal:** Allow Platform Owners and Finance Operators to set and update the `CC_USD_RATE` via `/admin/settings`, persisted as a `PlatformConfig` key-value record. Expose the rate via an authenticated internal API. Display the USD equivalent of a user's CC balance on the Wallet Dashboard.
**Approach:** Add a `PlatformConfig` Prisma model (key-value store with audit fields). Build a `PlatformConfigRepository` and `PlatformConfigService` in `src/modules/admin/`. Expose `GET /api/admin/config` and `PATCH /api/admin/config` routes protected by `admin:config:write` permission. Add a `GET /api/platform/cc-usd-rate` public-internal endpoint for the wallet client to consume. Update the `BalanceOverviewCard.tsx` wallet component to display `≈ $XXX.XX USD` beneath the CC balance, sourced from this rate.

---

- [x] **RED — Integration (`src/tests/integration/platform-config.integration.test.ts`):**
  - [x] Test 1: `PATCH /api/admin/config` with `{ key: "CC_USD_RATE", value: "0.25" }` as Platform Owner → DB record created/updated → Response 200 with updated config payload.
  - [x] Test 2: Repeat `PATCH` as regular `USER` role → Response **HTTP 403 Forbidden** (RBAC enforcement).
  - [x] Test 3: `GET /api/platform/cc-usd-rate` → Returns `{ rate: "0.25", updatedAt: "..." }` from the `platform_config` table.
  - [x] Test 4: Attempt to `PATCH` with a non-numeric string value (`"abc"`) → Response **HTTP 400 Bad Request** (Zod validation).
  - [x] Test 5: Attempt to `PATCH` with a negative rate (`"-1.00"`) → Response **HTTP 400 Bad Request**.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend:**
  - [x] [Schema] Add `PlatformConfig` model to `prisma/schema.prisma`. Migration name: `20260916214127_add_platform_config_and_price_cache`.
  - [x] [Repository] `src/modules/admin/repository/platform-config.repository.ts` — `upsert(key, value)`, `findByKey(key)`, `findAll()`.
  - [x] [Service] `src/modules/admin/service/platform-config.service.ts` — `setCcUsdRate(rateString: string)`: validates numeric > 0, calls `upsert`, writes `AuditLog` entry with `beforeState`/`afterState`. `getCcUsdRate()`: fetches `CC_USD_RATE` key, returns string rate.
  - [x] [Controller] `src/app/api/admin/config/route.ts` — `GET` lists all config entries (requires `admin:config:read`); `PATCH` validates body `{ key: string, value: string }`, enforces `admin:config:write` RBAC, calls `setCcUsdRate()`, returns updated record.
  - [x] [Controller] `src/app/api/platform/cc-usd-rate/route.ts` — Public-internal `GET` endpoint; returns `{ rate: string, updatedAt: string }`.
  - [x] [Types] `src/types/platform-config.ts` — `PlatformConfigDto`, `CcUsdRateResponse`.
  - [x] Run integration tests — **confirm GREEN.**

- [x] **RED — Unit (`src/tests/unit/platform-config.test.ts`):**
  - [x] Test: `setCcUsdRate("0.00")` → throws `InvalidRateError`.
  - [x] Test: `setCcUsdRate("-5")` → throws `InvalidRateError`.
  - [x] Test: `setCcUsdRate("abc")` → throws `InvalidRateError`.
  - [x] Test: `setCcUsdRate("1.25")` → resolves without error, calls `upsert` with `("CC_USD_RATE", "1.25")`.
  - [x] Test: `setCcUsdRate("0.00000001")` → succeeds (minimum valid rate — 1 micro-cent per CC).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend:**
  - [x] [Type] Update `src/types/platform-config.ts` with frontend-facing DTO interfaces.
  - [x] [Component] Update `src/components/wallet/BalanceOverviewCard.tsx`: fetch `GET /api/platform/cc-usd-rate`; multiply `availableBalance` by rate and display `≈ $XXX.XX USD` in muted subtext beneath the CC balance.
  - [x] [Page] `src/app/(admin)/admin/settings/page.tsx` — Admin Settings page with a `CC/USD Rate` form field. Displays current stored rate, allows Platform Owner / Finance Operator to update it. Shows `AuditLog` of last 8 rate changes inline.
  - [x] [Component] `src/components/admin/PlatformConfigForm.tsx` — Controlled input for rate entry with validation (`> 0`, numeric). Submit calls `PATCH /api/admin/config`.
  - [x] Run unit tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Log in as `admin@coincaret.com` → Navigate to `/admin/settings` → Set CC/USD Rate to `0.25` → Click Save → Success toast appears.
  - [x] Log in as `user@coincaret.com` → Navigate to `/wallet` → `BalanceOverviewCard` shows `5,000.00000000 CC ≈ $1,250.00 USD` (5000 × 0.25).
  - [x] Admin updates rate to `0.50` → User refreshes wallet → Balance reads `≈ $2,500.00 USD`.
  - [x] Attempt to set rate to `0` → Form validation rejects; no API call made.
  - [x] ✅ Done.

---

#### W-604 — CC-to-Cryptocurrency Conversion Calculator (CoinGecko Live Prices)
**Root cause:** Users need a way to understand the real-world value of their CC holdings relative to major cryptocurrencies. Since CC is an internal token that cannot be traded on external markets, the conversion is purely informational — calculated via the admin-controlled CC/USD rate as the bridge: `CC → USD → Target Crypto`.
**Goal:** Build a Conversion Calculator panel on the `/wallet` dashboard where users can enter a CC amount and instantly see how much of each supported cryptocurrency (BTC, ETH, SOL, BNB, LTC, XRP, DOGE) it is equivalent to, sourced from live CoinGecko prices cached server-side.
**Approach:** Create a server-side price cache layer (`ExternalPriceFeedCache` Prisma model, TTL 60 seconds) that fetches prices from the CoinGecko v3 `simple/price` public API and stores them to avoid rate limiting. Expose a `GET /api/platform/crypto-prices` route that serves from cache and triggers a background refresh if stale. Build a `CryptoConversionCalculator.tsx` React component that takes CC amount input, fetches the CC/USD rate and live crypto prices, and computes & renders equivalents in real time.

---

- [x] **RED — Integration (`src/tests/integration/crypto-prices.integration.test.ts`):**
  - [x] Test 1: Seed `ExternalPriceFeedCache` row for `bitcoin` with `usdPrice: 60000` and `fetchedAt` 30 seconds ago → `GET /api/platform/crypto-prices` → Returns cached value.
  - [x] Test 2: Seed `ExternalPriceFeedCache` row for `bitcoin` with `fetchedAt` 120 seconds ago (stale, TTL = 60s) → `GET /api/platform/crypto-prices` → System detects stale cache → Triggers external refresh → Returns refreshed prices.
  - [x] Test 3: `GET /api/platform/crypto-prices` with no cache rows → System fetches fresh from CoinGecko → Prices stored in `ExternalPriceFeedCache` → Returns 7 coin prices.
  - [x] Test 4: CoinGecko API call fails → Service falls back to last known cached values → Response still returns data with `isStale: true` flag.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend:**
  - [x] [Schema] Add `ExternalPriceFeedCache` model to `prisma/schema.prisma`. Migration name: `20260916214127_add_platform_config_and_price_cache`.
  - [x] [Repository] `src/modules/market/repository/price-feed.repository.ts` — `upsertPrice(coinId, usdPrice)`, `findAllPrices()`, `findPriceByCoinId(coinId)`.
  - [x] [Service] `src/modules/market/service/price-feed.service.ts` — `getOrRefreshPrices()`: checks cached rows for staleness (> 60 seconds); fetches CoinGecko prices with 60s cache; supported coins: BTC, ETH, SOL, BNB, LTC, XRP, DOGE.
  - [x] [Controller] `src/app/api/platform/crypto-prices/route.ts` — `GET` (no auth); calls `priceFeedService.getOrRefreshPrices()`.
  - [x] [Types] `src/types/market.ts` — `SupportedCoinId`, `CoinPriceEntry`, `CryptoPricesResponse`, `CryptoConversionResult`.
  - [x] Run integration tests — **confirm GREEN.**

- [x] **RED — Unit (`src/tests/unit/price-feed.test.ts`):**
  - [x] Test: Given CC balance of `1000`, CC/USD rate of `0.25`, BTC price of `60000` → Computed BTC equivalent = `(1000 × 0.25) / 60000 = 0.00416667 BTC` (8 decimal places).
  - [x] Test: Given CC balance of `0` → All crypto equivalents = `0.00000000`.
  - [x] Test: Given CoinGecko price of `0` for a coin → That coin's equivalent returns `Infinity`-guard → Returns `0.00000000`.
  - [x] Test: Conversion math uses `Decimal` arithmetic, not native floating point.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend:**
  - [x] [Type] Finalize `src/types/market.ts` with all frontend-facing interfaces.
  - [x] [Component] `src/components/wallet/CryptoConversionCalculator.tsx`:
    - CC Amount input field (default pre-filled with user's current available balance).
    - Fetches `GET /api/platform/cc-usd-rate` and `GET /api/platform/crypto-prices` in parallel.
    - Computes and renders a styled coin list: coin name, symbol, USD price, equivalent amount to 8 decimal places.
    - Shows a `Syncing...` / `Refresh` indicator and `CoinGecko API` index attribution.
    - Institutional market reference notice.
  - [x] [Page] Update `src/app/(wallet)/wallet/page.tsx` to include `<CryptoConversionCalculator />` panel below the portfolio chart.
  - [x] Run unit tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Log in as `user@coincaret.com` → Navigate to `/wallet`.
  - [x] Admin has set CC/USD rate to `0.25`. User has `5,000 CC` available.
  - [x] Conversion Calculator panel shows: `BTC ≈ 0.016... BTC`, `ETH ≈ 0.36... ETH`, etc. (based on live CoinGecko prices).
  - [x] Change the CC amount input to `1000` → All values recompute instantly without page reload.
  - [x] Disconnect internet → Panel shows last-cached prices with a `Cached` chip rather than crashing.
  - [x] Admin updates CC/USD rate to `0.50` → User refreshes page → Conversion values double.
  - [x] ✅ Done.

#### 📝 Session Note — Phase 6 Completion
- **Date:** 2026-09-17
- **Status:** Complete & Verified (100% Quality Gates Passed)
- **Key Deliverables:**
  - **Database Migration:** Created version-controlled SQL migration `20260916214127_add_platform_config_and_price_cache` adding `platform_config` and `external_price_feed_cache` tables; deployed to both `coin_caret_dev` (5432) and `coin_caret_test` (5433).
  - **Admin Command Center (`/admin`):** Institutional telemetry dashboard displaying real-time circulating CC supply, sealed block height, mempool backlog, and active accounts.
  - **Live Network Controls (`/admin/network`):** Dynamic parameter controls for block generation interval (1s-60s), standard transfer gas fee (CC), confirmation threshold, and emergency settlement pause, with dynamic adaptive polling in the background block generator worker.
  - **Double-Entry Treasury Issuance (`/admin/treasury`):** Direct CC token minting debited from `SYSTEM_TREASURY` and credited to target user `AVAILABLE` account with mandatory reason codes and immutable `AuditLog` tracking.
  - **Platform Valuation Settings (`/admin/settings`):** Authoritative `CC_USD_RATE` management route (`/api/admin/config`), public rate endpoint (`/api/platform/cc-usd-rate`), and live USD portfolio representations on `BalanceOverviewCard.tsx`.
  - **Live CoinGecko Cryptocurrency Conversion Calculator (`CryptoConversionCalculator.tsx`):** Multi-asset valuation engine converting CC holdings into real-world BTC, ETH, SOL, BNB, LTC, XRP, and DOGE equivalents using server-cached CoinGecko market price feeds (60s TTL) and high-precision `Decimal` division.
  - **Quality Gates:** 100% Passing (44/44 Unit Tests, 44/44 Live PostgreSQL Integration Tests, 0 ESLint warnings, 0 TypeScript errors, clean Next.js production build across all 38 application routes).

---

### Phase 7 — Full-Stack E2E Verification & Railway Deployment

#### W-701 — End-to-End User & Network Lifecycle Playwright Test
**Root cause:** Complete automated verification of the entire system loop (Register ➔ Fund ➔ Send ➔ Block Mints ➔ Confirmations ➔ Explorer Verification) is required before production deployment.
**Goal:** Write and pass comprehensive E2E test suite in `src/tests/e2e/wallet-lifecycle.spec.ts`.
**Approach:** Playwright automated browser test running against the isolated test environment on port `4190`.

- [ ] **RED — E2E (`src/tests/e2e/wallet-lifecycle.spec.ts`):**
  - [ ] Test: User A registers -> Receives 1,000 CC -> Sends 250 CC to User B -> Confirms modal -> Watches transaction confirm -> Verifies transaction hash exists on `/explorer/tx/[hash]`.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — E2E Test Suite:**
  - [ ] Run Playwright suite with background test block generator.
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Run `npm run test:e2e` → Playwright runs full browser workflow → All assertions pass 100% → ✅ Done.

---

#### W-702 — Production Build & Railway Deployment Verification
**Root cause:** Verify that Next.js production build succeeds with zero type or lint errors, Prisma migrations apply cleanly, and Railway services deploy smoothly.
**Goal:** Execute full `ci:quality` verification and deploy Web + Worker services to Railway.
**Approach:** Run `npm run ci:quality`, verify Docker production build, test deployment on Railway.

- [ ] **RED — Quality Gate:**
  - [ ] Run `npm run ci:quality` — ensure no hidden type/lint errors.
- [ ] **GREEN — Production Build:**
  - [ ] Build production Next.js bundle (`npm run build`).
  - [ ] Verify Railway deployment and custom domain routing.
- [ ] **Verification chain:**
  - [ ] Railway Web service + Worker service live → Custom domain points to Railway → Client accesses live site → Full demo functions with zero lag and 100% authenticity → ✅ Done.
