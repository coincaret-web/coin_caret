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
