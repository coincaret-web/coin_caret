# Current State: Coin Caret (CC)

This document is the authoritative single source of truth for the implementation status, work items, and sprint tracking for **Coin Caret**. Every work item strictly follows the **TDD Instruction Guide** format.

---

## 1. Project Overview & Progress Summary

- **Architecture:** Next.js 16 App Router Modular Monolith (TypeScript, Prisma ORM, PostgreSQL on Railway)
- **Local Dev Port:** `3847` (IPv4 `127.0.0.1`)
- **Dev Database:** `coin_caret_dev` (Port `5432` on `127.0.0.1`)
- **Test Database:** `coin_caret_test` (Port `5433` on `127.0.0.1` via `.env.test`)
- **Current Phase:** Phase 0 — Complete (Ready for Phase 1)
- **Overall Status:** Phase 0 Quality Gates Passed 100%

---

## 2. Phase Breakdown & Work Items

```text
[x] Phase 0: Project Scaffold, Quality Tooling, Dual DB & CI/CD Pipeline
[ ] Phase 1: Database Schema, Double-Entry Ledger Core & Identity
[ ] Phase 2: Blockchain Engine, Mempool & Background Block Worker
[ ] Phase 3: Public Marketing Portal, Motion & SEO Architecture
[ ] Phase 4: Web Wallet Application & Core Financial Workflows
[ ] Phase 5: Live Block Explorer
[ ] Phase 6: Admin Command Center & Treasury Controls
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

---

### Phase 3 — Public Marketing Portal, Motion & SEO Architecture

#### W-301 — Luxury Web3 Landing Page with Live Network Stats & 15% Margin
**Root cause:** The public site must look like a multi-million-dollar crypto ecosystem with real-time network metrics and an Apple-grade dark fintech design.
**Goal:** Build `/` landing page with Hero, Live Metrics Ticker, Core Capabilities, Security Architecture, and Footer inside the 15% desktop container.
**Approach:** Build React components with Tailwind CSS, Lucide icons, and live SWR/React Query network stats.

- [ ] **RED — Component Test (`src/tests/components/LandingHero.test.tsx`):**
  - [ ] Test: Render Hero component -> Assert heading, CTA buttons, and network metrics display correctly.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend:**
  - [ ] Implement `src/app/(marketing)/page.tsx`
  - [ ] Implement `src/components/marketing/LiveNetworkStats.tsx`
  - [ ] Implement `src/components/marketing/FeatureGrid.tsx`
  - [ ] Run component test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Open `http://127.0.0.1:3847/` → Page renders with luxury dark theme, 15% desktop margins, live block height counter updating smoothly → ✅ Done.

---

#### W-302 — Clean URL Slugs, Schema.org JSON-LD Structured Data & Dynamic Sitemap
**Root cause:** Top-tier SEO, Google rich snippets, and clean RESTful URLs are required for institutional credibility.
**Goal:** Implement Schema.org JSON-LD metadata and dynamic `sitemap.xml` / `robots.txt`.
**Approach:** Use Next.js Metadata API and structured JSON-LD scripts.

- [ ] **RED — Unit (`src/tests/unit/seo.test.ts`):**
  - [ ] Test: Fetch metadata configuration -> Verify canonical URLs, OpenGraph tags, and Schema.org JSON-LD structure.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend:**
  - [ ] Implement `src/app/sitemap.ts` and `src/app/robots.ts`
  - [ ] Implement `src/components/seo/JsonLd.tsx` (Organization, FinancialProduct, WebSite schemas)
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Navigate to `/sitemap.xml` → Returns valid XML sitemap with all clean slugs → Inspect page source → Schema.org JSON-LD present → ✅ Done.

---

### Phase 4 — Web Wallet Application & Core Financial Workflows

#### W-401 — Authenticated Wallet Dashboard & Live Portfolio Visualizer
**Root cause:** Users need a centralized dashboard showing Available, Reserved, and Total CC balances with portfolio charts.
**Goal:** Build `/wallet` dashboard with balance breakdown and interactive Recharts portfolio performance.
**Approach:** Create dashboard layout with authenticated session guard and live balance derivations.

