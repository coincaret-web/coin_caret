# Decision Log: Coin Caret Architectural Decision Records (ADRs)

This document tracks all foundational architectural, financial, infrastructure, and design decisions made for the **Coin Caret** platform.

---

## ADR-001: Next.js 16 App Router Modular Monolith Architecture

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** The platform encompasses four distinct user surfaces: Public Marketing Portal, Web Wallet Application, Block Explorer, and Admin Command Center. We needed to choose between microservices or a monolith.
- **Decision:** Build a single **Modular Monolith** using Next.js 16 App Router and TypeScript.
- **Rationale:**
  - Avoids distributed transaction overhead and microservice network latency.
  - Shares 100% of UI design system components, Prisma models, and TypeScript types across all 4 surfaces using route groups `(marketing)`, `(wallet)`, `(explorer)`, and `(admin)`.
  - Highly maintainable and deploys as a unified artifact to Railway.

---

## ADR-002: Total Client Realism & Zero Simulation Watermarks

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** The original product brief proposed heavy "Simulation / Practice / Toy" disclaimers across all screens. However, for client demonstrations and institutional trust, the platform must look and feel 100% authentic, live, and enterprise-grade.
- **Decision:** Eliminate all simulation/toy banners, disclaimers, and watermarks from the client-facing UI.
- **Rationale:**
  - The client must experience an authentic, high-end Web3 wallet and blockchain network.
  - Real cryptographic terminology (`Mainnet`, `CC0x...` addresses, `Network Gas Fees`, `3 Confirmations`, `Block Height`, `Merkle Roots`, `Tx Hashes`).
  - Behind the scenes, the internal double-entry engine guarantees complete safety, zero real-money liability, and deterministic control.

---

## ADR-003: Double-Entry Ledger Engine with Decimal Precision

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** Single-entry balance tracking (`UPDATE wallets SET balance = balance - 100`) leads to balance drift, race conditions, and untraceable financial anomalies.
- **Decision:** Implement strict **Double-Entry Bookkeeping** where every balance change is derived from balanced ledger entries ($\sum \text{Debits} == \sum \text{Credits}$) with `Decimal(28, 8)` precision.
- **Rationale:**
  - Ensures 100% mathematical integrity.
  - Balances cannot drift, and every single coin movement is auditable down to the transaction event level.
  - Atomic fund reservation in a single `prisma.$transaction` eliminates double-spending risks.

---

## ADR-004: Dedicated Persistent Background Worker for Block Generation

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** Serverless functions (like standard Vercel lambdas) shut down when inactive, halting block generation and transaction confirmations.
- **Decision:** Deploy a dedicated, persistent Node.js worker service on Railway alongside the Next.js web application.
- **Rationale:**
  - Generates blocks every 10 seconds 24/7 without requiring active user clicks.
  - Batches mempool transactions into blocks and advances confirmation counts (1/3 ➔ 2/3 ➔ 3/3).
  - Provides instant, realistic transaction settlement feedback to clients.

---

## ADR-005: Dual Database Isolation (Dev vs. Test) with IPv4 `127.0.0.1`

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** Running automated test suites against the development database wipes active test wallets and corrupts demo state. Furthermore, `localhost` resolution in Node 18+ causes IPv6 (`::1`) connection delays or `ECONNREFUSED`.
- **Decision:**
  - Enforce complete database separation: `coin_caret_dev` (Port 5432) and `coin_caret_test` (Port 5433).
  - Explicitly use IPv4 address `127.0.0.1` across all connection strings and Playwright configs.
- **Rationale:**
  - Test suites can seed and truncate data freely without touching development or demo data.
  - IPv4 guarantees zero DNS resolution latency and eliminates connection failures.

---

## ADR-006: Dedicated Non-Standard Local Port (`3847`)

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** Port 3000 frequently collides with other development projects running on local workstations.
- **Decision:** Configure local development and testing to run on dedicated port `3847` (with test server on `4190`).
- **Rationale:**
  - Eliminates port collision errors.
  - Ensures clean developer workflow when switching between repositories.

---

## ADR-007: Adapter Pattern for Seamless Real Web3 / EVM Blockchain Migration

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** When the demo passes, the system must easily plug into real blockchain infrastructure (e.g. Ethereum RPC, Solana RPC, Fireblocks MPC) without rebuilding the UI, auth, or database.
- **Decision:** Design the `NetworkEngine` using an **Adapter Pattern** (`engine.interface.ts`).
- **Rationale:**
  - The UI and controllers talk exclusively to the generic `NetworkEngine` interface.
  - V1 uses `InternalLedgerEngine` (internal block generation).
  - V2 swaps in `Web3NetworkEngine` with zero changes to the wallet UI or user dashboards.

---

