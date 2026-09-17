# Project Data: Coin Caret (CC)

This document serves as the master architectural blueprint, technical reference, domain rule dictionary, and permission matrix for **Coin Caret (`CC`)**.

---

## 1. Core Metadata

- **Project Name:** Coin Caret Platform
- **Native Currency:** Coin Caret (`CC`)
- **Display Symbol:** `CC` (with optional display valuation in USD)
- **Architecture:** Modular Monolith (Next.js 16 App Router, TypeScript, Prisma ORM, PostgreSQL, Railway)
- **Primary Hosting Target:** Railway (Next.js Web Service + Dedicated Background Block Worker Service + Managed PostgreSQL Database)
- **Database Names:**
  - Development: `coin_caret_dev` (Port `5432` on `127.0.0.1`)
  - Test / CI: `coin_caret_test` (Port `5433` on `127.0.0.1`)
- **Local Dedicated Port:** `3847` (avoiding default 3000 collisions)
- **Design Philosophy:** 100% authentic, high-end Web3 financial ecosystem. Clean, luxury dark-mode fintech interface (Dark Navy / Graphite + Emerald / Cyan accents), zero demo/toy banners, real cryptographic terminology, and instant responsiveness.

---

## 2. Technical Stack & Architecture

### Core Frameworks & Libraries
- **Next.js 16 (App Router):** Unified frontend and backend monolith. Organized by route groups `(marketing)`, `(wallet)`, `(explorer)`, and `(admin)`.
- **TypeScript (Strict Mode):** Full end-to-end type safety between database schemas, domain services, API routes, and UI components.
- **Prisma ORM:** Database client and migration manager with `relationMode = "foreignKeys"` (enforcing real PostgreSQL relational integrity).
- **Authentication:** NextAuth.js v5 (Auth.js) session-based credentials provider + bcrypt password hashing + optional 2FA/TOTP.
- **UI & Styling:** Tailwind CSS, shadcn/ui primitives, Radix UI, Lucide Icons, Recharts for financial graphs.
- **Motion & Scrolling:** **Lenis** (momentum smooth scroll physics) + **GSAP** (staggered entrance, ledger timelines, block feed animations).
- **Background Worker & Scheduling:** Dedicated persistent Node.js worker process for deterministic 10-second block generation, mempool batching, and confirmation progression.

---

## 3. Modular Monolith Domain Structure & Adapter Pattern

The codebase is strictly structured into decoupled domain modules:

```text
src/
├── app/                              # Next.js App Router (Routing & UI Surfaces)
│   ├── (marketing)/                  # coincaret.com (Landing, Technology, Whitepaper, Security)
│   ├── (wallet)/                     # app.coincaret.com (Dashboard, Send, Receive, Withdraw, Activity)
│   ├── (explorer)/                   # explorer.coincaret.com (Blocks, Transactions, Addresses)
│   └── (admin)/                      # admin.coincaret.com (Treasury, Users, Network settings, Logs)
│
├── modules/                          # CORE DOMAIN MODULES
│   ├── identity/                     # Users, Auth, Sessions, RBAC permissions
│   ├── wallets/                      # Wallet creation, address generation, address checksum validation
│   ├── ledger/                       # Double-entry accounting engine (Postings, Balances, Invariants)
│   ├── network/                      # BLOCKCHAIN & SETTLEMENT ENGINE
│   │   ├── engine.interface.ts       # Common interface (broadcastTx, getBlock, getFeeSchedule)
│   │   ├── internal-engine/          # V1 Engine: High-speed double-entry block generator & mempool
│   │   └── web3-engine/              # V2 Expansion: Plug-and-play adapter for real EVM/Solana RPCs
│   ├── explorer/                     # Aggregated chain search & real-time block stats
│   ├── admin/                        # Treasury minting, user freezing, withdrawal approvals, user management
│   ├── kyc/                          # KYC identity verification: document upload, encryption, gate service
│   └── notifications/                # Webhook & in-app alerts for incoming/outgoing funds
│
├── components/                       # Shared Design System (Tailwind, Radix UI, Charts, Modals)
├── lib/                              # Database client (Prisma), Redis/Queue client, Security helpers
└── types/                            # Shared domain DTOs, API contracts, and ledger types
```

---

## 4. Business Domain & Ledger Accounting Rules

### 4.1 Strict Double-Entry Accounting
Every financial movement is an immutable double-entry journal posting balancing to zero:
$$\sum \text{Debits} = \sum \text{Credits}$$

For a user transfer of `100.00 CC` with a `0.50 CC` network fee:
```text
Sender Available Account:          -100.50 CC (Debit)
Recipient Available Account:       +100.00 CC (Credit)
Network Gas / Fee Account:         +  0.50 CC (Credit)
------------------------------------------------------
Net Ledger Posting Balance:           0.00 CC (Balanced)
```

### 4.2 Transaction State Machine
Transactions advance deterministically through authoritative server-side states:

```text
[Submitted / Draft]
        │
        ▼
   [In Mempool]  <── Sender funds atomically reserved in pending account
        │
        ▼
 [Block Assigned] ── Assigned to Block #N by Background Worker
        │
        ▼
   [Confirming]  ── 1/3 -> 2/3 -> 3/3 Confirmations
        │
        ▼
   [Confirmed]   ── Finalized in ledger, funds available for recipient
```

