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

---

## ADR-012: Multi-Currency Platform Architecture & Atomic Internal Swap Engine

- **Date:** 2026-09-17
- **Status:** APPROVED
- **Context:** To expand Coin Caret into a full multi-currency institutional ecosystem, users require dedicated wallets for 8 supported cryptocurrencies (`CC`, `BTC`, `ETH`, `SOL`, `BNB`, `LTC`, `XRP`, `DOGE`) and the ability to trade/swap between them internally with instant settlement.
- **Decision:** 
  1. **Per-Asset Wallet Provisioning:** Automatically create 8 distinct wallets and 16 double-entry ledger accounts (`AVAILABLE` and `RESERVED_PENDING`) per user at registration. Addresses use asset-specific prefixing (`BTC0x...`, `ETH0x...`, `CC0x...`) with SHA-256 mixed-case checksum verification.
  2. **Exchange Rate Matrix (`AssetPairRate`):** Store admin-controlled pair rates in an `asset_pair_rates` table. When no manual override exists for a pair, dynamically derive the cross-rate via the CoinGecko price cache: `(fromUsdPrice / toUsdPrice)`.
  3. **Atomic Dual-Leg Swap Engine:** Execute internal swaps within a single `prisma.$transaction` creating linked `Transaction` records (Type: `SWAP`) and posting balanced ledger entries across both asset accounts (debit source, credit source fee, credit target, credit treasury swap fee).
- **Rationale:**
  - **Zero Simulation Watermarks:** Users experience an authentic, high-end Web3 multi-asset trading platform with real-time conversion previews, price impact notices, and live block confirmations.
  - **Strict Ledger Invariance:** All trades respect double-entry bookkeeping ($\sum \text{Debits} == \sum \text{Credits}$) with `Decimal(28, 8)` precision.
  - **Institutional Control:** Admins retain full control over specific pair rates, treasury minting, and fee schedules per asset.
- **Alternatives Rejected:**
  - **External DEX Integration (Uniswap/Raydium):** Requires real liquidity pools and blockchain gas funding; introduces latency and slippage unsuited for an internal institutional platform.
  - **Single Mixed Wallet Account:** Blending different assets into a single ledger account violates accounting normalization and makes per-asset balance auditing error-prone.

---

## ADR-013: KYC Identity Verification System, Extended User Profiles & Admin User Management

- **Date:** 2026-09-18
- **Status:** APPROVED
- **Context:** The platform had no user identity verification, no admin visibility into registered users, a cumbersome treasury minting UX (global 80-item wallet dropdown), and a registration form collecting only name/email. Institutional and compliance requirements demand: extended contact profiles, identity document verification, admin controls over KYC enforcement, and a per-user admin management surface.

### Decision 1: Extended Registration Fields
- **Decision:** Add `phoneNumber` and `address` as required fields to the `profiles` table. Collected at registration alongside the existing `displayName`, `email`, and `password` fields.
- **Rationale:** These are the four standard contact data points for any financial platform account. Stored on `Profile` (not `User`) to keep identity data cleanly separated from auth credentials. Both fields are required (not optional) to prevent incomplete records.