- [ ] **RED — Component Test (`src/tests/components/WalletDashboard.test.tsx`):**
  - [ ] Test: Render Dashboard with 5,000 CC available and 50 CC reserved -> Verify total balance displays 5,050 CC and breakdown cards render correctly.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend:**
  - [ ] Implement `src/app/(wallet)/wallet/page.tsx`
  - [ ] Implement `src/components/wallet/BalanceOverviewCard.tsx`
  - [ ] Implement `src/components/wallet/PortfolioChart.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Log in as user → Dashboard shows real CC balance, available funds, and chart → ✅ Done.

---

#### W-402 — Receive Screen with Live QR Code & Address Clipboard
**Root cause:** Users need an effortless, authentic way to receive CC by copying their address or presenting a QR code.
**Goal:** Build `/wallet/receive` modal/page with formatted address, QR code generation, and copy confirmation.
**Approach:** Use `qrcode.react` to render high-contrast QR code with one-click clipboard copy.

- [ ] **RED — Component Test (`src/tests/components/ReceiveModal.test.tsx`):**
  - [ ] Test: Render Receive component -> Assert QR code element exists with user address encoded; click copy -> clipboard API called.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend:**
  - [ ] Implement `src/components/wallet/ReceiveCard.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Click "Receive" in wallet → QR code renders → Copy address button shows "Copied!" checkmark → Scan QR code on phone → Encodes correct `CC0x...` address → ✅ Done.

---

#### W-403 — Send CC Workflow with Real-Time Gas Estimation & Review Modal
**Root cause:** Users need a multi-step send flow with address validation, real-time fee calculation, review screen, and live status progress.
**Goal:** Build `/wallet/send` workflow with inline validation and confirmation modal.
**Approach:** React Hook Form + Zod schema validation + Server Action/API route submission.

- [ ] **RED — Integration / Component (`src/tests/integration/send-flow.integration.test.ts`):**
  - [ ] Test: Submit send form with valid recipient address and 50 CC -> API validates address checksum, verifies available balance, creates Mempool transaction, and returns 201 Created.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend & Backend:**
  - [ ] [Component] `src/components/wallet/SendForm.tsx` & `src/components/wallet/SendReviewModal.tsx`
  - [ ] [Controller] `src/app/api/wallet/send/route.ts`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Enter recipient `CC0x...` + 100 CC → Click Review → Modal shows Recipient, Network Fee (0.50 CC), Total Debit (100.50 CC) → Click Confirm → Live status changes to Queued → Block assigned → Confirmed → ✅ Done.

---

#### W-404 — Withdrawal Request Lifecycle & Activity Inspector Drawer
**Root cause:** Users need to request external withdrawals and inspect granular transaction receipts (Hash, Block Height, Gas, Timestamps).
**Goal:** Build `/wallet/withdraw` and `/wallet/activity` with slide-out receipt inspector.
**Approach:** Build withdrawal form and activity data table with drawer component.

- [ ] **RED — Integration (`src/tests/integration/withdrawal.integration.test.ts`):**
  - [ ] Test: Submit withdrawal request of 200 CC -> Available balance reserved -> Request stored with `REQUESTED` status -> Admin approves -> Status updates to `SETTLED`.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Backend & Frontend:**
  - [ ] [Service] `src/modules/admin/service/withdrawal.service.ts`
  - [ ] [Component] `src/components/wallet/TransactionDrawer.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Click transaction in activity list → Drawer opens showing full cryptographic receipt, block height, timestamp, and link to Explorer → ✅ Done.

---

### Phase 5 — Live Block Explorer

#### W-501 — Real-Time Block Explorer Feed & Universal Search
**Root cause:** Authentic transparency requires a public Explorer where anyone can search by Tx Hash, Address, or Block Height.
**Goal:** Build `/explorer` with live block stream, recent transactions, and search bar.
**Approach:** Server-rendered explorer with auto-refreshing SWR hook for new blocks.

- [ ] **RED — Integration (`src/tests/integration/explorer.integration.test.ts`):**
  - [ ] Test: Query `/api/explorer/search?q=0x123...` -> Return matching transaction record; query `/api/explorer/blocks` -> Return latest sealed blocks.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Backend & Frontend:**
  - [ ] [Controller] `src/app/api/explorer/search/route.ts` & `src/app/api/explorer/blocks/route.ts`
  - [ ] [Component] `src/app/(explorer)/explorer/page.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Navigate to `/explorer` → Live blocks tick every 10s → Paste Tx Hash into search bar → Instantly routes to transaction detail page → ✅ Done.