### 4.3 Address Format & Checksums
- Wallet addresses follow an authentic Web3 cryptographic format: `CC0x` prefix followed by 40 hexadecimal characters with a checksum payload (e.g., `CC0x7F2a89C1e92DbA440F61E1b380295E8d58c1E4D9`).
- Client and server validate address checksums before allowing send submission.

### 4.4 Block Generation Rules
- **Block Interval:** 10 seconds (configurable via Admin Network settings).
- **Block Fields:** Block Height, Block Hash (SHA-256 synthetic hash), Previous Block Hash, Merkle Root, Transaction Count, Gas Used, Timestamp.
- **Required Confirmations:** 3 blocks before a transaction achieves terminal `Confirmed` status.

---

## 5. Roles & RBAC Permission Matrix

| Permission Code | Description | Platform Owner | Operations Admin | Finance Operator | Auditor | User |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `wallet:read:own` | View own balances and addresses | ✅ | ✅ | ✅ | ❌ | ✅ |
| `wallet:send` | Initiate transfers and withdrawals | ✅ | ✅ | ✅ | ❌ | ✅ |
| `explorer:read` | Query public blocks and transactions | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin:users:manage` | View all users, toggle KYC, review/approve/reject KYC documents, suspend accounts | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:kyc:review` | Approve or reject submitted KYC documents, view encrypted document files | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:config:write` | Update PlatformConfig keys including KYC_REQUIRED and KYC_REVIEW_MODE | ✅ | ❌ | ✅ | ❌ | ❌ |
| `admin:treasury:mint` | Issue any supported asset to user wallets (inline from user profile) | ✅ | ❌ | ✅ | ❌ | ❌ |
| `admin:withdraw:review`| Approve or reject withdrawal requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| `admin:network:config` | Adjust block intervals, gas fees, pause | ✅ | ❌ | ❌ | ❌ | ❌ |
| `admin:audit:read` | Access immutable system audit logs | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 6. Frontend, SEO & Layout Standards

- **Mobile-First Responsive Layout:** Fluid layouts designed from 320px to 4K displays. Cards, balance numbers, and charts scale smoothly.
- **Desktop 15% Margins / Container Gutter:** On desktop screens (`lg:` breakpoint and above), pages maintain a luxury 15% side margin (`px-[15%]`), focusing content into an elegant, high-end fintech container. On mobile devices, gutters adapt to `px-4` or `px-6`.
- **Lenis Smooth Scroll + GSAP:** Delivers physics-based momentum scrolling and subtle timeline animations on all public marketing and explorer surfaces.
- **Clean URL Slugs:** 100% RESTful clean URLs without `.html` extensions (e.g. `/wallet/send`, `/explorer/tx/[hash]`, `/whitepaper`).
- **Structured Data (Schema.org JSON-LD):** Implemented for `Organization`, `FinancialProduct`, `SoftwareApplication`, and `BreadcrumbList`.
- **Dynamic Sitemap:** Auto-generated `sitemap.xml` and `robots.txt` for maximum search engine indexability.

---

## 7. KYC Identity Verification System (Phase 9)

### 7.1 Registration Data Collected
Every user account requires: `displayName`, `email`, `password`, `phoneNumber`, and `address` (stored in `profiles` table).

### 7.2 KYC Documents Required
When KYC is enforced, users must upload to `/verify`:
1. **SSN Number** — AES-256-GCM encrypted at rest. Never stored or logged in plaintext.
2. **SSN Card Document** — Image (JPG/PNG) or PDF, max 10 MB.
3. **Federal Government ID** — Image or PDF, max 10 MB.
4. **Driver's License** — Image or PDF, max 10 MB.

### 7.3 KYC Access Gate State Machine
```text
NOT_SUBMITTED  →  SUBMITTED  →  PENDING_REVIEW  →  APPROVED  (FULL_ACCESS)
                                                 ↘  REJECTED  →  (re-upload) → SUBMITTED
```
- `NEEDS_UPLOAD` — No documents submitted. Wallet routes redirect to `/verify`.
- `AWAITING_REVIEW` — Documents submitted in manual mode. Wallet shows overlay.
- `REJECTED_REUPLOAD` — Admin rejected. User redirected to `/verify?reason=rejected`.
- `FULL_ACCESS` — Approved, or KYC not required for this user/platform.

### 7.4 Platform Config Keys for KYC
| Key | Values | Default | Description |
|:---|:---|:---|:---|
| `KYC_REQUIRED` | `"true"` / `"false"` | `"false"` | Platform-wide KYC gate. False = all users bypass KYC. |
| `KYC_REVIEW_MODE` | `"automatic"` / `"manual"` | `"automatic"` | Automatic = instant approval on upload. Manual = admin must review. |

### 7.5 Per-User KYC Override
- `User.kycRequired Boolean @default(true)` — When set to `false` by admin, that user bypasses KYC even if `KYC_REQUIRED = "true"` platform-wide.
- The demo account (`user@coincaret.com`) is seeded with `kycRequired = false`.

### 7.6 Document Storage Architecture
- Current backend: **PostgreSQL base64** via `DocumentStorageService` abstraction (`IDocumentStorage` interface).
- Future migration path: Swap to **Cloudflare R2** by replacing implementation class — zero changes to business logic, routes, or UI.
- Environment variable: `KYC_ENCRYPTION_KEY` (64-char hex, AES-256 key). Required in `.env` and `.env.test`.