### Decision 2: KYC Document Storage — PostgreSQL Base64 via IDocumentStorage Abstraction
- **Decision:** Store uploaded KYC documents (SSN Card, Federal ID, Driver's License) as Base64-encoded text in a `KycDocument.base64Data` PostgreSQL column. Wrap all storage operations behind an `IDocumentStorage` interface (`save()`, `retrieve()`, `delete()`) in `DocumentStorageService`.
- **Rationale:**
  - **Zero additional infrastructure:** No S3 bucket, no R2 account, no Railway Volume configuration required at launch. Everything lives in the existing PostgreSQL database.
  - **Migration-ready abstraction:** The `storageBackend` field (`"postgres"` | `"r2"` | `"railway_volume"`) and `storageRef` field enable a zero-refactor storage swap. When migrating to Cloudflare R2, only the service implementation body changes — routes, KYC service, and UI remain untouched.
  - **Scale constraints acknowledged:** Base64 adds ~37% overhead. At 100 users (3 docs each, ~950 KB raw each) = ~130 MB in DB. Acceptable for early-stage. Migration to R2 is triggered when this becomes a cost concern.
- **Alternatives Rejected:**
  - **Immediate Cloudflare R2 integration:** Adds R2 account setup, `@aws-sdk/client-s3` dependency, and credential management overhead before the feature is even validated. Premature infrastructure cost.
  - **Local filesystem storage:** Not viable for Railway deployment (ephemeral filesystem). Would require a persistence volume with no abstraction for future swap.

### Decision 3: SSN Encryption — AES-256-GCM with Separate IV and Auth Tag Storage
- **Decision:** The Social Security Number (SSN) is encrypted using Node.js `crypto.createCipheriv("aes-256-gcm", ...)` before any database write. The `ssnEncrypted`, `ssnIv`, and `ssnAuthTag` fields are stored separately in `UserVerification`. The encryption key is sourced exclusively from `process.env.KYC_ENCRYPTION_KEY` (64-char hex / 32 bytes).
- **Rationale:**
  - **GCM mode** provides both confidentiality (encryption) and integrity (authentication tag). A tampered ciphertext is detectable without attempting full decryption.
  - **Random IV per encryption call** means the same SSN encrypted twice produces different ciphertext — preventing rainbow table / frequency analysis attacks.
  - **Storing IV and AuthTag separately** from ciphertext follows the standard cryptographic practice and is required for decryption.
  - **Never logs or returns plaintext SSN** after the encryption call completes. This is a hard rule enforced in `kyc-encryption.service.ts`.
- **Key Management:** `KYC_ENCRYPTION_KEY` is added to `.env.example` as a placeholder comment. Each environment (dev, test, production) must have its own independently generated key. The test key is a fixed all-zeros value (acceptable for disposable test data).

### Decision 4: KYC Access Gate — Three-Tier Control (Platform → Per-User → Verification Status)
- **Decision:** The wallet access gate uses a three-tier resolution in strict priority order:
  1. If `PlatformConfig.KYC_REQUIRED = "false"` → `FULL_ACCESS` (platform off, everyone passes).
  2. If `User.kycRequired = false` → `FULL_ACCESS` (individual override).
  3. Check `UserVerification.status` → `NEEDS_UPLOAD`, `AWAITING_REVIEW`, `REJECTED_REUPLOAD`, or `FULL_ACCESS`.
- **Rationale:** This ordering ensures the most permissive rule wins (platform > user > document status), which is the correct compliance interpretation. Platform owners can shut off KYC entirely for development. Individual exemptions work without disrupting global policy.
- **Gate enforcement:** The wallet route group `layout.tsx` (server component) resolves gate status on every render and either renders children, redirects to `/verify`, or shows an overlay. No client-side gating that can be bypassed.

### Decision 5: KYC Review Mode — Automatic vs. Manual Toggle
- **Decision:** Add `PlatformConfig.KYC_REVIEW_MODE` key with values `"automatic"` | `"manual"`. In automatic mode, document submission instantly sets status to `APPROVED`. In manual mode, status becomes `PENDING_REVIEW` until admin action.
- **Rationale:**
  - **Automatic** is ideal for demos, client onboarding previews, and development where friction must be zero.
  - **Manual** matches real KYC workflows (Coinbase, Binance, etc.) where human review is a compliance requirement.
  - Switching modes mid-operation does not affect already-approved users — only new submissions from that point forward are affected.
- **Alternatives Rejected:**
  - **Third-party KYC API (Stripe Identity, Jumio, Onfido):** Requires API keys, billing accounts, and webhook infrastructure. Adds external dependency for a platform that needs to remain fully self-contained. Can be integrated as a future V2 upgrade via the same `KycService` interface.

### Decision 6: Admin Users Page & Per-User KYC Override
- **Decision:** Introduce a new `/admin/users` list page and `/admin/users/[userId]` detail page. The detail page includes: full identity profile, KYC status timeline, uploaded document viewer (via binary stream endpoint), approve/reject actions, per-user `kycRequired` toggle, and inline treasury minting.
- **Rationale:**
  - **Single-user minting UX:** The existing `/admin/treasury` wallet picker lists all wallets across all users (8 assets × N users = N×8 entries in one dropdown). For 10 users = 80 entries. This is operationally unusable. Moving minting into the user profile page scopes the picker to that user's 8 wallets — reducing the selection to 8 labeled currency tiles.
  - **No breaking change to treasury API:** The `POST /api/admin/treasury/mint` endpoint is unchanged. Only the UI component that calls it changes (from a global dropdown to a per-user inline panel).
  - **`kycRequired` override:** Allows surgical exemption of specific users (e.g., the demo account, internal test users, VIP clients) without disabling platform-wide KYC.
- **Alternatives Rejected:**
  - **Keeping treasury on `/admin/treasury` with improved search:** A search/filter on the dropdown doesn't fix the UX — it still requires the admin to know which wallet ID belongs to which user and asset. Contextual per-user minting eliminates this cognitive overhead entirely.