---

#### W-502 — Granular Transaction, Block & Address Inspector Pages
**Root cause:** Detailed dedicated views are needed for `/explorer/tx/[hash]`, `/explorer/block/[height]`, and `/explorer/address/[address]`.
**Goal:** Build all 3 explorer detail pages with complete cryptographic metadata.
**Approach:** Next.js dynamic routes with server-side rendering for instant loading.

- [ ] **RED — Integration (`src/tests/integration/explorer-details.integration.test.ts`):**
  - [ ] Test: Fetch `/explorer/tx/0x...` -> Assert response contains confirmations count, gas used, from/to addresses, and block parent hash.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Frontend:**
  - [ ] Implement `src/app/(explorer)/explorer/tx/[hash]/page.tsx`
  - [ ] Implement `src/app/(explorer)/explorer/block/[height]/page.tsx`
  - [ ] Implement `src/app/(explorer)/explorer/address/[address]/page.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Click any transaction on Explorer → Opens clean URL `/explorer/tx/0x4f8a...` → Displays confirmation progress, gas fee, and block height → ✅ Done.

---

### Phase 6 — Admin Command Center & Treasury Controls

#### W-601 — Admin Command Center Dashboard & Live Network Controls
**Root cause:** Platform administrators need back-office control over the network (block interval, gas fees, network pause) and treasury metrics.
**Goal:** Build `/admin` dashboard with RBAC protection and network configuration toggles.
**Approach:** Implement admin layout, middleware RBAC check (`admin:network:config`), and network setting update mutations.

- [ ] **RED — Integration (`src/tests/integration/admin-network.integration.test.ts`):**
  - [ ] Test: Platform Owner patches block interval to `5000ms` -> Verify database setting updates -> Non-admin user receives HTTP 403 Forbidden.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Backend & Frontend:**
  - [ ] [Controller] `src/app/api/admin/network/route.ts`
  - [ ] [Component] `src/app/(admin)/admin/network/page.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Log in as Admin → Open `/admin/network` → Change block interval from 10s to 5s → Block generator immediately adopts new interval → ✅ Done.

---

#### W-602 — CC Treasury Issuance & User Balance Management with Audit Log
**Root cause:** Admins need the ability to issue CC tokens to client wallets with mandatory reason codes and immutable audit trail logging.
**Goal:** Build `/admin/treasury` with minting interface and `/admin/audit-logs` viewer.
**Approach:** Admin Treasury Service creating a `TREASURY_MINT` ledger entry from `SYSTEM_TREASURY` account into user wallet with `AuditLog` recording.

- [ ] **RED — Integration (`src/tests/integration/treasury-mint.integration.test.ts`):**
  - [ ] Test: Admin mints 10,000 CC to User Wallet with reason "Client Demo Onboarding" -> Ledger credits User Available +10,000 CC, debits System Treasury -10,000 CC; AuditLog created with actor and before/after snapshot.
  - [ ] **Run — confirm RED.**
- [ ] **GREEN — Backend & Frontend:**
  - [ ] [Service] `src/modules/admin/service/treasury.service.ts`
  - [ ] [Component] `src/app/(admin)/admin/treasury/page.tsx`
  - [ ] Run test — **confirm GREEN.**
- [ ] **Verification chain:**
  - [ ] Admin issues 5,000 CC to client wallet → Client refreshes wallet → Balance instantly shows 5,000 CC → Audit log records action → ✅ Done.

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