## ADR-008: Motion & Layout Strategy (Lenis + GSAP + 15% Desktop Container)

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** The public marketing portal and explorer need a luxurious, Apple/Stripe-grade finish.
- **Decision:**
  - Integrate **Lenis** for smooth momentum scrolling.
  - Integrate **GSAP** for staggered entrance animations and block feed timeline visual cues.
  - Apply 15% responsive margins (`lg:px-[15%]`) on desktop viewports for an editorial, focused container look, while scaling down gracefully (`px-4` / `px-6`) on mobile viewports.

---

## ADR-009: Granular GitHub Actions CI Pipeline & TDD Protocol

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** Monolithic CI checks that run one single script make it difficult to identify why a build broke.
- **Decision:** Enforce discrete, sequential GitHub Actions workflow steps: `Lint` ➔ `Typecheck` ➔ `Unit Tests` ➔ `E2E Tests` ➔ `Production Build`, backed by the strict 5-principle TDD protocol.
- **Rationale:**
  - Instant visibility into the exact step and file that failed.
  - Prevents "phantom features" and guarantees zero regressions.

---

## ADR-010: Admin-Controlled CC/USD Rate via `PlatformConfig` Key-Value Store

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** The CC token is an internally-issued asset with no external market. Users and internal services need to express CC balances in familiar USD terms. We evaluated two approaches: (A) hardcode a constant rate in the codebase, or (B) store the rate as an admin-editable database record.
- **Decision:** Store the CC/USD exchange rate as a `PlatformConfig` key-value row (`key: "CC_USD_RATE"`) in PostgreSQL, editable only by `PLATFORM_OWNER` and `FINANCE_OPERATOR` roles via `PATCH /api/admin/config`, exposed to the client via a public-internal `GET /api/platform/cc-usd-rate` endpoint.
- **Rationale:**
  - **Flexibility:** The rate can be updated instantly without a code deploy or environment variable change.
  - **Auditability:** Every rate change writes an `AuditLog` entry with `beforeState`/`afterState`, giving Finance Operators a complete immutable history.
  - **RBAC Enforcement:** The write endpoint requires `admin:config:write` permission. Regular users cannot access or modify it.
  - **Display-Only:** The rate is used exclusively for informational USD display (`≈ $XXX.XX USD`). It does not affect any ledger entry, fund reservation, or double-entry balance.
  - **Zero Float Risk:** The rate is stored as a `String` in DB and parsed to `Decimal` in the service layer — never as a JavaScript float — preventing representation errors.
- **Alternatives Rejected:**
  - **Hardcoded constant:** Requires a code change and redeploy to adjust the rate. Violates operational flexibility.
  - **External price oracle:** CC has no external market. An oracle would return no meaningful data.

---

## ADR-011: CoinGecko Free API with Server-Side PostgreSQL Cache for Crypto Price Feed

- **Date:** 2026-09-16
- **Status:** APPROVED
- **Context:** The Conversion Calculator feature requires real-time prices for BTC, ETH, SOL, BNB, LTC, XRP, and DOGE. We evaluated three approaches: (A) fetch CoinGecko directly from the browser client, (B) proxy through Next.js API with an in-memory cache, or (C) proxy through Next.js API with a PostgreSQL-backed cache and 60-second TTL.
- **Decision:** Use the **CoinGecko v3 `simple/price` public REST API** as the price data source. Cache responses in a dedicated `ExternalPriceFeedCache` PostgreSQL table with a **60-second TTL**. Expose prices to the client via `GET /api/platform/crypto-prices`.
- **Rationale:**
  - **CoinGecko Free Tier:** No API key required for basic usage. Supports all 7 target coins. Widely trusted data source used by institutional platforms. Free tier allows sufficient polling at 60-second intervals.
  - **PostgreSQL Cache over In-Memory:** In-memory caches are reset on every serverless cold start. PostgreSQL cache persists across restarts, providing resilience and enabling stale-data fallback when CoinGecko is unreachable.
  - **Stale Fallback:** If CoinGecko is unreachable, the service returns the last known prices with an `isStale: true` flag. The UI renders a `Stale Data` warning chip instead of crashing — critical for client demo reliability.
  - **No Auth Required on Consumer Endpoint:** `GET /api/platform/crypto-prices` is public-internal (no session required) so the wallet client SWR hook can fetch it without auth token management overhead.
  - **Attribution:** The UI must display a "Powered by CoinGecko" badge, as required by CoinGecko's free API usage terms.
- **Supported Coins at Launch:** Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB (BNB), Litecoin (LTC), Ripple (XRP), Dogecoin (DOGE).
- **Conversion Formula:** `Equivalent = (CC_Amount × CC_USD_Rate) / Coin_USD_Price` — computed using `Decimal` arithmetic, never native floating point.
- **Alternatives Rejected:**
  - **Browser-direct CoinGecko fetch:** Exposes rate limit tokens to clients, blocked by CORS in some environments, and cannot implement server-side stale fallback.
  - **CoinMarketCap API:** Requires mandatory API key even at free tier; adds credential management overhead.
  - **Binance Public Ticker:** More complex response format; not all 7 coins have identical ticker IDs, increasing mapping fragility.
